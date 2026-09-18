export type VictoryTransitionStage = 'settle' | 'loot' | 'march';

export interface VictoryTransitionPose {
  stage: VictoryTransitionStage;
  formationBlend: number;
  bob: number;
  stretch: number;
  lean: number;
  sceneryTravel: number;
  cameraAdvance: number;
  lootVisibility: number;
}

export interface VictoryMarchSlot {
  x: number;
  z: number;
}

const MARCH_START_SECONDS = 1.08;
const FORMATION_SETTLE_SECONDS = 0.72;

const MARCH_SLOTS: readonly VictoryMarchSlot[] = [
  { x: -0.52, z: -0.90 },
  { x: 0, z: -1.00 },
  { x: 0.52, z: -0.90 },
  { x: -0.66, z: -0.34 },
  { x: 0, z: -0.44 },
  { x: 0.66, z: -0.34 },
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  const u = clamp01(value);
  return u * u * (3 - 2 * u);
}

export function shouldUseMarchEntry(stageNumber: number, waveIndex: number): boolean {
  const safeStage = Number.isFinite(stageNumber) ? Math.max(1, Math.floor(stageNumber)) : 1;
  const safeWave = Number.isFinite(waveIndex) ? Math.max(0, Math.floor(waveIndex)) : 0;
  return safeStage > 1 || safeWave > 0;
}

export function getVictoryMarchSlot(slotIndex: number): VictoryMarchSlot {
  const safeIndex = Math.max(0, Math.min(MARCH_SLOTS.length - 1, Math.floor(slotIndex)));
  return MARCH_SLOTS[safeIndex]!;
}

export function getVictoryTransitionPose(elapsed: number, slotIndex: number): VictoryTransitionPose {
  const safeElapsed = Math.max(0, elapsed);
  const formationBlend = smoothstep((safeElapsed - 0.38) / FORMATION_SETTLE_SECONDS);
  const marchElapsed = Math.max(0, safeElapsed - MARCH_START_SECONDS);
  const marching = marchElapsed > 0;
  const cadence = marchElapsed * 7.8 + slotIndex * 0.82;
  const footPulse = marching ? Math.max(0, Math.sin(cadence)) : 0;
  const bob = footPulse * 0.07;
  const stretch = marching ? footPulse * 0.12 : 0;
  const lean = marching ? -0.05 + Math.sin(cadence * 0.5) * 0.018 : 0;
  const sceneryTravel = marchElapsed * 0.92;
  const cameraAdvance = marching ? 0.12 * smoothstep(marchElapsed / 0.72) : 0;
  const lootVisibility = safeElapsed < 0.18
    ? 0
    : safeElapsed < 0.42
      ? smoothstep((safeElapsed - 0.18) / 0.24)
      : 1 - smoothstep((safeElapsed - 0.92) / 0.52);

  return {
    stage: safeElapsed < 0.34 ? 'settle' : safeElapsed < MARCH_START_SECONDS ? 'loot' : 'march',
    formationBlend,
    bob,
    stretch,
    lean,
    sceneryTravel,
    cameraAdvance,
    lootVisibility: clamp01(lootVisibility),
  };
}

export function victoryStatusLabel(elapsed: number): string {
  const stage = getVictoryTransitionPose(elapsed, 0).stage;
  return stage === 'settle' ? '撃破' : '進軍中';
}
