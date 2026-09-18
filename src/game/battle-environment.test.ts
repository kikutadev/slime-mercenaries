import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createBattleEnvironment, getBattleEnvironmentTheme, getBattleWaveSceneryPhase } from './battle-environment';

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

  it('wraps long victory-march scenery travel inside the offscreen corridor', () => {
    const scene = new THREE.Scene();
    const environment = createBattleEnvironment(scene, 5, 2);
    const initial = environment.sceneryRoot.children.map((child) => child.position.z);

    environment.setTravelDistance(1000);
    for (const child of environment.sceneryRoot.children) {
      expect(Number.isFinite(child.position.z)).toBe(true);
      expect(child.position.z).toBeGreaterThanOrEqual(-10.8);
      expect(child.position.z).toBeLessThanOrEqual(4.8);
    }

    environment.setTravelDistance(0);
    environment.sceneryRoot.children.forEach((child, index) => {
      expect(child.position.z).toBeCloseTo(initial[index] ?? 0);
    });
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
