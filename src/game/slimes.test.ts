import { describe, expect, it } from 'vitest';
import { getSlimePresentation } from './slimes';
import type { JobSlimeId } from '../domain/definitions';
import type { SlimeProgress } from '../domain/state';

function slime(typeId: 'sword' | 'bow', promotionPathId: string | null, fusionRank = 1): SlimeProgress {
  return {
    id: `test.${typeId}`,
    serial: 1,
    typeId,
    level: 20,
    jobTier: promotionPathId ? 2 : 1,
    promotionPathId,
    fusionRank,
    fusionFormId: typeId === 'sword' && fusionRank >= 2 ? 'greatsword' : 'base',
    mutationId: null,
    assignment: 'battle',
  };
}

function promotedSlime(typeId: JobSlimeId, promotionPathId: string, jobTier = 3): SlimeProgress {
  return {
    id: `test.${typeId}.${promotionPathId}`,
    serial: 2,
    typeId,
    level: 40,
    jobTier,
    promotionPathId,
    fusionRank: 1,
    fusionFormId: 'base',
    mutationId: null,
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

  it('keeps promoted Fighter identity when the same instance also has Greatsword Fusion state', () => {
    const fighter = getSlimePresentation(slime('sword', 'fighter', 2));
    expect(fighter.asset).toBe('assets/fighter-slime.glb');
    expect(fighter.battle.behaviorId).toBe('fighter-combo');
    expect(fighter.form).toBe('fighter');
  });

  it('uses Greatsword presentation for an unpromoted Tier-1 Sword at the Fusion milestone', () => {
    const greatsword = getSlimePresentation(slime('sword', null, 2));
    expect(greatsword.asset).toBe('assets/greatsword-slime.glb');
    expect(greatsword.battle.behaviorId).toBe('sword-melee');
  });

  it('assigns every Tier-3 specialization its own battle behavior instead of reusing Tier-2 behavior', () => {
    const cases = [
      ['sword', 'blademaster', 'blademaster-dash'],
      ['sword', 'berserker', 'berserker-heavy'],
      ['shield', 'paladin', 'paladin-barrier'],
      ['shield', 'fortress', 'fortress-plant'],
      ['bow', 'sniper', 'sniper-pierce'],
      ['bow', 'storm-archer', 'storm-archer-volley'],
      ['wand', 'archmage', 'archmage-burst'],
      ['wand', 'frost-mage', 'frost-mage-control'],
      ['dagger', 'ninja', 'ninja-vanish'],
      ['dagger', 'assassin', 'assassin-execute'],
      ['gun', 'cannoneer', 'cannoneer-shell'],
      ['gun', 'engineer', 'engineer-turret'],
    ] as const;
    const behaviorIds = cases.map(([typeId, path]) => getSlimePresentation(promotedSlime(typeId, path)).battle.behaviorId);
    expect(behaviorIds).toEqual(cases.map(([, , behaviorId]) => behaviorId));
    expect(new Set(behaviorIds).size).toBe(cases.length);
  });

});
