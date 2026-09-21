import { describe, expect, it } from 'vitest';
import { getSlimePresentation } from './slimes';
import type { JobSlimeId } from '../domain/definitions';
import type { SlimeMutationId, SlimeProgress } from '../domain/state';

function fusedSlime(
  typeId: JobSlimeId,
  fusionFormId: string,
  jobTier: number,
  fusionRank: number,
  mutationId: SlimeMutationId | null = null,
): SlimeProgress {
  return {
    id: 'test.' + typeId + '.' + fusionFormId,
    serial: 1,
    typeId,
    level: 40,
    jobTier,
    fusionRank,
    fusionFormId,
    mutationId,
    assignment: 'battle',
  };
}

describe('Fusion-form battle presentation', () => {
  it('switches the Rank-3 Sword result to the Fighter model and combo behavior', () => {
    const fighter = getSlimePresentation(fusedSlime('sword', 'fighter', 2, 3));
    expect(fighter.asset).toBe('assets/fighter-slime.glb');
    expect(fighter.battle.behaviorId).toBe('fighter-combo');
    expect(fighter.battle.equipmentAnchorName).toBe('WeaponAnchor');
    expect(fighter.battle.weaponTipName).toBe('WeaponTip');
  });

  it('switches the Rank-3 Bow result to the Ranger model and double-shot behavior', () => {
    const ranger = getSlimePresentation(fusedSlime('bow', 'ranger', 2, 3));
    expect(ranger.asset).toBe('assets/ranger-slime.glb');
    expect(ranger.battle.behaviorId).toBe('ranger-double-shot');
    expect(ranger.battle.equipmentAnchorName).toBe('RangerBowAnchor');
  });

  it('uses Greatsword presentation for the first Sword Fusion milestone', () => {
    const greatsword = getSlimePresentation(fusedSlime('sword', 'greatsword', 1, 2));
    expect(greatsword.asset).toBe('assets/greatsword-slime.glb');
    expect(greatsword.battle.behaviorId).toBe('sword-melee');
  });

  it('layers mutation identity on top of the authored Tier-3 model and behavior', () => {
    const normal = getSlimePresentation(fusedSlime('sword', 'blademaster', 3, 4));
    const king = getSlimePresentation(fusedSlime('sword', 'blademaster', 3, 4, 'king'));
    const dragon = getSlimePresentation(fusedSlime('sword', 'blademaster', 3, 4, 'dragon'));

    expect(king.name).toBe('キングスライム');
    expect(king.asset).toBe(normal.asset);
    expect(king.battle.behaviorId).toBe(normal.battle.behaviorId);
    expect(king.mutationId).toBe('king');

    expect(dragon.name).toBe('ドラゴンスライム');
    expect(dragon.asset).toBe(normal.asset);
    expect(dragon.battle.maxHp).toBeGreaterThan(normal.battle.maxHp);
  });

  it('assigns every Rank-4 specialization its own battle behavior', () => {
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

    const behaviorIds = cases.map(([typeId, formId]) => (
      getSlimePresentation(fusedSlime(typeId, formId, 3, 4)).battle.behaviorId
    ));
    expect(behaviorIds).toEqual(cases.map(([, , behaviorId]) => behaviorId));
    expect(new Set(behaviorIds).size).toBe(cases.length);
  });
});
