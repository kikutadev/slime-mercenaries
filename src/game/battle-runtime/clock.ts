export type BattleClockFrame = Readonly<{
  rawNow: number;
  simulationNow: number;
  hitStopActive: boolean;
}>;

/** Keeps visual-only hit stop from changing the domain-authored encounter clock. */
export class BattleClock {
  rawNow = 0;
  simulationNow = 0;

  private originRawNow: number | null = null;
  private pausedDuration = 0;
  private hitStopStartedAt = -Infinity;
  private hitStopEndsAt = -Infinity;

  advance(hostRawNow: number): BattleClockFrame {
    if (this.originRawNow === null) this.originRawNow = hostRawNow;
    const rawNow = Math.max(0, hostRawNow - this.originRawNow);
    this.rawNow = rawNow;
    const hitStopActive = rawNow + 1e-9 < this.hitStopEndsAt;
    this.simulationNow = this.resolveSimulationTime(rawNow);
    return { rawNow, simulationNow: this.simulationNow, hitStopActive };
  }

  startHitStop(durationSeconds: number): void {
    if (durationSeconds <= 0) return;
    if (this.rawNow + 1e-9 < this.hitStopEndsAt) {
      this.hitStopEndsAt = Math.max(this.hitStopEndsAt, this.rawNow + durationSeconds);
      return;
    }
    this.hitStopStartedAt = this.rawNow;
    this.hitStopEndsAt = this.rawNow + durationSeconds;
  }

  private resolveSimulationTime(rawNow: number): number {
    if (this.hitStopEndsAt > this.hitStopStartedAt) {
      if (rawNow + 1e-9 < this.hitStopEndsAt) {
        return this.hitStopStartedAt - this.pausedDuration;
      }
      this.pausedDuration += this.hitStopEndsAt - this.hitStopStartedAt;
      this.hitStopStartedAt = -Infinity;
      this.hitStopEndsAt = -Infinity;
    }
    return Math.max(0, rawNow - this.pausedDuration);
  }
}
