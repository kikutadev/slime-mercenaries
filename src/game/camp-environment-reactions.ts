import type { CampReaction } from './camp-types';

export interface CampFusionAltarPose {
  ringRotationY: number;
  ringScale: number;
  crystalScale: (index: number) => number;
}

export interface CampNurseryBubblePose {
  y: number;
  scaleY: number;
}

function reactionPulse(
  reaction: CampReaction,
  expected: CampReaction,
  elapsedSec: number,
  durationSec: number,
): number {
  if (reaction !== expected || elapsedSec < 0 || elapsedSec >= durationSec) return 0;
  return Math.sin((elapsedSec / durationSec) * Math.PI);
}

export function campFusionAltarPose(
  nowSec: number,
  fusionReady: boolean,
  reaction: CampReaction,
  reactionElapsedSec: number,
): CampFusionAltarPose {
  const pulse = reactionPulse(reaction, 'fusion', reactionElapsedSec, 1.15);
  return {
    ringRotationY: nowSec * (fusionReady ? 0.72 : 0.18) + pulse * 0.55,
    ringScale: fusionReady
      ? 1 + Math.sin(nowSec * 3.2) * 0.035 + pulse * 0.06
      : 1 + pulse * 0.06,
    crystalScale: (index: number) => fusionReady
      ? 1 + Math.sin(nowSec * 3.4 + index * 1.2) * 0.10 + pulse * 0.08
      : 1 + pulse * 0.08,
  };
}

export function campNurseryBubblePose(nowSec: number): CampNurseryBubblePose {
  return {
    y: 0.88 + Math.sin(nowSec * 1.8) * 0.035,
    scaleY: 1 + Math.sin(nowSec * 2.2) * 0.035,
  };
}

export function campFormationFlagRotation(
  nowSec: number,
  reaction: CampReaction,
  reactionElapsedSec: number,
): number {
  const base = Math.sin(nowSec * 1.6) * 0.025;
  if (reaction !== 'formation' || reactionElapsedSec < 0 || reactionElapsedSec >= 0.75) {
    return base;
  }

  return base
    + Math.sin(reactionElapsedSec * Math.PI * 5)
      * (1 - reactionElapsedSec / 0.75)
      * 0.16;
}

export function campTrainingDummyHit(
  reaction: CampReaction,
  reactionElapsedSec: number,
  residentPracticeImpact: number,
): number {
  const playerHit = reaction === 'level-up'
    && reactionElapsedSec >= 0
    && reactionElapsedSec < 0.55
    ? Math.sin(Math.min(1, reactionElapsedSec / 0.28) * Math.PI)
      * (1 - Math.min(1, reactionElapsedSec / 0.55))
    : 0;

  return Math.max(playerHit, residentPracticeImpact);
}
