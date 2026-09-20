import { describe, expect, it } from 'vitest';
import { AREA_IDS, areaDefinitions } from '../domain';
import {
  ALL_ENCOUNTERS,
  MAX_NORMAL_ENEMIES,
  getEncounterDefinition,
  resolveEncounterDefinition,
} from './encounters';

const EXPECTED_BOSSES: Readonly<Record<string, string | null>> = {
  'area.clover-road': null,
  'area.mushroom-forest': 'great-mushroom',
  'area.amber-mine': 'amber-turtle',
  'area.sunken-marsh': 'great-marsh-frog',
  'area.frost-ruins': 'snow-statue-guardian',
  'area.ember-canyon': 'furnace-turtle',
  'area.moonlit-castle': 'moon-crown-knight',
  'area.dragon-crater': 'star-eater-dragon',
};

describe('enemy encounter content', () => {
  it('resolves every authored world-stage encounter id', () => {
    for (const areaId of AREA_IDS) {
      const area = areaDefinitions[areaId];
      for (const stage of area.stages) {
        for (const wave of stage.waves) {
          expect(getEncounterDefinition(wave.encounterId), wave.encounterId).toBeDefined();
        }
        if (stage.boss !== undefined) {
          expect(getEncounterDefinition(stage.boss.encounterId), stage.boss.encounterId).toBeDefined();
        }
      }
    }
  });

  it('keeps all normal encounters within the active enemy cap and definitions valid', () => {
    for (const encounter of ALL_ENCOUNTERS) {
      const resolved = resolveEncounterDefinition(encounter.id);
      if (!encounter.boss) expect(resolved.enemies.length).toBeLessThanOrEqual(MAX_NORMAL_ENEMIES);
      expect(resolved.enemies.length).toBeGreaterThan(0);
      for (const enemy of resolved.enemies) {
        expect(enemy.asset).toMatch(/\.glb$/);
        expect(enemy.maxHp).toBeGreaterThan(0);
        expect(enemy.moveSpeed).toBeGreaterThan(0);
        expect(enemy.attackInterval).toBeGreaterThan(0);
        expect(enemy.initialAttackDelay).toBeGreaterThanOrEqual(0);
        expect(enemy.initialAttackDelay).toBeLessThanOrEqual(2.5);
      }
    }
  });

  it('assigns every visible enemy a unique presentation slot per encounter', () => {
    for (const encounter of ALL_ENCOUNTERS) {
      const resolved = resolveEncounterDefinition(encounter.id);
      const slots = resolved.enemies.map((enemy) => enemy.formationSlot);
      expect(new Set(slots).size, encounter.id).toBe(slots.length);
    }
  });

  it('keeps Mushroom enemies out of Area 1 and gives Area 2 the Mushroom identity', () => {
    const cloverEnemyIds = ALL_ENCOUNTERS
      .filter((encounter) => encounter.id.startsWith('encounter.clover-road.'))
      .flatMap((encounter) => resolveEncounterDefinition(encounter.id).enemies.map((enemy) => enemy.id));
    expect(cloverEnemyIds.some((id) => id.includes('mushroom'))).toBe(false);

    const mushroomEnemyIds = new Set(
      ALL_ENCOUNTERS
        .filter((encounter) => encounter.id.startsWith('encounter.mushroom-forest.'))
        .flatMap((encounter) => resolveEncounterDefinition(encounter.id).enemies.map((enemy) => enemy.id)),
    );
    expect([...mushroomEnemyIds].sort()).toEqual([
      'great-mushroom',
      'plump-mushroom',
      'spore-mushroom',
      'tiny-mushroom',
    ]);
  });

  it('spotlights each Area 1 family before the final mixed gauntlet', () => {
    expect(resolveEncounterDefinition('encounter.clover-road.01.01').enemies.map((enemy) => enemy.id))
      .toEqual(['leafling', 'leafling', 'leafling']);
    expect(resolveEncounterDefinition('encounter.clover-road.03.01').enemies.map((enemy) => enemy.id))
      .toEqual(['bud-bloom', 'bud-bloom', 'bud-bloom']);
    expect(resolveEncounterDefinition('encounter.clover-road.04.01').enemies.map((enemy) => enemy.id))
      .toEqual(['round-hedgehog', 'round-hedgehog', 'round-hedgehog']);
  });

  it('stages ranged pressure behind frontline units in mixed fights', () => {
    const encounter = resolveEncounterDefinition('encounter.clover-road.05.02');
    const ranged = encounter.enemies.filter((enemy) => ['whirl-leaf', 'puff-flower', 'acorn-squirrel'].includes(enemy.id));
    const frontline = encounter.enemies.filter((enemy) => ['leafling', 'bud-bloom', 'round-hedgehog'].includes(enemy.id));
    expect(frontline.every((enemy) => enemy.formationSlot.startsWith('front-') || enemy.formationSlot.startsWith('mid-'))).toBe(true);
    expect(ranged.every((enemy) => enemy.formationSlot.startsWith('back-') || enemy.formationSlot.startsWith('rear-'))).toBe(true);
    expect(Math.min(...ranged.map((enemy) => enemy.initialAttackDelay)))
      .toBeGreaterThan(Math.min(...frontline.map((enemy) => enemy.initialAttackDelay)));
  });

  it('uses the authored production boss at stage 5 for Areas 2-8', () => {
    for (const areaId of AREA_IDS) {
      const expectedBossId = EXPECTED_BOSSES[areaId];
      const area = areaDefinitions[areaId];
      const boss = area.stages[4]?.boss;

      if (expectedBossId === null) {
        expect(boss, areaId).toBeUndefined();
        continue;
      }

      expect(boss, areaId).toBeDefined();
      const resolved = resolveEncounterDefinition(boss!.encounterId);
      expect(resolved.boss).toBe(true);
      expect(resolved.enemies).toHaveLength(1);
      expect(resolved.enemies[0]?.scaleClass).toBe('boss');
      expect(resolved.enemies[0]?.id).toBe(expectedBossId);
      expect(resolved.enemies[0]?.formationSlot).toBe('front-center');
    }
  });
});
