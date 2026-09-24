import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  applyEquipmentPose,
  type SlimeEquipmentMotionKind,
} from '../../game/slime-motion';
import {
  getFusionCeremonyDurationSec,
  getFusionPreviewAttackDurationSec,
  getFusionPreviewAttackStartSec,
  getFusionPreviewPose,
} from '../../game/fusion-preview';
import { type FusionCeremonyPreset } from '../../game/fusion-presentation';
import { type SlimeId, type SlimePresentation } from '../../game/slimes';
import { applySlimeMutationVisuals, disposeSlimeMutationVisuals } from '../../game/slime-mutation-visuals';
import styles from './FusionWorkbench.module.css';

type MorphMesh = THREE.Mesh & {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
};

interface ModelParts {
  body: MorphMesh | null;
  equipment: THREE.Object3D | null;
  bodyBaseScale: THREE.Vector3;
  equipmentBaseQuaternion: THREE.Quaternion;
  equipmentBasePosition: THREE.Vector3;
}

interface FusionSceneProps {
  slimeId: SlimeId;
  fusionRank: number;
  fusionReady: boolean;
  isFusing: boolean;
  sequenceKey: number;
  fromRank: number;
  toRank: number;
  ceremony: FusionCeremonyPreset;
  currentPresentation: SlimePresentation;
  resultPresentation: SlimePresentation;
  onComplete: () => void;
}

const BASE_SCALE = 0.46;
const LEFT_X = -0.82;
const RIGHT_X = 0.82;
const MERGE_START_SEC = 0.10;
const MERGE_END_SEC = 0.48;
const RESULT_REVEAL_START_SEC = 0.52;
const RESULT_REVEAL_END_SEC = 0.82;

function setMorph(body: MorphMesh | null, name: string, value: number) {
  if (!body?.morphTargetDictionary || !body.morphTargetInfluences) return;
  const index = body.morphTargetDictionary[name];
  if (index === undefined) return;
  body.morphTargetInfluences[index] = THREE.MathUtils.clamp(value, 0, 1);
}

function getParts(model: THREE.Object3D, presentation: SlimePresentation): ModelParts {
  const body = model.getObjectByName('Body') as MorphMesh | null;
  const equipment = model.getObjectByName(presentation.battle.equipmentAnchorName) ?? null;
  return {
    body,
    equipment,
    bodyBaseScale: body?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
    equipmentBaseQuaternion: equipment?.quaternion.clone() ?? new THREE.Quaternion(),
    equipmentBasePosition: equipment?.position.clone() ?? new THREE.Vector3(),
  };
}

function resetParts(parts: ModelParts) {
  parts.body?.morphTargetInfluences?.fill(0);
  parts.body?.scale.copy(parts.bodyBaseScale);
  parts.equipment?.quaternion.copy(parts.equipmentBaseQuaternion);
  if (parts.equipment) parts.equipment.position.copy(parts.equipmentBasePosition);
}

function animateJelly(parts: ModelParts, time: number, phase = 0) {
  resetParts(parts);
  const wave = Math.sin(time * 2.6 + phase);
  const squash = 0.035 * (0.5 + 0.5 * wave);
  const stretch = 0.018 * (0.5 - 0.5 * wave);
  const lean = Math.sin(time * 1.35 + phase) * 0.045;
  setMorph(parts.body, 'Squash', squash);
  setMorph(parts.body, 'Stretch', stretch);
  setMorph(parts.body, lean < 0 ? 'LeanLeft' : 'LeanRight', Math.abs(lean));
  setMorph(parts.body, lean < 0 ? 'WobbleLeft' : 'WobbleRight', Math.abs(lean) * 0.7);
}

function applyResultPreview(
  parts: ModelParts,
  presentation: SlimePresentation,
  slimeId: SlimeId,
  u: number,
) {
  resetParts(parts);
  const pose = getFusionPreviewPose(presentation, u);
  const deformation = pose.deformation;
  setMorph(parts.body, 'Squash', deformation.squash);
  setMorph(parts.body, 'Stretch', deformation.stretch);
  setMorph(parts.body, deformation.lean < 0 ? 'LeanLeft' : 'LeanRight', Math.abs(deformation.lean));
  setMorph(parts.body, deformation.wobble < 0 ? 'WobbleLeft' : 'WobbleRight', Math.abs(deformation.wobble));
  applyEquipmentPose(
    parts.equipment,
    parts.equipmentBaseQuaternion,
    parts.equipmentBasePosition,
    equipmentKind(slimeId),
    pose.equipment,
  );
  return pose;
}

function equipmentKind(slimeId: SlimeId): SlimeEquipmentMotionKind {
  switch (slimeId) {
    case 'sword':
    case 'shield':
    case 'bow':
    case 'wand':
    case 'dagger':
    case 'gun':
      return slimeId;
    case 'mimic':
      return 'sword';
  }
}

function FusionScene(props: FusionSceneProps) {
  const fullMerge = props.ceremony === 'major-form';
  const ceremonyDuration = getFusionCeremonyDurationSec(props.resultPresentation);
  const attackDuration = getFusionPreviewAttackDurationSec(props.resultPresentation);
  const attackStart = getFusionPreviewAttackStartSec();
  const currentGltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${props.currentPresentation.asset}`);
  const resultGltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${props.resultPresentation.asset}`);

  const leftModel = useMemo(() => {
    const clone = currentGltf.scene.clone(true);
    applySlimeMutationVisuals(clone, props.currentPresentation.mutationId);
    return clone;
  }, [currentGltf.scene, props.currentPresentation.mutationId]);
  const rightModel = useMemo(() => {
    const clone = currentGltf.scene.clone(true);
    applySlimeMutationVisuals(clone, props.currentPresentation.mutationId);
    return clone;
  }, [currentGltf.scene, props.currentPresentation.mutationId]);
  const resultModel = useMemo(() => {
    const clone = resultGltf.scene.clone(true);
    applySlimeMutationVisuals(clone, props.resultPresentation.mutationId);
    return clone;
  }, [resultGltf.scene, props.resultPresentation.mutationId]);
  const leftParts = useMemo(
    () => getParts(leftModel, props.currentPresentation),
    [leftModel, props.currentPresentation],
  );
  const rightParts = useMemo(
    () => getParts(rightModel, props.currentPresentation),
    [rightModel, props.currentPresentation],
  );
  const resultParts = useMemo(
    () => getParts(resultModel, props.resultPresentation),
    [resultModel, props.resultPresentation],
  );
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const resultRef = useRef<THREE.Group>(null);
  const latestTime = useRef(0);
  const startedAt = useRef(-Infinity);
  const completed = useRef(false);
  const completeRef = useRef(props.onComplete);

  completeRef.current = props.onComplete;

  useEffect(() => {
    [leftModel, rightModel, resultModel].forEach((model) => {
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
    });
    return () => {
      [leftModel, rightModel, resultModel].forEach(disposeSlimeMutationVisuals);
    };
  }, [leftModel, rightModel, resultModel]);

  useEffect(() => {
    if (!props.isFusing) return;
    startedAt.current = latestTime.current;
    completed.current = false;
  }, [props.isFusing, props.sequenceKey]);

  useFrame(({ clock }) => {
    latestTime.current = clock.elapsedTime;
    if (!leftRef.current || !rightRef.current || !resultRef.current) return;

    const left = leftRef.current;
    const right = rightRef.current;
    const result = resultRef.current;
    left.visible = true;
    right.visible = false;
    result.visible = false;

    if (!props.isFusing) {
      if (props.fusionReady && fullMerge) {
        right.visible = true;
        const bob = Math.sin(clock.elapsedTime * 2.5) * 0.025;
        left.position.set(LEFT_X, -0.45 + bob, 0);
        right.position.set(RIGHT_X, -0.45 - bob, 0);
        left.scale.setScalar(BASE_SCALE);
        right.scale.setScalar(BASE_SCALE);
        left.rotation.y = -0.20;
        right.rotation.y = 0.20;
        animateJelly(leftParts, clock.elapsedTime, 0);
        animateJelly(rightParts, clock.elapsedTime, Math.PI);
      } else {
        left.position.set(0, -0.45, 0);
        left.scale.setScalar(BASE_SCALE);
        left.rotation.y = -0.26 + Math.sin(clock.elapsedTime * 0.55) * 0.035;
        animateJelly(leftParts, clock.elapsedTime, 0);
      }
      return;
    }

    const elapsed = clock.elapsedTime - startedAt.current;
    const moveU = THREE.MathUtils.clamp(
      (elapsed - MERGE_START_SEC) / (MERGE_END_SEC - MERGE_START_SEC),
      0,
      1,
    );
    const eased = 1 - ((1 - moveU) ** 3);
    const anticipation = THREE.MathUtils.clamp(elapsed / 0.18, 0, 1);
    const tremble = Math.sin(elapsed * 48) * 0.018 * (1 - moveU);
    const squeeze = Math.sin(moveU * Math.PI) * (props.ceremony === 'enhancement' ? 0.16 : 0.10);

    left.visible = elapsed < RESULT_REVEAL_START_SEC + 0.04;
    right.visible = fullMerge && elapsed < RESULT_REVEAL_START_SEC + 0.04;
    if (fullMerge) {
      left.position.set(THREE.MathUtils.lerp(LEFT_X, -0.035, eased) + tremble, -0.45 + Math.sin(moveU * Math.PI) * 0.08, 0);
      right.position.set(THREE.MathUtils.lerp(RIGHT_X, 0.035, eased) - tremble, -0.45 + Math.sin(moveU * Math.PI) * 0.08, 0);
      right.scale.set(BASE_SCALE * (1 + squeeze), BASE_SCALE * (1 - squeeze * 0.55), BASE_SCALE);
      right.rotation.y = 0.18 + anticipation * 0.08;
      animateJelly(rightParts, clock.elapsedTime, Math.PI);
    } else {
      left.position.set(tremble, -0.45 + Math.sin(moveU * Math.PI) * 0.10, 0);
    }
    left.scale.set(BASE_SCALE * (1 + squeeze), BASE_SCALE * (1 - squeeze * 0.55), BASE_SCALE);
    left.rotation.y = -0.18 - anticipation * (props.ceremony === 'major-behavior' ? 0.18 : 0.08);
    animateJelly(leftParts, clock.elapsedTime, 0);

    if (elapsed >= RESULT_REVEAL_START_SEC) {
      result.visible = true;
      const revealU = THREE.MathUtils.clamp(
        (elapsed - RESULT_REVEAL_START_SEC) / (RESULT_REVEAL_END_SEC - RESULT_REVEAL_START_SEC),
        0,
        1,
      );
      const overshoot = 1 + Math.sin(revealU * Math.PI) * 0.12;
      const revealScale = BASE_SCALE * THREE.MathUtils.lerp(0.12, 1, 1 - ((1 - revealU) ** 3)) * overshoot;
      result.position.set(0, -0.45 + Math.sin(revealU * Math.PI) * 0.07, 0);
      result.scale.setScalar(revealScale);
      result.rotation.y = THREE.MathUtils.lerp(0.55, -0.24, revealU);
      animateJelly(resultParts, clock.elapsedTime, 0.7);

      if (elapsed >= attackStart) {
        const attackU = THREE.MathUtils.clamp((elapsed - attackStart) / attackDuration, 0, 1);
        const pose = applyResultPreview(resultParts, props.resultPresentation, props.slimeId, attackU);
        const forward = THREE.MathUtils.clamp(pose.bodyOffset * 0.42, -0.42, 0.58);
        const lateral = THREE.MathUtils.clamp(pose.lateralOffset * 0.8, -0.24, 0.24);
        result.position.set(
          forward,
          -0.45 + pose.deformation.jump * 0.42,
          lateral,
        );
        result.rotation.y = -0.24 + pose.rootYawOffset;
      }
    }

    if (!completed.current && elapsed >= ceremonyDuration) {
      completed.current = true;
      completeRef.current();
    }
  });

  return (
    <>
      <group ref={leftRef}><primitive object={leftModel} /></group>
      <group ref={rightRef}><primitive object={rightModel} /></group>
      <group ref={resultRef}><primitive object={resultModel} /></group>
    </>
  );
}

interface FusionStageProps {
  slimeId: SlimeId;
  fusionRank: number;
  fusionReady: boolean;
  isFusing: boolean;
  sequenceKey: number;
  fromRank: number;
  toRank: number;
  ceremony: FusionCeremonyPreset;
  currentPresentation: SlimePresentation;
  resultPresentation: SlimePresentation;
  onFusionComplete: () => void;
}

export function FusionStage(props: FusionStageProps) {
  const current = props.currentPresentation;
  const result = props.resultPresentation;
  return (
    <div className={styles.stage} aria-label={`${current.name} 合成プレビュー`}>
      <Canvas
        camera={{ fov: 28, near: 0.1, far: 30, position: [0, 1.8, 6.3] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
      >
        <ambientLight intensity={2.15} />
        <directionalLight position={[-3, 5, 4]} intensity={4.3} castShadow />
        <pointLight position={[2.4, 1.8, 2]} intensity={1.5} color={result.accent} />
        <FusionScene
          slimeId={props.slimeId}
          fusionRank={props.fusionRank}
          fusionReady={props.fusionReady}
          isFusing={props.isFusing}
          sequenceKey={props.sequenceKey}
          fromRank={props.fromRank}
          toRank={props.toRank}
          ceremony={props.ceremony}
          currentPresentation={props.currentPresentation}
          resultPresentation={props.resultPresentation}
          onComplete={props.onFusionComplete}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]} receiveShadow>
          <circleGeometry args={[1.55, 48]} />
          <meshStandardMaterial color="#dff0cf" roughness={1} transparent opacity={0.72} />
        </mesh>
      </Canvas>
      {props.fusionReady && !props.isFusing && (
        <div className={`${styles.mergeMark} ${ceremonyClass(props.ceremony)}`} aria-hidden="true">
          <span><i /><i /><i /></span><small>{props.ceremony === 'major-form' ? '合成' : '強化'}</small>
        </div>
      )}
      {props.isFusing && <div className={styles.flash} key={props.sequenceKey} aria-hidden="true" />}
      {props.isFusing && <div className={styles.stageResult} key={`result-${props.sequenceKey}`}><span>進化</span><strong>{result.name}</strong></div>}
    </div>
  );
}

function ceremonyClass(ceremony: FusionCeremonyPreset): string {
  switch (ceremony) {
    case 'enhancement': return styles.enhancement;
    case 'major-behavior': return styles.majorBehavior;
    default: return '';
  }
}
