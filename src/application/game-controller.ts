import {
  ApplicationStore,
  type CommandResult,
  type DomainEvent,
  type ProfileRepository,
} from 'idle-game-kit';
import {
  assignSlimeToFormation,
  buyPlainSlime,
  captureMimic,
  convertDuplicateToFusionCore,
  craftPlainSlime,
  createJobSlime,
  equipWeapon,
  enterAreaStage,
  forgeEquipment,
  fuseSlime,
  levelUpSlime,
  markCodexEntriesViewed,
  mutateSlime,
  removeSlimeFromFormation,
  startDispatch,
  advanceSlimeWorldFromWallClock,
  createInitialSlimeMercenariesState,
  type CodexCategory,
  type CombatAdvancePolicy,
  type DispatchContractId,
  type JobSlimeId,
  type SlimeInstanceId,
  type SlimeMercenariesState,
  type SlimeMutationId,
} from '../domain';
import { createSlimeMercenariesBrowserRepository } from '../platform/web';
import { syncSlimePortalProgress } from '../platform/portal-progress';
import {
  DEFAULT_PROFILE_ID,
  loadOrCreateSlimeProfile,
  saveSlimeProfile,
  type LoadedSlimeProfile,
} from './profile';
import {
  applyDevelopmentSandboxResources,
  prepareValidationRoster,
  resetValidationBattle,
  resetValidationSlimeProgress,
  setValidationSlimeLevel,
  stripLegacyDevelopmentSandboxResources,
} from './validation-mode';
import {
  readRuntimeSettings,
  writeRuntimeSettings,
  type EconomyMode,
} from './runtime-settings';
import { parseSlimeSave, serializeSlimeSave } from './save-transfer';

export type SlimeGameEventSource = 'offline' | 'live' | 'background' | 'command';

export type SlimeGameEventContext = Readonly<{
  source: SlimeGameEventSource;
  elapsedSec: number;
  fromAreaId: string;
  fromStage: number;
  fromWaveIndex: number;
  toAreaId: string;
  toStage: number;
  toWaveIndex: number;
}>;

export type SlimeGameEventListener = (
  events: readonly DomainEvent[],
  context: SlimeGameEventContext,
) => void;
export type SlimeGameErrorListener = (error: Error) => void;

export type SlimeWallClockAdvanceOptions = Readonly<{
  combatPolicy?: CombatAdvancePolicy;
  source?: Extract<SlimeGameEventSource, 'live' | 'background'>;
}>;

type ProductCommandResult<TReason extends string = string> = CommandResult<SlimeMercenariesState, TReason>;

type ResourceSnapshot = Readonly<{
  currencies: SlimeMercenariesState['currencies'];
  tokens: SlimeMercenariesState['tokens'];
}>;

export type SlimeGameControllerOptions = Readonly<{
  repository?: ProfileRepository<SlimeMercenariesState>;
  settingsStorage?: Pick<Storage, 'getItem' | 'setItem'> | null;
}>;

/**
 * Application boundary between React presentation and the authoritative product state.
 * UI components invoke product commands through this controller and never checkpoint saves directly.
 */
export class SlimeGameController {
  readonly store: ApplicationStore<SlimeMercenariesState>;

  readonly #repository: ProfileRepository<SlimeMercenariesState>;
  readonly #settingsStorage: Pick<Storage, 'getItem' | 'setItem'> | null | undefined;
  readonly #normalProfileId: string;
  readonly #developmentProfileId: string;
  readonly #eventListeners = new Set<SlimeGameEventListener>();
  readonly #errorListeners = new Set<SlimeGameErrorListener>();
  #saveChain: Promise<void> = Promise.resolve();
  #lastBackgroundCheckpointMs = 0;
  #initialized = false;
  #economyMode: EconomyMode;
  #activeProfileId: string;
  #developmentResources: ResourceSnapshot | null = null;
  #persistenceEpoch = 0;

  constructor(profileId = DEFAULT_PROFILE_ID, options: SlimeGameControllerOptions = {}) {
    this.#normalProfileId = profileId;
    this.#developmentProfileId = profileId + '.development';
    this.#repository = options.repository ?? createSlimeMercenariesBrowserRepository();
    this.#settingsStorage = options.settingsStorage;
    this.#economyMode = readRuntimeSettings(this.#settingsStorage).economyMode;
    this.#activeProfileId = this.profileIdForMode(this.#economyMode);
    this.store = new ApplicationStore(createInitialSlimeMercenariesState(Date.now()));
  }

  get initialized(): boolean {
    return this.#initialized;
  }

  get economyMode(): EconomyMode {
    return this.#economyMode;
  }

  /** Existing presentation name retained internally: true means the runtime resource sandbox is active. */
  get validationMode(): boolean {
    return this.#economyMode === 'development';
  }

  async initialize(nowMs = Date.now()): Promise<LoadedSlimeProfile> {
    const loaded = await this.loadModeProfile(this.#economyMode, nowMs);
    const persisted = stripLegacyDevelopmentSandboxResources(loaded.state);

    this.#activeProfileId = this.profileIdForMode(this.#economyMode);
    this.installPersistedState(persisted);
    if (this.#economyMode === 'normal') syncSlimePortalProgress(persisted, nowMs);
    this.#initialized = true;

    if (persisted !== loaded.state) this.queueCheckpoint(this.store.getSnapshot(), nowMs);
    this.emitEvents(loaded.offlineEvents, {
      source: 'offline',
      elapsedSec: loaded.appliedOfflineSec,
      fromAreaId: loaded.state.gameData.progression.currentAreaId,
      fromStage: loaded.state.gameData.progression.currentStage,
      fromWaveIndex: loaded.state.gameData.combat.currentWaveIndex,
      toAreaId: persisted.gameData.progression.currentAreaId,
      toStage: persisted.gameData.progression.currentStage,
      toWaveIndex: persisted.gameData.combat.currentWaveIndex,
    });
    return { ...loaded, state: this.store.getSnapshot() };
  }

  subscribeEvents(listener: SlimeGameEventListener): () => void {
    this.#eventListeners.add(listener);
    return () => this.#eventListeners.delete(listener);
  }

  subscribeErrors(listener: SlimeGameErrorListener): () => void {
    this.#errorListeners.add(listener);
    return () => this.#errorListeners.delete(listener);
  }

  async setEconomyMode(mode: EconomyMode, nowMs = Date.now()): Promise<void> {
    if (mode === this.#economyMode) return;

    const wasInitialized = this.#initialized;
    this.#initialized = false;
    const currentMode = this.#economyMode;
    const currentProfileId = this.#activeProfileId;

    try {
      // Drain the old profile before changing any mode-dependent persistence routing.
      this.queueCheckpoint(this.store.getSnapshot(), nowMs);
      await this.#saveChain;

      const epoch = ++this.#persistenceEpoch;
      const loaded = await this.loadModeProfile(mode, nowMs);
      if (epoch !== this.#persistenceEpoch) return;

      const persisted = stripLegacyDevelopmentSandboxResources(loaded.state);
      const targetProfileId = this.profileIdForMode(mode);
      if (persisted !== loaded.state) {
        await saveSlimeProfile(this.#repository, targetProfileId, persisted, nowMs);
      }

      this.#economyMode = mode;
      this.#activeProfileId = targetProfileId;
      writeRuntimeSettings({ economyMode: mode }, this.#settingsStorage);
      this.installPersistedState(persisted);
      if (mode === 'normal') syncSlimePortalProgress(persisted, nowMs);
    } catch (cause) {
      this.#economyMode = currentMode;
      this.#activeProfileId = currentProfileId;
      throw cause;
    } finally {
      this.#initialized = wasInitialized;
    }
  }

  advanceToWallClock(
    nowMs = Date.now(),
    options: SlimeWallClockAdvanceOptions = {},
  ): readonly DomainEvent[] {
    if (!this.#initialized) return [];
    const current = this.store.getSnapshot();
    const advanced = advanceSlimeWorldFromWallClock(
      current,
      nowMs,
      {},
      options.combatPolicy ?? {},
    );
    if (advanced.appliedOfflineSec <= 0) return [];

    const nextState = this.#economyMode === 'development'
      ? applyDevelopmentSandboxResources(advanced.state)
      : advanced.state;
    this.store.replaceState(nextState);
    this.emitEvents(advanced.events, {
      source: options.source ?? 'live',
      elapsedSec: advanced.appliedOfflineSec,
      fromAreaId: current.gameData.progression.currentAreaId,
      fromStage: current.gameData.progression.currentStage,
      fromWaveIndex: current.gameData.combat.currentWaveIndex,
      toAreaId: nextState.gameData.progression.currentAreaId,
      toStage: nextState.gameData.progression.currentStage,
      toWaveIndex: nextState.gameData.combat.currentWaveIndex,
    });

    if (nowMs - this.#lastBackgroundCheckpointMs >= 5_000) {
      this.#lastBackgroundCheckpointMs = nowMs;
      this.queueCheckpoint(nextState, nowMs);
    }
    return advanced.events;
  }

  checkpointNow(nowMs = Date.now()): Promise<void> {
    if (!this.#initialized) return Promise.resolve();
    this.queueCheckpoint(this.store.getSnapshot(), nowMs);
    return this.#saveChain;
  }

  exportSaveData(exportedAtMs = Date.now()): string {
    const persisted = this.stateForPersistence(this.store.getSnapshot());
    return serializeSlimeSave(persisted, exportedAtMs);
  }

  async importSaveData(serialized: string, nowMs = Date.now()): Promise<void> {
    const imported = stripLegacyDevelopmentSandboxResources(parseSlimeSave(serialized, nowMs));
    await this.replacePersistentState(imported, nowMs);
  }

  async deleteSaveData(nowMs = Date.now()): Promise<void> {
    const fresh = createInitialSlimeMercenariesState(nowMs);
    await this.replacePersistentState(fresh, nowMs, true);
  }

  craftPlainSlime(count = 1) {
    return this.execute((state) => craftPlainSlime(state, count));
  }

  buyPlainSlime(count = 1) {
    return this.execute((state) => buyPlainSlime(state, count));
  }

  createJobSlime(typeId: JobSlimeId) {
    return this.execute((state) => createJobSlime(state, typeId));
  }

  captureMimic() {
    return this.execute((state) => captureMimic(state));
  }

  levelUpSlime(slimeId: SlimeInstanceId, count = 1) {
    return this.execute((state) => levelUpSlime(state, slimeId, count));
  }

  fuseSlime(slimeId: SlimeInstanceId, fusionStepId?: string) {
    return this.execute((state) => fuseSlime(state, slimeId, fusionStepId));
  }

  convertDuplicateToFusionCore(slimeId: SlimeInstanceId) {
    return this.execute((state) => convertDuplicateToFusionCore(state, slimeId));
  }

  mutateSlime(slimeId: SlimeInstanceId, mutationId: SlimeMutationId) {
    return this.execute((state) => mutateSlime(state, slimeId, mutationId));
  }

  validationSetSlimeLevel(slimeId: SlimeInstanceId, level = 40) {
    return this.executeValidation((state) => setValidationSlimeLevel(state, slimeId, level));
  }

  validationResetSlime(slimeId: SlimeInstanceId) {
    return this.executeValidation((state) => resetValidationSlimeProgress(state, slimeId));
  }

  validationResetBattle() {
    return this.executeValidation((state) => resetValidationBattle(state));
  }

  validationPrepareRoster() {
    return this.executeValidation((state) => prepareValidationRoster(state));
  }

  assignSlime(slimeId: SlimeInstanceId, slotIndex: number) {
    return this.execute((state) => assignSlimeToFormation(state, slimeId, slotIndex));
  }

  removeSlime(slotIndex: number) {
    return this.execute((state) => removeSlimeFromFormation(state, slotIndex));
  }

  startDispatch(contractId: DispatchContractId, slimeId: SlimeInstanceId) {
    return this.execute((state) => startDispatch(state, contractId, slimeId));
  }

  forge(drawCount: 1 | 10) {
    return this.execute((state) => forgeEquipment(state, drawCount));
  }

  equipWeapon(slimeId: SlimeInstanceId, weaponDefinitionId: string) {
    return this.execute((state) => equipWeapon(state, slimeId, weaponDefinitionId));
  }

  enterAreaStage(areaId: string, stageNumber: number) {
    return this.execute((state) => enterAreaStage(state, areaId, stageNumber));
  }

  markCodexViewed(category: CodexCategory, entryIds: readonly string[]) {
    return this.execute((state) => markCodexEntriesViewed(state, category, entryIds));
  }

  private executeValidation<TReason extends string>(
    command: (state: SlimeMercenariesState) => ProductCommandResult<TReason>,
  ): ProductCommandResult<TReason | 'development-mode-disabled'> {
    if (this.#economyMode !== 'development') {
      return {
        accepted: false,
        state: this.store.getSnapshot(),
        events: [],
        reason: 'development-mode-disabled',
      };
    }
    return this.execute(command);
  }

  private execute<TReason extends string>(
    command: (state: SlimeMercenariesState) => ProductCommandResult<TReason>,
  ): ProductCommandResult<TReason> {
    const current = this.store.getSnapshot();
    const result = command(current);
    if (!result.accepted) return result;

    const nextState = this.#economyMode === 'development'
      ? applyDevelopmentSandboxResources(result.state)
      : result.state;
    const normalizedResult: ProductCommandResult<TReason> = { ...result, state: nextState };
    this.store.replaceState(nextState);
    this.emitEvents(result.events, {
      source: 'command',
      elapsedSec: 0,
      fromAreaId: current.gameData.progression.currentAreaId,
      fromStage: current.gameData.progression.currentStage,
      fromWaveIndex: current.gameData.combat.currentWaveIndex,
      toAreaId: nextState.gameData.progression.currentAreaId,
      toStage: nextState.gameData.progression.currentStage,
      toWaveIndex: nextState.gameData.combat.currentWaveIndex,
    });
    this.queueCheckpoint(nextState, Date.now());
    return normalizedResult;
  }

  private emitEvents(
    events: readonly DomainEvent[],
    context: SlimeGameEventContext,
  ): void {
    for (const listener of this.#eventListeners) listener(events, context);
  }

  private stateForPersistence(state: SlimeMercenariesState): SlimeMercenariesState {
    if (this.#economyMode !== 'development' || this.#developmentResources === null) return state;
    return restoreResources(state, this.#developmentResources);
  }

  private installPersistedState(state: SlimeMercenariesState): void {
    if (this.#economyMode === 'development') {
      this.#developmentResources = captureResources(state);
      this.store.replaceState(applyDevelopmentSandboxResources(state));
      return;
    }
    this.#developmentResources = null;
    this.store.replaceState(state);
  }

  private async replacePersistentState(
    state: SlimeMercenariesState,
    savedAtMs: number,
    deleteExisting = false,
  ): Promise<void> {
    const wasInitialized = this.#initialized;
    this.#initialized = false;
    const epoch = ++this.#persistenceEpoch;
    try {
      await this.#saveChain.catch(() => undefined);
      if (epoch !== this.#persistenceEpoch) return;
      if (deleteExisting) await this.#repository.delete(this.#activeProfileId);
      await saveSlimeProfile(this.#repository, this.#activeProfileId, state, savedAtMs);
      if (this.#economyMode === 'normal') syncSlimePortalProgress(state, savedAtMs);
      this.installPersistedState(state);
    } finally {
      if (epoch === this.#persistenceEpoch) this.#initialized = wasInitialized;
    }
  }

  private queueCheckpoint(state: SlimeMercenariesState, savedAtMs: number): void {
    const epoch = this.#persistenceEpoch;
    const persisted = this.stateForPersistence(state);
    const profileId = this.#activeProfileId;
    const syncPortal = this.#economyMode === 'normal';
    this.#saveChain = this.#saveChain
      .catch(() => undefined)
      .then(async () => {
        if (epoch !== this.#persistenceEpoch) return;
        await saveSlimeProfile(this.#repository, profileId, persisted, savedAtMs);
        if (syncPortal) syncSlimePortalProgress(persisted, savedAtMs);
      })
      .catch((cause: unknown) => {
        const error = cause instanceof Error ? cause : new Error(String(cause));
        for (const listener of this.#errorListeners) listener(error);
      });
  }

  private profileIdForMode(mode: EconomyMode): string {
    return mode === 'development' ? this.#developmentProfileId : this.#normalProfileId;
  }

  private async loadModeProfile(mode: EconomyMode, nowMs: number): Promise<LoadedSlimeProfile> {
    const profileId = this.profileIdForMode(mode);
    if (mode === 'normal') {
      return loadOrCreateSlimeProfile({
        repository: this.#repository,
        profileId,
        nowMs,
      });
    }

    const existingDevelopment = await this.#repository.load(profileId);
    if (existingDevelopment === null) {
      const normal = await loadOrCreateSlimeProfile({
        repository: this.#repository,
        profileId: this.#normalProfileId,
        nowMs,
      });
      const baseline = stripLegacyDevelopmentSandboxResources(normal.state);
      const developmentBaseline: SlimeMercenariesState = {
        ...baseline,
        // The development profile starts as a snapshot now, not as another offline-time claim.
        lastWallClockMs: nowMs,
      };
      await saveSlimeProfile(this.#repository, profileId, developmentBaseline, nowMs);
    }

    return loadOrCreateSlimeProfile({
      repository: this.#repository,
      profileId,
      nowMs,
    });
  }
}

function captureResources(state: SlimeMercenariesState): ResourceSnapshot {
  return {
    currencies: { ...state.currencies },
    tokens: { ...state.tokens },
  };
}

function restoreResources(
  state: SlimeMercenariesState,
  resources: ResourceSnapshot,
): SlimeMercenariesState {
  return {
    ...state,
    currencies: resources.currencies,
    tokens: resources.tokens,
  };
}