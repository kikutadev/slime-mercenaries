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
      }
    }
  });

  it('uses a boss-class enemy for the boss encounter', () => {
    const boss = resolveEncounterDefinition('encounter.clover-road.05.boss');
    expect(boss.boss).toBe(true);
    expect(boss.enemies).toHaveLength(1);
    expect(boss.enemies[0]?.scaleClass).toBe('boss');
    expect(boss.enemies[0]?.id).toBe('great-mushroom');
  });
});
