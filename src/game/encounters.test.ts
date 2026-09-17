import { describe, expect, it } from 'vitest';
import { cloverRoadStageDefinitions } from '../domain';
import { CLOVER_ROAD_ENCOUNTERS, MAX_NORMAL_ENEMIES, getEncounterDefinition, resolveEncounterDefinition } from './encounters';

describe('enemy encounter content', () => {
  it('resolves every current stage wave and boss encounter id', () => {
    for (const stage of cloverRoadStageDefinitions) {
      stage.waves.forEach((_wave, waveIndex) => {
        const id = `encounter.clover-road.${String(stage.stageNumber).padStart(2, '0')}.${String(waveIndex + 1).padStart(2, '0')}`;
        expect(getEncounterDefinition(id), id).toBeDefined();
      });
      if (stage.boss !== undefined) {
        const id = `encounter.clover-road.${String(stage.stageNumber).padStart(2, '0')}.boss`;
        expect(getEncounterDefinition(id), id).toBeDefined();
      }
    }
  });

  it('keeps normal encounters within the active enemy cap and definitions valid', () => {
    for (const encounter of CLOVER_ROAD_ENCOUNTERS) {
      const resolved = resolveEncounterDefinition(encounter.id);
      if (!encounter.boss) expect(resolved.enemies.length).toBeLessThanOrEqual(MAX_NORMAL_ENEMIES);
      expect(resolved.enemies.length).toBeGreaterThan(0);
      for (const enemy of resolved.enemies) {
        expect(enemy.asset).toMatch(/\.glb$/);
        expect(enemy.maxHp).toBeGreaterThan(0);
        expect(enemy.moveSpeed).toBeGreaterThan(0);
        expect(enemy.attackInterval).toBeGreaterThan(0);
        expect(enemy.initialAttackDelay).toBeGreaterThanOrEqual(0);
        expect(enemy.initialAttackDelay).toBeLessThanOrEqual(2);
      }
    }
  });

  it('assigns every visible enemy a unique presentation slot per encounter', () => {
    for (const encounter of CLOVER_ROAD_ENCOUNTERS) {
      const resolved = resolveEncounterDefinition(encounter.id);
      const slots = resolved.enemies.map((enemy) => enemy.formationSlot);
      expect(new Set(slots).size, encounter.id).toBe(slots.length);
    }
  });

  it('spotlights each new family before mixing it with older families', () => {
    expect(resolveEncounterDefinition('encounter.clover-road.02.01').enemies.map((enemy) => enemy.id))
      .toEqual(['leafling', 'leafling', 'leafling', 'leafling']);
    expect(resolveEncounterDefinition('encounter.clover-road.03.01').enemies.map((enemy) => enemy.id))
      .toEqual(['bud-bloom', 'bud-bloom', 'bud-bloom', 'bud-bloom']);
    expect(resolveEncounterDefinition('encounter.clover-road.04.01').enemies.map((enemy) => enemy.id))
      .toEqual(['round-hedgehog', 'round-hedgehog', 'round-hedgehog']);
  });

  it('stages ranged pressure behind a frontline in the stage 5 gauntlet', () => {
    const encounter = resolveEncounterDefinition('encounter.clover-road.05.02');
    const byId = new Map(encounter.enemies.map((enemy) => [enemy.id, enemy]));
    expect(byId.get('leafling')?.formationSlot.startsWith('front-')).toBe(true);
    expect(byId.get('bud-bloom')?.formationSlot.startsWith('front-')).toBe(true);
    expect(byId.get('round-hedgehog')?.formationSlot.startsWith('front-')).toBe(true);
    expect(byId.get('spore-mushroom')?.formationSlot.startsWith('back-')).toBe(true);
    expect(byId.get('whirl-leaf')?.initialAttackDelay).toBeGreaterThan(byId.get('round-hedgehog')?.initialAttackDelay ?? 0);
    expect(byId.get('puff-flower')?.initialAttackDelay).toBeGreaterThan(byId.get('whirl-leaf')?.initialAttackDelay ?? 0);
    expect(byId.get('acorn-squirrel')?.formationSlot).toBe('rear-center');
  });

  it('uses a boss-class enemy for the boss encounter', () => {
    const boss = resolveEncounterDefinition('encounter.clover-road.05.boss');
    expect(boss.boss).toBe(true);
    expect(boss.enemies).toHaveLength(1);
    expect(boss.enemies[0]?.scaleClass).toBe('boss');
    expect(boss.enemies[0]?.id).toBe('great-mushroom');
    expect(boss.enemies[0]?.formationSlot).toBe('front-center');
  });
});
