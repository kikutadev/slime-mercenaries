import { describe, expect, it } from 'vitest';
import { getSlimePresentation } from './slimes';
import type { SlimeProgress } from '../domain/state';

function slime(typeId: 'sword' | 'bow', promotionPathId: string | null, fusionRank = 1): SlimeProgress {
  return {
    typeId,
    level: 20,
    jobTier: promotionPathId ? 2 : 1,
    promotionPathId,
    fusionRank,
    fusionFormId: typeId === 'sword' && fusionRank >= 2 ? 'greatsword' : 'base',
    assignment: 'battle',
  };
}

describe('promoted slime battle presentation', () => {
  it('switches Fighter to its Tier-2 model and combo behavior', () => {
    const fighter = getSlimePresentation(slime('sword', 'fighter'));
    expect(fighter.asset).toBe('assets/fighter-slime.glb');
    expect(fighter.battle.behaviorId).toBe('fighter-combo');
    expect(fighter.battle.equipmentAnchorName).toBe('WeaponAnchor');
    expect(fighter.battle.weaponTipName).toBe('WeaponTip');
  });

  it('switches Ranger to its Tier-2 model and double-shot behavior', () => {
    const ranger = getSlimePresentation(slime('bow', 'ranger'));
    expect(ranger.asset).toBe('assets/ranger-slime.glb');
    expect(ranger.battle.behaviorId).toBe('ranger-double-shot');
    expect(ranger.battle.equipmentAnchorName).toBe('RangerBowAnchor');
  });

  it('keeps Greatsword fusion presentation ahead of Fighter promotion visuals', () => {
    const greatsword = getSlimePresentation(slime('sword', 'fighter', 2));
    expect(greatsword.asset).toBe('assets/greatsword-slime.glb');
    expect(greatsword.battle.behaviorId).toBe('sword-melee');
  });
});
