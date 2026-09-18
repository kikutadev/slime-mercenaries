import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BattleSceneModel } from '../application/selectors/battle-scene';
import { BattleRuntime, type BattleSnapshot } from '../game/BattleRuntime';
import type { BattleRewardCue } from '../game/battle-reward';

interface BattleCanvasProps {
  model: BattleSceneModel;
  onSnapshot: (snapshot: BattleSnapshot) => void;
  rewardCue: BattleRewardCue | null;
}

function BattleRuntimeScene({ model, onSnapshot, rewardCue }: BattleCanvasProps) {
  const { scene, camera, gl } = useThree();
  const runtimeRef = useRef<BattleRuntime | null>(null);
  const snapshotRef = useRef(onSnapshot);
  snapshotRef.current = onSnapshot;

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;

    const runtime = new BattleRuntime({
      scene,
      camera,
      baseUrl: import.meta.env.BASE_URL,
      stageNumber: model.stageNumber,
      waveIndex: model.waveIndex,
      allies: model.allies.map((ally) => ({
        slimeId: ally.slimeId,
        slotIndex: ally.slotIndex,
        asset: ally.asset,
        behaviorId: ally.behaviorId,
        fusionRank: ally.fusionRank,
        equipmentAnchorName: ally.equipmentAnchorName,
        weaponTipName: ally.weaponTipName,
        maxHp: ally.maxHp,
        formationRole: ally.formationRole,
      })),
      authoritativeResult: model.authoritativeResult,
      authoritativeResultDelaySec: model.authoritativeResultDelaySec,
      enemies: model.encounter?.enemies.map((enemy) => ({
        enemyId: enemy.id,
        name: enemy.name,
        asset: enemy.asset,
        behaviorId: enemy.behaviorId,
        maxHp: enemy.maxHp,
        moveSpeed: enemy.moveSpeed,
        attackRange: enemy.attackRange,
        attackInterval: enemy.attackInterval,
        attackDamage: enemy.attackDamage,
        renderScale: enemy.renderScale,
        scaleClass: enemy.scaleClass,
        shadowRadius: enemy.shadowRadius,
        instanceIndex: enemy.instanceIndex,
        formationSlot: enemy.formationSlot,
        initialAttackDelay: enemy.initialAttackDelay,
      })) ?? [],
      onSnapshot: (snapshot) => snapshotRef.current(snapshot),
    });
    runtimeRef.current = runtime;
    void runtime.initialize();

    return () => {
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [camera, gl, scene, model.stageNumber, model.waveIndex, model.visualKey]);

  useEffect(() => {
    if (rewardCue === null) return;
    runtimeRef.current?.presentRewardCue(rewardCue);
  }, [rewardCue?.id]);

  useFrame(({ clock }) => {
    runtimeRef.current?.tick(clock.elapsedTime);
  });

  return null;
}

export function BattleCanvas(props: BattleCanvasProps) {
  return (
    <Canvas
      key={`${props.model.encounterKey}:${props.model.visualKey}`}
      className="battle-canvas"
      camera={{ fov: 31, near: 0.1, far: 50, position: [2.8, 5.35, 8.9] }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      shadows
    >
      <BattleRuntimeScene {...props} />
    </Canvas>
  );
}
