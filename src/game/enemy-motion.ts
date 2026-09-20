import type { EnemyBehaviorId } from './enemies';
import type { EnemyMotionProfile, EnemyPose } from './enemy-motion/shared';
import { getMushroomMotionProfile } from './enemy-motion/mushroom';
import { getLeafMotionProfile } from './enemy-motion/leaf';
import { getFlowerMotionProfile } from './enemy-motion/flower';
import { getCritterMotionProfile } from './enemy-motion/critter';
import { getMineMotionProfile } from './enemy-motion/mine';
import { getMarshMotionProfile } from './enemy-motion/marsh';
import { getFrostMotionProfile } from './enemy-motion/frost';

export * from './enemy-motion/shared';
export * from './enemy-motion/rig';
export * from './enemy-motion/face';
export * from './enemy-motion/mushroom';
export * from './enemy-motion/leaf';
export * from './enemy-motion/flower';
export * from './enemy-motion/critter';
export * from './enemy-motion/mine';
export * from './enemy-motion/marsh';
export * from './enemy-motion/frost';

export function getEnemyMotionProfile(behaviorId: EnemyBehaviorId | string): EnemyMotionProfile {
  if (behaviorId === 'mushroom-bump' || behaviorId === 'mushroom-heavy-bump' || behaviorId === 'mushroom-spore' || behaviorId === 'mushroom-boss') return getMushroomMotionProfile(behaviorId);
  if (behaviorId === 'leaf-hop-slap' || behaviorId === 'leaf-whirl') return getLeafMotionProfile(behaviorId);
  if (behaviorId === 'flower-bud-poke' || behaviorId === 'flower-pollen') return getFlowerMotionProfile(behaviorId);
  if (behaviorId === 'critter-roll' || behaviorId === 'critter-acorn') return getCritterMotionProfile(behaviorId);
  if (behaviorId === 'mine-crystal-tackle' || behaviorId === 'mine-burrow-pop' || behaviorId === 'mine-crystal-ring' || behaviorId === 'mine-golem-tackle' || behaviorId === 'mine-amber-boss') return getMineMotionProfile(behaviorId);
  if (behaviorId === 'marsh-frog-hop' || behaviorId === 'marsh-sprout-orb' || behaviorId === 'marsh-bubble-pulse' || behaviorId === 'marsh-lily-skim' || behaviorId === 'marsh-frog-boss') return getMarshMotionProfile(behaviorId);
  if (behaviorId === 'frost-snow-roll' || behaviorId === 'frost-ice-spike-shot' || behaviorId === 'frost-scarf-dash' || behaviorId === 'frost-lantern-ray' || behaviorId === 'frost-guardian-boss') return getFrostMotionProfile(behaviorId);
  throw new Error(`Unknown enemy motion behavior: ${behaviorId}`);
}

export function getEnemyAttackMotion(behaviorId: EnemyBehaviorId, u: number): EnemyPose { return getEnemyMotionProfile(behaviorId).attack(u); }
export function getEnemyAttackDuration(behaviorId: EnemyBehaviorId): number { return getEnemyMotionProfile(behaviorId).attackDuration; }
export function getEnemyAttackContactU(behaviorId: EnemyBehaviorId): number { return getEnemyMotionProfile(behaviorId).contactU; }