import {
  SLIME_MOTION_TIMING,
  getBowAttackMotion,
  getDaggerAttackMotion,
  getFighterAttackMotion,
  getGreatswordAttackMotion,
  getGuardianAttackMotion,
  getGunAttackMotion,
  getGunnerAttackMotion,
  getMageAttackMotion,
  getRangerAttackMotion,
  getShieldAttackMotion,
  getSwordAttackMotion,
  getWandAttackMotion,
  getRogueAttackMotion,
  type EquipmentPose,
  type SlimeDeformationPose,
} from './slime-motion';
import {
  TIER3_BOW_TIMING,
  getSniperAttackMotion,
  getStormArcherAttackMotion,
} from './slime-motions/tier3/bow';
import {
  TIER3_DEFENSE_TIMING,
  getFortressAttackMotion,
  getPaladinAttackMotion,
} from './slime-motions/tier3/defense';
import {
  TIER3_MAGIC_TIMING,
  getArchmageAttackMotion,
  getFrostMageAttackMotion,
} from './slime-motions/tier3/magic';
import {
  ASSASSIN_SIGNATURE_TIMING,
  NINJA_SIGNATURE_TIMING,
  getAssassinSignatureMotion,
  getNinjaSignatureMotion,
} from './slime-motions/tier3/rogue';
import {
  TIER3_SWORD_TIMING,
  getBerserkerAttackMotion,
  getBlademasterAttackMotion,
} from './slime-motions/tier3/sword';
import {
  CANNONEER_SIGNATURE_TIMING,
  ENGINEER_SIGNATURE_TIMING,
  getCannoneerSignatureMotion,
  getEngineerSignatureMotion,
} from './slime-motions/tier3/gun';
import type { BattleBehaviorId, SlimePresentation } from './slimes';

export type FusionPreviewPose = Readonly<{
  deformation: SlimeDeformationPose;
  equipment: EquipmentPose;
  bodyOffset: number;
  lateralOffset: number;
  rootYawOffset: number;
  bodyAlpha: number;
}>;

type MotionPose = Readonly<{
  deformation: SlimeDeformationPose;
  equipment: EquipmentPose;
  bodyOffset?: number;
  lateralOffset?: number;
  rootYawOffset?: number;
  bodyAlpha?: number;
  bodyVisibility?: number;
}>;

const REVEAL_LEAD_SEC = 0.88;
const RESULT_HOLD_SEC = 0.12;

export function getFusionPreviewAttackDurationSec(presentation: SlimePresentation): number {
  if (presentation.form === 'greatsword') return SLIME_MOTION_TIMING.greatswordAttack;
  switch (presentation.battle.behaviorId) {
    case 'sword-melee': return SLIME_MOTION_TIMING.swordAttack;
    case 'fighter-combo': return SLIME_MOTION_TIMING.fighterAttack;
    case 'blademaster-dash': return TIER3_SWORD_TIMING.blademasterAttack;
    case 'berserker-heavy': return TIER3_SWORD_TIMING.berserkerAttack;
    case 'bow-ranged': return SLIME_MOTION_TIMING.bowAttack;
    case 'ranger-double-shot': return SLIME_MOTION_TIMING.rangerAttack;
    case 'sniper-pierce': return TIER3_BOW_TIMING.sniperAttack;
    case 'storm-archer-volley': return TIER3_BOW_TIMING.stormArcherAttack;
    case 'shield-defender': return SLIME_MOTION_TIMING.shieldAttack;
    case 'guardian-guard': return SLIME_MOTION_TIMING.guardianAttack;
    case 'paladin-barrier': return TIER3_DEFENSE_TIMING.paladinAttack;
    case 'fortress-plant': return TIER3_DEFENSE_TIMING.fortressAttack;
    case 'wand-magic': return SLIME_MOTION_TIMING.wandAttack;
    case 'mage-aoe': return SLIME_MOTION_TIMING.mageAttack;
    case 'archmage-burst': return TIER3_MAGIC_TIMING.archmageAttack;
    case 'frost-mage-control': return TIER3_MAGIC_TIMING.frostMageAttack;
    case 'dagger-skirmisher': return SLIME_MOTION_TIMING.daggerAttack;
    case 'rogue-twin-strike': return SLIME_MOTION_TIMING.rogueAttack;
    case 'ninja-vanish': return NINJA_SIGNATURE_TIMING.duration;
    case 'assassin-execute': return ASSASSIN_SIGNATURE_TIMING.duration;
    case 'gun-ranged': return SLIME_MOTION_TIMING.gunAttack;
    case 'gunner-burst': return SLIME_MOTION_TIMING.gunnerAttack;
    case 'cannoneer-shell': return CANNONEER_SIGNATURE_TIMING.duration;
    case 'engineer-turret': return ENGINEER_SIGNATURE_TIMING.duration;
    case 'mimic-trick': return 0.8;
  }
}

export function getFusionCeremonyDurationSec(presentation: SlimePresentation): number {
  return REVEAL_LEAD_SEC + getFusionPreviewAttackDurationSec(presentation) + RESULT_HOLD_SEC;
}

export function getFusionPreviewAttackStartSec(): number {
  return REVEAL_LEAD_SEC;
}

export function getFusionPreviewPose(
  presentation: SlimePresentation,
  u: number,
): FusionPreviewPose {
  if (presentation.form === 'greatsword') return normalize(getGreatswordAttackMotion(u));

  const behaviorId = presentation.battle.behaviorId;
  return normalize(motionForBehavior(behaviorId, u));
}

function motionForBehavior(behaviorId: BattleBehaviorId, u: number): MotionPose {
  switch (behaviorId) {
    case 'sword-melee': return getSwordAttackMotion(u);
    case 'fighter-combo': return getFighterAttackMotion(u);
    case 'blademaster-dash': return getBlademasterAttackMotion(u);
    case 'berserker-heavy': return getBerserkerAttackMotion(u);
    case 'bow-ranged': return getBowAttackMotion(u);
    case 'ranger-double-shot': return getRangerAttackMotion(u);
    case 'sniper-pierce': return getSniperAttackMotion(u);
    case 'storm-archer-volley': return getStormArcherAttackMotion(u);
    case 'shield-defender': return getShieldAttackMotion(u);
    case 'guardian-guard': return getGuardianAttackMotion(u);
    case 'paladin-barrier': return getPaladinAttackMotion(u);
    case 'fortress-plant': return getFortressAttackMotion(u);
    case 'wand-magic': return getWandAttackMotion(u);
    case 'mage-aoe': return getMageAttackMotion(u);
    case 'archmage-burst': return getArchmageAttackMotion(u);
    case 'frost-mage-control': return getFrostMageAttackMotion(u);
    case 'dagger-skirmisher': return getDaggerAttackMotion(u);
    case 'rogue-twin-strike': return getRogueAttackMotion(u);
    case 'ninja-vanish': return getNinjaSignatureMotion(u);
    case 'assassin-execute': return getAssassinSignatureMotion(u);
    case 'gun-ranged': return getGunAttackMotion(u);
    case 'gunner-burst': return getGunnerAttackMotion(u);
    case 'cannoneer-shell': return getCannoneerSignatureMotion(u);
    case 'engineer-turret': return getEngineerSignatureMotion(u);
    case 'mimic-trick':
      return {
        deformation: { squash: 0, stretch: 0, lean: 0, wobble: 0, jump: 0 },
        equipment: { angle: 0, lift: 0, sweep: 0 },
      };
  }
}

function normalize(pose: MotionPose): FusionPreviewPose {
  return {
    deformation: pose.deformation,
    equipment: pose.equipment,
    bodyOffset: pose.bodyOffset ?? 0,
    lateralOffset: pose.lateralOffset ?? 0,
    rootYawOffset: pose.rootYawOffset ?? 0,
    bodyAlpha: pose.bodyAlpha ?? pose.bodyVisibility ?? 1,
  };
}
