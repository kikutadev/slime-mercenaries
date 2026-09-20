import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { BattleRuntime } from './BattleRuntime';


vi.mock('./stage-environment', () => ({
  createStageEnvironment: async (
    scene: THREE.Scene,
    _baseUrl: string,
    areaId: string,
    stageNumber: number,
  ) => {
    const root = new THREE.Group();
    root.name = `TestEnvironment:${areaId}:${stageNumber}`;
    const sceneryRoot = new THREE.Group();
    root.add(sceneryRoot);
    let active = false;
    return {
      areaId,
      stageNumber,
      root,
      sceneryRoot,
      activate: () => {
        if (active) return;
        active = true;
        scene.add(root);
      },
      setTravelDistance: () => undefined,
      setWaveIndex: () => undefined,
      dispose: () => {
        if (!active) return;
        active = false;
        scene.remove(root);
      },
    };
  },
}));

function createRuntime(scene: THREE.Scene, camera: THREE.PerspectiveCamera, stageNumber: number) {
  return new BattleRuntime({
    scene,
    camera,
    baseUrl: '/',
    areaId: 'area.clover-road',
    stageNumber,
    waveIndex: 0,
    allies: [],
    enemies: [],
    authoritativeResult: null,
    authoritativeResultDelaySec: null,
    onSnapshot: () => undefined,
  });
}

describe('BattleRuntime scene lifecycle', () => {
  it('disposes only objects owned by the runtime being replaced', async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();

    const first = createRuntime(scene, camera, 1);
    await first.initialize();
    const firstOwned = new Set(scene.children);
    expect(firstOwned.size).toBeGreaterThan(0);

    const second = createRuntime(scene, camera, 2);
    await second.initialize();
    const secondOwned = scene.children.filter((child) => !firstOwned.has(child));
    expect(secondOwned.length).toBeGreaterThan(0);

    first.dispose();

    expect(scene.children.some((child) => firstOwned.has(child))).toBe(false);
    expect(secondOwned.every((child) => scene.children.includes(child))).toBe(true);

    second.dispose();
    expect(scene.children).toHaveLength(0);
  });
});
