import * as THREE from 'three';
import { clamp01 } from '../slime-motion';
import { getApproachCameraRetreat, getBossApproachPresentation } from '../battle-approach';
import { getVictoryPresentationElapsed, getVictoryTransitionPose } from '../battle-transition';
import { CAMERA_BASE_POSITION, CAMERA_LOOK_AT } from './layout';
import type { BattleSnapshot } from './types';

export interface BattleCameraFrame {
  rawNow: number;
  simulationNow: number;
  phase: BattleSnapshot['phase'];
  phaseStartedAt: number;
  result: BattleSnapshot['result'];
  bossEncounter: boolean;
  approachPresentationElapsed: number | null;
}

export class BattleCameraController {
  private shakeStartedAt = -Infinity;
  private shakeEndsAt = -Infinity;
  private shakeAmplitude = 0;

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  reset(): void {
    this.camera.position.copy(CAMERA_BASE_POSITION);
    this.camera.lookAt(CAMERA_LOOK_AT);
    this.shakeStartedAt = -Infinity;
    this.shakeEndsAt = -Infinity;
    this.shakeAmplitude = 0;
  }

  startShake(rawNow: number, duration: number, amplitude: number): void {
    this.shakeStartedAt = rawNow;
    this.shakeEndsAt = rawNow + duration;
    this.shakeAmplitude = Math.max(this.shakeAmplitude, amplitude);
  }

  update(frame: BattleCameraFrame): void {
    this.camera.position.copy(CAMERA_BASE_POSITION);
    if (frame.phase === 'approach') {
      const approachElapsed = frame.approachPresentationElapsed
        ?? frame.simulationNow - frame.phaseStartedAt;
      this.camera.position.z += frame.bossEncounter
        ? getBossApproachPresentation(approachElapsed).cameraRetreat
        : getApproachCameraRetreat(approachElapsed);
    } else if (frame.phase === 'result' && frame.result === 'victory') {
      const elapsed = getVictoryPresentationElapsed(
        frame.simulationNow - frame.phaseStartedAt,
        frame.bossEncounter,
      );
      const transition = getVictoryTransitionPose(elapsed, 0);
      this.camera.position.z -= transition.cameraAdvance;
    }

    if (frame.rawNow < this.shakeEndsAt) {
      const duration = Math.max(0.001, this.shakeEndsAt - this.shakeStartedAt);
      const u = clamp01((frame.rawNow - this.shakeStartedAt) / duration);
      const envelope = (1 - u) * this.shakeAmplitude;
      this.camera.position.x += Math.sin(frame.rawNow * 97) * envelope;
      this.camera.position.y += Math.sin(frame.rawNow * 131 + 0.7) * envelope * 0.55;
    } else {
      this.shakeAmplitude = 0;
    }

    this.camera.lookAt(CAMERA_LOOK_AT);
  }
}
