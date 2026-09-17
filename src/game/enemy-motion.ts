import type { EnemyBehaviorId } from './enemies';
import type { EnemyMotionProfile, EnemyPose } from './enemy-motion/shared';
import {
  ENEMY_MOTION_THRESHOLDS,
  getGreatMushroomAttackMotion,
  getMushroomBumpAttackMotion,
  getMushroomHeavyAttackMotion,
  getMushroomMotionProfile,
  getMushroomSporeAttackMotion,
} from './enemy-motion/mushroom';

export * from './enemy-motion/shared';
export * from './enemy-motion/rig';
export * from './enemy-motion/mushroom';

export function getEnemyMotionProfile(behaviorId: EnemyBehaviorId | string): EnemyMotionProfile {
  if (behaviorId === 'mushroom-bump' || behaviorId === 'mushroom-heavy-bump' || behaviorId === 'mushroom-spore' || behaviorId === 'mushroom-boss') {
    return getMushroomMotionProfile(behaviorId);
  }
  throw new Error(`Unknown enemy motion behavior: ${behaviorId}`);
}

/** Compatibility façade retained while BattleRuntime migrates to motion profiles. */
export function getEnemyAttackMotion(behaviorId: EnemyBehaviorId, u: number): EnemyPose {
  if (behaviorId === 'mushroom-heavy-bump') return getMushroomHeavyAttackMotion(u);
  if (behaviorId === 'mushroom-spore') return getMushroomSporeAttackMotion(u);
  if (behaviorId === 'mushroom-boss') return getGreatMushroomAttackMotion(u);
  return getMushroomBumpAttackMotion(u);
}

export function getEnemyAttackDuration(behaviorId: EnemyBehaviorId): number {
  return getEnemyMotionProfile(behaviorId).attackDuration;
}

export function getEnemyAttackContactU(behaviorId: EnemyBehaviorId): number {
  return getEnemyMotionProfile(behaviorId).contactU;
}

export { ENEMY_MOTION_THRESHOLDS };
