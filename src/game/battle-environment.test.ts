import { describe, expect, it } from 'vitest';
import { getBattleEnvironmentTheme, getBattleWaveSceneryPhase } from './battle-environment';

describe('battle environment themes', () => {
  it('provides a distinct authored theme for every current Clover Road stage', () => {
    const themes = [1, 2, 3, 4, 5].map(getBattleEnvironmentTheme);
    expect(new Set(themes.map((theme) => theme.id)).size).toBe(5);
    expect(new Set(themes.map((theme) => theme.groundColor)).size).toBe(5);
    expect(new Set(themes.map((theme) => theme.roadColor)).size).toBe(5);
    expect(themes.map((theme) => theme.feature)).toEqual(['clover', 'leaf', 'bloom', 'grove', 'hollow']);
  });

  it('progresses from open roadside fencing into the deep forest', () => {
    expect(getBattleEnvironmentTheme(1).fence).toBe('full');
    expect(getBattleEnvironmentTheme(2).fence).toBe('broken');
    expect(getBattleEnvironmentTheme(3).fence).toBe('broken');
    expect(getBattleEnvironmentTheme(4).fence).toBe('none');
    expect(getBattleEnvironmentTheme(5).fence).toBe('none');
    expect(getBattleEnvironmentTheme(5).roadWidth).toBeLessThan(getBattleEnvironmentTheme(1).roadWidth);
    expect(getBattleEnvironmentTheme(5).hemisphereIntensity).toBeLessThan(getBattleEnvironmentTheme(1).hemisphereIntensity);
  });

  it('clamps unsupported stage numbers and keeps wave scenery progression deterministic', () => {
    expect(getBattleEnvironmentTheme(-10).id).toBe('clover-road');
    expect(getBattleEnvironmentTheme(Number.NaN).id).toBe('clover-road');
    expect(getBattleEnvironmentTheme(999).id).toBe('deep-clover-hollow');
    expect(getBattleWaveSceneryPhase(0)).toBe(0);
    expect(getBattleWaveSceneryPhase(1)).toBeCloseTo(0.72);
    expect(getBattleWaveSceneryPhase(2)).toBeCloseTo(1.44);
    expect(getBattleWaveSceneryPhase(-2)).toBe(0);
  });
});
