import {
  ApplicationStore,
  type CommandResult,
  type DomainEvent,
  type ProfileRepository,
} from 'idle-game-kit';
import {
  assignSlimeToFormation,
  buyPlainSlime,
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
  fromStage: number;
  fromWaveIndex: number;
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
  readonly #profileId: string;
  readonly #eventListeners = new Set<SlimeGameEventListener>();
  readonly #errorListeners = new Set<SlimeGameErrorListener>();
  #saveChain: Promise<void> = Promise.resolve();
  #lastBackgroundCheckpointMs = 0;
  #initialized = false;
  #economyMode: EconomyMode;
  #normalResources: ResourceSnapshot | null = null;
  #persistenceEpoch = 0;

  constructor(profileId = DEFAULT_PROFILE_ID, options: SlimeGameControllerOptions = {}) {
    this.#profileId = profileId;
    this.#repository = options.repository ?? createSlimeMercenariesBrowserRepository();
    this.#settingsStorage = options.settingsStorage;
    this.#economyMode = readRuntimeSettings(this.#settingsStorage).economyMode;
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
    const loaded = await loadOrCreateSlimeProfile({
      repository: this.#repository,
      profileId: this.#profileId,
      nowMs,
    });

    // Old public validation builds wrote the artificial resource floor into IndexedDB. Remove that
    // subsidy once so switching back to normal economy is meaningful.
    const persisted = stripLegacyDevelopmentSandboxResources(loaded.state);
    this.#normalResources = this.#economyMode === 'development'
      ? captureResources(persisted)
      : null;
    const hydrated = this.#economyMode === 'development'
      ? applyDevelopmentSandboxResources(persisted)
      : persisted;

    this.store.replaceState(hydrated);
    this.#initialized = true;
    if (persisted !== loaded.state) this.queueCheckpoint(hydrated, nowMs);
    this.emitEvents(loaded.offlineEvents, {
      source: 'offline',
      elapsedSec: loaded.appliedOfflineSec,
      fromStage: loaded.state.gameData.progression.currentStage,
      fromWaveIndex: loaded.state.gameData.combat.currentWaveIndex,
      toStage: persisted.gameData.progression.currentStage,
      toWaveIndex: persisted.gameData.combat.currentWaveIndex,
    });
    return { ...loaded, state: hydrated };
  }

  subscribeEvents(listener: SlimeGameEventListener): () => void {
    this.#eventListeners.add(listener);
    return () => this.#eventListeners.delete(listener);
  }

  subscribeErrors(listener: SlimeGameErrorListener): () => void {
    this.#errorListeners.add(listener);
    return () => this.#errorListeners.delete(listener);
  }

  setEconomyMode(mode: EconomyMode, nowMs = Date.now()): void {
    if (mode === this.#economyMode) return;
    const current = this.store.getSnapshot();

    if (mode === 'development') {
      this.#normalResources = captureResources(current);
      this.#economyMode = mode;
      writeRuntimeSettings({ economyMode: mode }, this.#settingsStorage);
      const sandbox = applyDevelopmentSandboxResources(current);
      this.store.replaceState(sandbox);
      this.queueCheckpoint(sandbox, nowMs);
      return;
    }

    const restored = this.#normalResources === null
      ? current
      : restoreResources(current, this.#normalResources);
    this.#economyMode = mode;
    this.#normalResources = null;
    writeRuntimeSettings({ economyMode: mode }, this.#settingsStorage);
    this.store.replaceState(restored);
    this.queueCheckpoint(restored, nowMs);
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
      fromStage: current.gameData.progression.currentStage,
      fromWaveIndex: current.gameData.combat.currentWaveIndex,
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
      fromStage: current.gameData.progression.currentStage,
      fromWaveIndex: current.gameData.combat.currentWaveIndex,
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
    if (this.#economyMode !== 'development' || this.#normalResources === null) return state;
    return restoreResources(state, this.#normalResources);
  }

  private installPersistedState(state: SlimeMercenariesState): void {
    if (this.#economyMode === 'development') {
      this.#normalResources = captureResources(state);
      this.store.replaceState(applyDevelopmentSandboxResources(state));
      return;
    }
    this.#normalResources = null;
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
      if (deleteExisting) await this.#repository.delete(this.#profileId);
      await saveSlimeProfile(this.#repository, this.#profileId, state, savedAtMs);
      this.installPersistedState(state);
    } finally {
      if (epoch === this.#persistenceEpoch) this.#initialized = wasInitialized;
    }
  }

  private queueCheckpoint(state: SlimeMercenariesState, savedAtMs: number): void {
    const epoch = this.#persistenceEpoch;
    const persisted = this.stateForPersistence(state);
    this.#saveChain = this.#saveChain
      .catch(() => undefined)
      .then(async () => {
        if (epoch !== this.#persistenceEpoch) return;
        await saveSlimeProfile(this.#repository, this.#profileId, persisted, savedAtMs);
      })
      .catch((cause: unknown) => {
        const error = cause instanceof Error ? cause : new Error(String(cause));
        for (const listener of this.#errorListeners) listener(error);
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
