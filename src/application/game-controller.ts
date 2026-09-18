import { ApplicationStore, type CommandResult, type DomainEvent } from 'idle-game-kit';
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
  mutateSlime,
  promoteSlime,
  removeSlimeFromFormation,
  startDispatch,
  advanceSlimeWorldFromWallClock,
  createInitialSlimeMercenariesState,
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
import { applyValidationSandboxResources, prepareValidationRoster, PUBLIC_VALIDATION_MODE, resetValidationBattle, resetValidationSlimeProgress, setValidationSlimeLevel } from './validation-mode';

export type SlimeGameEventListener = (events: readonly DomainEvent[]) => void;
export type SlimeGameErrorListener = (error: Error) => void;

type ProductCommandResult<TReason extends string = string> = CommandResult<SlimeMercenariesState, TReason>;

/**
 * Application boundary between React presentation and the authoritative product state.
 * UI components invoke product commands through this controller and never checkpoint saves directly.
 */
export class SlimeGameController {
  readonly store: ApplicationStore<SlimeMercenariesState>;

  readonly #repository = createSlimeMercenariesBrowserRepository();
  readonly #profileId: string;
  readonly #eventListeners = new Set<SlimeGameEventListener>();
  readonly #errorListeners = new Set<SlimeGameErrorListener>();
  #saveChain: Promise<void> = Promise.resolve();
  #lastBackgroundCheckpointMs = 0;
  #initialized = false;

  constructor(profileId = DEFAULT_PROFILE_ID) {
    this.#profileId = profileId;
    this.store = new ApplicationStore(createInitialSlimeMercenariesState(Date.now()));
  }

  get initialized(): boolean {
    return this.#initialized;
  }

  get validationMode(): boolean {
    return PUBLIC_VALIDATION_MODE;
  }

  async initialize(nowMs = Date.now()): Promise<LoadedSlimeProfile> {
    const loaded = await loadOrCreateSlimeProfile({
      repository: this.#repository,
      profileId: this.#profileId,
      nowMs,
    });
    const hydrated = applyValidationSandboxResources(loaded.state);
    this.store.replaceState(hydrated);
    this.#initialized = true;
    if (hydrated !== loaded.state) this.queueCheckpoint(hydrated, nowMs);
    this.emitEvents(loaded.offlineEvents);
    return loaded;
  }

  subscribeEvents(listener: SlimeGameEventListener): () => void {
    this.#eventListeners.add(listener);
    return () => this.#eventListeners.delete(listener);
  }

  subscribeErrors(listener: SlimeGameErrorListener): () => void {
    this.#errorListeners.add(listener);
    return () => this.#errorListeners.delete(listener);
  }

  advanceToWallClock(nowMs = Date.now()): readonly DomainEvent[] {
    if (!this.#initialized) return [];
    const current = this.store.getSnapshot();
    const advanced = advanceSlimeWorldFromWallClock(current, nowMs);
    if (advanced.appliedOfflineSec <= 0) return [];

    const nextState = applyValidationSandboxResources(advanced.state);
    this.store.replaceState(nextState);
    this.emitEvents(advanced.events);

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

  fuseSlime(slimeId: SlimeInstanceId) {
    return this.execute((state) => fuseSlime(state, slimeId));
  }

  convertDuplicateToFusionCore(slimeId: SlimeInstanceId) {
    return this.execute((state) => convertDuplicateToFusionCore(state, slimeId));
  }

  promoteSlime(slimeId: SlimeInstanceId, promotionId?: string) {
    return this.execute((state) => promoteSlime(state, slimeId, promotionId));
  }

  mutateSlime(slimeId: SlimeInstanceId, mutationId: SlimeMutationId) {
    return this.execute((state) => mutateSlime(state, slimeId, mutationId));
  }

  validationSetSlimeLevel(slimeId: SlimeInstanceId, level = 40) {
    return this.execute((state) => setValidationSlimeLevel(state, slimeId, level));
  }

  validationResetSlime(slimeId: SlimeInstanceId) {
    return this.execute((state) => resetValidationSlimeProgress(state, slimeId));
  }

  validationResetBattle() {
    return this.execute((state) => resetValidationBattle(state));
  }

  validationPrepareRoster() {
    return this.execute((state) => prepareValidationRoster(state));
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

  private execute<TReason extends string>(
    command: (state: SlimeMercenariesState) => ProductCommandResult<TReason>,
  ): ProductCommandResult<TReason> {
    const current = this.store.getSnapshot();
    const result = command(current);
    if (!result.accepted) return result;

    const nextState = applyValidationSandboxResources(result.state);
    const normalizedResult: ProductCommandResult<TReason> = { ...result, state: nextState };
    this.store.replaceState(nextState);
    this.emitEvents(result.events);
    this.queueCheckpoint(nextState, Date.now());
    return normalizedResult;
  }

  private emitEvents(events: readonly DomainEvent[]): void {
    if (events.length === 0) return;
    for (const listener of this.#eventListeners) listener(events);
  }

  private queueCheckpoint(state: SlimeMercenariesState, savedAtMs: number): void {
    this.#saveChain = this.#saveChain
      .catch(() => undefined)
      .then(() => saveSlimeProfile(this.#repository, this.#profileId, state, savedAtMs))
      .catch((cause: unknown) => {
        const error = cause instanceof Error ? cause : new Error(String(cause));
        for (const listener of this.#errorListeners) listener(error);
      });
  }
}
