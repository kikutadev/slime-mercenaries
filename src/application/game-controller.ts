import { ApplicationStore, type CommandResult, type DomainEvent } from 'idle-game-kit';
import {
  assignSlimeToFormation,
  buyPlainSlime,
  craftPlainSlime,
  createJobSlime,
  equipWeapon,
  forgeEquipment,
  fuseSlime,
  levelUpSlime,
  promoteSlime,
  removeSlimeFromFormation,
  startDispatch,
  advanceSlimeWorldFromWallClock,
  createInitialSlimeMercenariesState,
  type DispatchContractId,
  type JobSlimeId,
  type SlimeMercenariesState,
} from '../domain';
import { createSlimeMercenariesBrowserRepository } from '../platform/web';
import {
  DEFAULT_PROFILE_ID,
  loadOrCreateSlimeProfile,
  saveSlimeProfile,
  type LoadedSlimeProfile,
} from './profile';

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
    // Temporary bootstrap state is never rendered as ready data. initialize() hydrates the durable profile.
    this.store = new ApplicationStore(createInitialSlimeMercenariesState(Date.now()));
  }

  get initialized(): boolean {
    return this.#initialized;
  }

  async initialize(nowMs = Date.now()): Promise<LoadedSlimeProfile> {
    const loaded = await loadOrCreateSlimeProfile({
      repository: this.#repository,
      profileId: this.#profileId,
      nowMs,
    });
    this.store.replaceState(loaded.state);
    this.#initialized = true;
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

  /** Advance online combat/dispatch using the same wall-clock path as offline resume. */
  advanceToWallClock(nowMs = Date.now()): readonly DomainEvent[] {
    if (!this.#initialized) return [];
    const current = this.store.getSnapshot();
    const advanced = advanceSlimeWorldFromWallClock(current, nowMs);
    if (advanced.appliedOfflineSec <= 0) return [];

    this.store.replaceState(advanced.state);
    this.emitEvents(advanced.events);

    // Continuous progression is coalesced; explicit player commands checkpoint immediately.
    if (nowMs - this.#lastBackgroundCheckpointMs >= 5_000) {
      this.#lastBackgroundCheckpointMs = nowMs;
      this.queueCheckpoint(advanced.state, nowMs);
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

  createJobSlime(slimeId: JobSlimeId) {
    return this.execute((state) => createJobSlime(state, slimeId));
  }

  levelUpSlime(slimeId: JobSlimeId, count = 1) {
    return this.execute((state) => levelUpSlime(state, slimeId, count));
  }

  fuseSlime(slimeId: JobSlimeId) {
    return this.execute((state) => fuseSlime(state, slimeId));
  }

  promoteSlime(slimeId: JobSlimeId) {
    return this.execute((state) => promoteSlime(state, slimeId));
  }

  assignSlime(slimeId: JobSlimeId, slotIndex: number) {
    return this.execute((state) => assignSlimeToFormation(state, slimeId, slotIndex));
  }

  removeSlime(slotIndex: number) {
    return this.execute((state) => removeSlimeFromFormation(state, slotIndex));
  }

  startDispatch(contractId: DispatchContractId, slimeId: JobSlimeId) {
    return this.execute((state) => startDispatch(state, contractId, slimeId));
  }

  forge(drawCount: 1 | 10) {
    return this.execute((state) => forgeEquipment(state, drawCount));
  }

  equipWeapon(slimeId: JobSlimeId, weaponDefinitionId: string) {
    return this.execute((state) => equipWeapon(state, slimeId, weaponDefinitionId));
  }

  private execute<TReason extends string>(
    command: (state: SlimeMercenariesState) => ProductCommandResult<TReason>,
  ): ProductCommandResult<TReason> {
    const current = this.store.getSnapshot();
    const result = command(current);
    if (!result.accepted) return result;

    this.store.replaceState(result.state);
    this.emitEvents(result.events);
    this.queueCheckpoint(result.state, Date.now());
    return result;
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
