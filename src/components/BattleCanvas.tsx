import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BattleSceneModel } from '../application/selectors/battle-scene';
import {
  BattleRuntime,
  type BattleRuntimeEncounterUpdate,
  type BattleRuntimeEnemyConfig,
  type BattleSnapshot,
} from '../game/BattleRuntime';
import type { BattleRewardCue } from '../game/battle-reward';

interface BattleCanvasProps {
  model: BattleSceneModel;
  pendingModel: BattleSceneModel | null;
  onSnapshot: (snapshot: BattleSnapshot) => void;
  onEncounterReady: (model: BattleSceneModel) => void;
  rewardCue: BattleRewardCue | null;
}

function enemyConfigs(model: BattleSceneModel): readonly BattleRuntimeEnemyConfig[] {
  return model.encounter?.enemies.map((enemy) => ({
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
  })) ?? [];
}

function authoritativeDelaySec(model: BattleSceneModel): number | null {
  return model.authoritativeResultDeadlineMs === null
    ? null
    : Math.max(0, (model.authoritativeResultDeadlineMs - Date.now()) / 1_000);
}

function encounterUpdate(model: BattleSceneModel): BattleRuntimeEncounterUpdate {
  return {
    areaId: model.areaId,
    stageNumber: model.stageNumber,
    waveIndex: model.waveIndex,
    enemies: enemyConfigs(model),
    authoritativeResult: model.authoritativeResult,
    authoritativeResultDelaySec: authoritativeDelaySec(model),
  };
}

function BattleRuntimeScene({
  model,
  pendingModel,
  onSnapshot,
  onEncounterReady,
  rewardCue,
}: BattleCanvasProps) {
  const { scene, camera, gl } = useThree();
  const runtimeRef = useRef<BattleRuntime | null>(null);
  const runtimeReadyRef = useRef<Promise<void> | null>(null);
  const modelRef = useRef(model);
  const pendingModelRef = useRef(pendingModel);
  const snapshotRef = useRef(onSnapshot);
  const encounterReadyRef = useRef(onEncounterReady);
  const appliedEncounterKeyRef = useRef(model.encounterKey);
  const appliedVisualKeyRef = useRef(model.visualKey);

  modelRef.current = model;
  pendingModelRef.current = pendingModel;
  snapshotRef.current = onSnapshot;
  encounterReadyRef.current = onEncounterReady;

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;

    const initialModel = modelRef.current;
    const runtime = new BattleRuntime({
      scene,
      camera,
      baseUrl: import.meta.env.BASE_URL,
      areaId: initialModel.areaId,
      stageNumber: initialModel.stageNumber,
      waveIndex: initialModel.waveIndex,
      allies: initialModel.allies.map((ally) => ({
        slimeId: ally.slimeId,
        slotIndex: ally.slotIndex,
        asset: ally.asset,
        behaviorId: ally.behaviorId,
        fusionRank: ally.fusionRank,
        mutationId: ally.mutationId,
        equipmentAnchorName: ally.equipmentAnchorName,
        weaponTipName: ally.weaponTipName,
        maxHp: ally.maxHp,
        formationRole: ally.formationRole,
      })),
      authoritativeResult: initialModel.authoritativeResult,
      authoritativeResultDelaySec: authoritativeDelaySec(initialModel),
      enemies: enemyConfigs(initialModel),
      onSnapshot: (snapshot) => snapshotRef.current(snapshot),
    });

    runtimeRef.current = runtime;
    appliedEncounterKeyRef.current = initialModel.encounterKey;
    appliedVisualKeyRef.current = initialModel.visualKey;
    const ready = runtime.initialize().catch((error: unknown) => {
      if (runtimeRef.current !== runtime) return;
      const message = error instanceof Error ? error.message : String(error);
      console.error('Battle runtime initialization failed:', message);
      snapshotRef.current({
        phase: 'loading',
        label: '戦闘データを再読込中',
        result: null,
        enemyAlive: 0,
        presentationReady: false,
        enemies: {},
        allies: {},
      });
    });
    runtimeReadyRef.current = ready;

    return () => {
      runtime.dispose();
      runtimeRef.current = null;
      runtimeReadyRef.current = null;
    };
  }, [camera, gl, scene, model.runtimeKey]);

  // Same-encounter authoritative result changes do not require a visual reload.
  useEffect(() => {
    const runtime = runtimeRef.current;
    const ready = runtimeReadyRef.current;
    if (runtime === null || ready === null) return;

    const desiredModel = model;
    void ready.then(() => {
      if (runtimeRef.current !== runtime) return;
      if (appliedEncounterKeyRef.current !== desiredModel.encounterKey) return;
      if (appliedVisualKeyRef.current === desiredModel.visualKey) return;

      runtime.updateAuthoritativeResult(
        desiredModel.authoritativeResult,
        authoritativeDelaySec(desiredModel),
      );
      appliedVisualKeyRef.current = desiredModel.visualKey;
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Battle result synchronization failed:', message);
    });
  }, [model.encounterKey, model.visualKey]);

  // Encounter transitions are prepared off-screen. The old result remains visible until
  // every next-enemy asset is loaded and the runtime has atomically installed the new wave.
  useEffect(() => {
    const runtime = runtimeRef.current;
    const ready = runtimeReadyRef.current;
    if (runtime === null || ready === null || pendingModel === null) return;

    const desiredModel = pendingModel;
    void ready.then(async () => {
      if (runtimeRef.current !== runtime) return;
      const pendingBeforeLoad = pendingModelRef.current;
      if (pendingBeforeLoad === null
        || pendingBeforeLoad.encounterKey !== desiredModel.encounterKey
        || pendingBeforeLoad.visualKey !== desiredModel.visualKey) {
        return;
      }

      await runtime.updateEncounter(encounterUpdate(desiredModel));
      if (runtimeRef.current !== runtime) return;

      const pendingAfterLoad = pendingModelRef.current;
      if (pendingAfterLoad === null
        || pendingAfterLoad.encounterKey !== desiredModel.encounterKey
        || pendingAfterLoad.visualKey !== desiredModel.visualKey) {
        return;
      }

      appliedEncounterKeyRef.current = desiredModel.encounterKey;
      appliedVisualKeyRef.current = desiredModel.visualKey;
      encounterReadyRef.current(desiredModel);
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Battle encounter transition failed:', message);
    });
  }, [pendingModel?.encounterKey, pendingModel?.visualKey]);

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
      key={props.model.runtimeKey}
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
