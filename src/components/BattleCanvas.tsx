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
import { CAMERA_BASE_POSITION } from '../game/battle-runtime/layout';

interface BattleCanvasProps {
  model: BattleSceneModel;
  pendingModel: BattleSceneModel | null;
  onSnapshot: (snapshot: BattleSnapshot) => void;
  onEncounterReady: (model: BattleSceneModel) => void;
  restartRevision: number;
  onEncounterRestarted: (model: BattleSceneModel) => void;
  rewardCue: BattleRewardCue | null;
  isSoundEnabled: () => boolean;
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

function encounterUpdate(model: BattleSceneModel): BattleRuntimeEncounterUpdate {
  return {
    areaId: model.areaId,
    stageNumber: model.stageNumber,
    waveIndex: model.waveIndex,
    enemies: enemyConfigs(model),
  };
}

function BattleRuntimeScene({
  model,
  pendingModel,
  onSnapshot,
  onEncounterReady,
  restartRevision,
  onEncounterRestarted,
  rewardCue,
  isSoundEnabled,
}: BattleCanvasProps) {
  const { scene, camera, gl } = useThree();
  const runtimeRef = useRef<BattleRuntime | null>(null);
  const runtimeReadyRef = useRef<Promise<void> | null>(null);
  const modelRef = useRef(model);
  const pendingModelRef = useRef(pendingModel);
  const snapshotRef = useRef(onSnapshot);
  const encounterReadyRef = useRef(onEncounterReady);
  const encounterRestartedRef = useRef(onEncounterRestarted);
  const appliedEncounterKeyRef = useRef(model.encounterKey);
  const appliedRestartRevisionRef = useRef(restartRevision);

  modelRef.current = model;
  pendingModelRef.current = pendingModel;
  snapshotRef.current = onSnapshot;
  encounterReadyRef.current = onEncounterReady;
  encounterRestartedRef.current = onEncounterRestarted;

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
      enemies: enemyConfigs(initialModel),
      onSnapshot: (snapshot) => snapshotRef.current(snapshot),
      isSoundEnabled,
    });

    runtimeRef.current = runtime;
    appliedEncounterKeyRef.current = initialModel.encounterKey;
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
      encounterReadyRef.current(desiredModel);
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Battle encounter transition failed:', message);
    });
  }, [pendingModel?.encounterKey, pendingModel?.visualKey]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    const ready = runtimeReadyRef.current;
    if (runtime === null || ready === null) return;
    if (restartRevision === appliedRestartRevisionRef.current) return;

    const desiredModel = modelRef.current;
    void ready.then(async () => {
      if (runtimeRef.current !== runtime) return;
      await runtime.updateEncounter(encounterUpdate(desiredModel));
      if (runtimeRef.current !== runtime) return;
      appliedRestartRevisionRef.current = restartRevision;
      encounterRestartedRef.current(desiredModel);
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Battle encounter restart failed:', message);
    });
  }, [restartRevision]);


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
      camera={{
        fov: 31,
        near: 0.1,
        far: 50,
        position: [CAMERA_BASE_POSITION.x, CAMERA_BASE_POSITION.y, CAMERA_BASE_POSITION.z],
      }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      shadows
    >
      <BattleRuntimeScene {...props} />
    </Canvas>
  );
}