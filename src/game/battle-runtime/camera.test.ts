import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BattleCameraController } from './camera';
import {
  BOSS_CAMERA_BASE_POSITION,
  CAMERA_BASE_POSITION,
} from './layout';

describe('BattleCameraController framing', () => {
  it('uses close framing for normal combat and wide framing for bosses', () => {
    const camera = new THREE.PerspectiveCamera();
    const controller = new BattleCameraController(camera);

    controller.update({
      rawNow: 10,
      simulationNow: 10,
      phase: 'combat',
      phaseStartedAt: 0,
      result: null,
      bossEncounter: false,
      approachPresentationElapsed: null,
    });
    expect(camera.position.toArray()).toEqual(CAMERA_BASE_POSITION.toArray());

    controller.update({
      rawNow: 10,
      simulationNow: 10,
      phase: 'combat',
      phaseStartedAt: 0,
      result: null,
      bossEncounter: true,
      approachPresentationElapsed: null,
    });
    expect(camera.position.toArray()).toEqual(BOSS_CAMERA_BASE_POSITION.toArray());
  });
});
