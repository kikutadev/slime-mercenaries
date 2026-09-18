import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BattleRuntime } from './BattleRuntime';

function createRuntime(scene: THREE.Scene, camera: THREE.PerspectiveCamera, stageNumber: number) {
  return new BattleRuntime({
    scene,
    camera,
    baseUrl: '/',
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
