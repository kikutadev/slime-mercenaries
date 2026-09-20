import {
  SLIME_MOTION_THRESHOLDS,
  SLIME_MOTION_TIMING,
  getGunnerShotReleaseU,
  getRangerShotReleaseU,
} from '../game/slime-motion';
import { TIER3_SWORD_TIMING } from '../game/slime-motions/tier3/sword';
import { TIER3_BOW_TIMING } from '../game/slime-motions/tier3/bow';
import { TIER3_DEFENSE_TIMING } from '../game/slime-motions/tier3/defense';
import { TIER3_MAGIC_TIMING } from '../game/slime-motions/tier3/magic';
import { ASSASSIN_SIGNATURE_TIMING, NINJA_SIGNATURE_TIMING } from '../game/slime-motions/tier3/rogue';
import { CANNONEER_SIGNATURE_TIMING, ENGINEER_SIGNATURE_TIMING } from '../game/slime-motions/tier3/gun';
import type { GalleryMotionId, SlimeGalleryDefinition } from './types';

export function galleryTargetDistance(definition: SlimeGalleryDefinition): number {
  if (definition.id === 'sniper' || definition.id === 'storm-archer') return 1.42;
  if (definition.modelKind === 'bow' || definition.modelKind === 'wand' || definition.modelKind === 'gun') return 1.55;
  if (definition.modelKind === 'shield') return 0.82;
  return 0.95;
}

export function galleryClipDuration(
  motion: GalleryMotionId,
  definition: SlimeGalleryDefinition,
): number {
  if (motion === 'move') return 1.55;
  if (motion === 'defeat') return SLIME_MOTION_TIMING.allyDefeat;
  if (motion !== 'attack') return 2.4;

  if (definition.id === 'blademaster') return TIER3_SWORD_TIMING.blademasterAttack;
  if (definition.id === 'berserker') return TIER3_SWORD_TIMING.berserkerAttack;
  if (definition.id === 'sniper') return TIER3_BOW_TIMING.sniperAttack;
  if (definition.id === 'storm-archer') return TIER3_BOW_TIMING.stormArcherAttack;
  if (definition.id === 'paladin') return TIER3_DEFENSE_TIMING.paladinAttack;
  if (definition.id === 'fortress') return TIER3_DEFENSE_TIMING.fortressAttack;
  if (definition.id === 'archmage') return TIER3_MAGIC_TIMING.archmageAttack;
  if (definition.id === 'frost-mage') return TIER3_MAGIC_TIMING.frostMageAttack;
  if (definition.id === 'ninja') return NINJA_SIGNATURE_TIMING.duration;
  if (definition.id === 'assassin') return ASSASSIN_SIGNATURE_TIMING.duration;
  if (definition.id === 'cannoneer') return CANNONEER_SIGNATURE_TIMING.duration;
  if (definition.id === 'engineer') return ENGINEER_SIGNATURE_TIMING.duration;
  if (definition.id === 'fighter') return SLIME_MOTION_TIMING.fighterAttack;
  if (definition.id === 'guardian') return SLIME_MOTION_TIMING.guardianAttack;
  if (definition.id === 'mage') {
    const releaseAt = SLIME_MOTION_TIMING.mageAttack * SLIME_MOTION_THRESHOLDS.mageReleaseU;
    return releaseAt + SLIME_MOTION_TIMING.magicOrbFlight;
  }
  if (definition.id === 'rogue') return SLIME_MOTION_TIMING.rogueAttack;
  if (definition.id === 'gunner') {
    const releaseAt = SLIME_MOTION_TIMING.gunnerAttack * getGunnerShotReleaseU(2);
    return releaseAt + SLIME_MOTION_TIMING.bulletFlight;
  }
  if (definition.id === 'ranger') {
    return SLIME_MOTION_TIMING.rangerAttack * getRangerShotReleaseU(1)
      + SLIME_MOTION_TIMING.arrowFlight;
  }

  if (definition.modelKind === 'greatsword') return SLIME_MOTION_TIMING.greatswordAttack;
  if (definition.modelKind === 'bow') {
    const releaseAt = SLIME_MOTION_TIMING.bowAttack * SLIME_MOTION_THRESHOLDS.bowReleaseU;
    return releaseAt + SLIME_MOTION_TIMING.arrowFlight;
  }
  if (definition.modelKind === 'shield') return SLIME_MOTION_TIMING.shieldAttack;
  if (definition.modelKind === 'wand') {
    const releaseAt = SLIME_MOTION_TIMING.wandAttack * SLIME_MOTION_THRESHOLDS.wandReleaseU;
    return releaseAt + SLIME_MOTION_TIMING.magicOrbFlight;
  }
  if (definition.modelKind === 'dagger') return SLIME_MOTION_TIMING.daggerAttack;
  if (definition.modelKind === 'gun') {
    const releaseAt = SLIME_MOTION_TIMING.gunAttack * SLIME_MOTION_THRESHOLDS.gunReleaseU;
    return releaseAt + SLIME_MOTION_TIMING.bulletFlight;
  }
  return SLIME_MOTION_TIMING.swordAttack;
}
