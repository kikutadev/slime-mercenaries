import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { isGreatswordRank } from '../game/fusion';
import { getSlimePresentationForRank, type SlimeId } from '../game/slimes';

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
  onComplete: () => void;
}

const BASE_SCALE = 0.46;
const LEFT_X = -0.82;
const RIGHT_X = 0.82;
const tempQuaternion = new THREE.Quaternion();
const swordAxis = new THREE.Vector3(1, 0, 0);
const swordSweepAxis = new THREE.Vector3(0, 0, 1);
const tempSweepQuaternion = new THREE.Quaternion();
const bowAxis = new THREE.Vector3(0, 0, 1);

function setMorph(body: MorphMesh | null, name: string, value: number) {
  if (!body?.morphTargetDictionary || !body.morphTargetInfluences) return;
  const index = body.morphTargetDictionary[name];
  if (index === undefined) return;
  body.morphTargetInfluences[index] = THREE.MathUtils.clamp(value, 0, 1);
}

function getParts(model: THREE.Object3D, slimeId: SlimeId): ModelParts {
  const body = model.getObjectByName('Body') as MorphMesh | null;
  const equipment = model.getObjectByName(slimeId === 'sword' ? 'WeaponAnchor' : 'BowAnchor') ?? null;
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

function animateResultAttack(parts: ModelParts, slimeId: SlimeId, fusionRank: number, u: number): number {
  resetParts(parts);
  if (slimeId !== 'sword' || !parts.equipment) return 0;

  if (isGreatswordRank(fusionRank)) {
    const anticipation = THREE.MathUtils.clamp(u / 0.16, 0, 1);
    const slashU = THREE.MathUtils.clamp((u - 0.14) / 0.22, 0, 1);
    const slashEase = 1 - ((1 - slashU) ** 4);
    const settle = THREE.MathUtils.clamp((u - 0.52) / 0.48, 0, 1);
    const settleEase = 1 - ((1 - settle) ** 3);
    const squash = u < 0.18 ? 0.28 * anticipation : 0.05 * (1 - settleEase);
    const stretch = slashU > 0 && slashU < 1 ? 0.30 * Math.sin(slashU * Math.PI) : 0;
    const wobble = slashU > 0 && slashU < 1 ? Math.sin(slashU * Math.PI * 2) * 0.07 : 0;
    setMorph(parts.body, 'Squash', squash);
    setMorph(parts.body, 'Stretch', stretch);
    setMorph(parts.body, wobble < 0 ? 'WobbleLeft' : 'WobbleRight', Math.abs(wobble));

    const horizontalTilt = slashU > 0
      ? THREE.MathUtils.lerp(-1.52, -1.68, Math.sin(slashU * Math.PI))
      : THREE.MathUtils.lerp(0, -1.52, anticipation);
    const recoverTilt = settle > 0 ? THREE.MathUtils.lerp(horizontalTilt, 0, settleEase) : horizontalTilt;
    const bladeSweep = slashU > 0
      ? THREE.MathUtils.lerp(-0.78, -1.02, Math.sin(slashU * Math.PI))
      : THREE.MathUtils.lerp(0, -0.78, anticipation);
    const recoverSweep = settle > 0 ? THREE.MathUtils.lerp(bladeSweep, 0, settleEase) : bladeSweep;
    tempQuaternion.setFromAxisAngle(swordAxis, recoverTilt);
    tempSweepQuaternion.setFromAxisAngle(swordSweepAxis, recoverSweep);
    parts.equipment.quaternion.copy(parts.equipmentBaseQuaternion).multiply(tempQuaternion).multiply(tempSweepQuaternion);

    const windupOffset = -0.30 * anticipation;
    const sweepEndOffset = -0.30 + Math.PI * 0.78;
    return slashU < 1
      ? THREE.MathUtils.lerp(windupOffset, sweepEndOffset, slashEase)
      : THREE.MathUtils.lerp(sweepEndOffset, 0, settleEase);
  }

  const anticipation = THREE.MathUtils.clamp(u / 0.30, 0, 1);
  const release = THREE.MathUtils.clamp((u - 0.30) / 0.38, 0, 1);
  const recover = THREE.MathUtils.clamp((u - 0.68) / 0.32, 0, 1);
  const swing = u < 0.30
    ? THREE.MathUtils.lerp(0, -0.82, anticipation)
    : u < 0.68
      ? THREE.MathUtils.lerp(-0.82, 1.15, release)
      : THREE.MathUtils.lerp(1.15, 0, recover);
  const squash = u < 0.30 ? 0.22 * anticipation : 0.06 * (1 - recover);
  const stretch = u >= 0.30 && u < 0.68 ? 0.30 * Math.sin(release * Math.PI) : 0;
  setMorph(parts.body, 'Squash', squash);
  setMorph(parts.body, 'Stretch', stretch);
  setMorph(parts.body, 'LeanRight', 0.13 * Math.sin(u * Math.PI));
  tempQuaternion.setFromAxisAngle(swordAxis, swing);
  parts.equipment.quaternion.copy(parts.equipmentBaseQuaternion).multiply(tempQuaternion);
  return 0;
}

function FusionScene(props: FusionSceneProps) {
  const activeRank = props.isFusing ? props.fromRank : props.fusionRank;
  const targetRank = props.isFusing ? props.toRank : props.fusionRank + 1;
  const currentPresentation = getSlimePresentationForRank(props.slimeId, activeRank);
  const resultPresentation = getSlimePresentationForRank(props.slimeId, targetRank);
  const currentGltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${currentPresentation.asset}`);
  const resultGltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${resultPresentation.asset}`);

  const leftModel = useMemo(() => currentGltf.scene.clone(true), [currentGltf.scene]);
  const rightModel = useMemo(() => currentGltf.scene.clone(true), [currentGltf.scene]);
  const resultModel = useMemo(() => resultGltf.scene.clone(true), [resultGltf.scene]);
  const leftParts = useMemo(() => getParts(leftModel, props.slimeId), [leftModel, props.slimeId]);
  const rightParts = useMemo(() => getParts(rightModel, props.slimeId), [rightModel, props.slimeId]);
  const resultParts = useMemo(() => getParts(resultModel, props.slimeId), [resultModel, props.slimeId]);
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
      if (props.fusionReady) {
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
    const moveU = THREE.MathUtils.clamp((elapsed - 0.16) / 0.43, 0, 1);
    const eased = 1 - ((1 - moveU) ** 3);
    const anticipation = THREE.MathUtils.clamp(elapsed / 0.18, 0, 1);
    const tremble = Math.sin(elapsed * 48) * 0.018 * (1 - moveU);
    const squeeze = Math.sin(moveU * Math.PI) * 0.10;

    left.visible = elapsed < 0.62;
    right.visible = elapsed < 0.62;
    left.position.set(THREE.MathUtils.lerp(LEFT_X, -0.035, eased) + tremble, -0.45 + Math.sin(moveU * Math.PI) * 0.08, 0);
    right.position.set(THREE.MathUtils.lerp(RIGHT_X, 0.035, eased) - tremble, -0.45 + Math.sin(moveU * Math.PI) * 0.08, 0);
    left.scale.set(BASE_SCALE * (1 + squeeze), BASE_SCALE * (1 - squeeze * 0.55), BASE_SCALE);
    right.scale.set(BASE_SCALE * (1 + squeeze), BASE_SCALE * (1 - squeeze * 0.55), BASE_SCALE);
    left.rotation.y = -0.18 - anticipation * 0.08;
    right.rotation.y = 0.18 + anticipation * 0.08;
    animateJelly(leftParts, clock.elapsedTime, 0);
    animateJelly(rightParts, clock.elapsedTime, Math.PI);


    if (elapsed >= 0.58) {
      result.visible = true;
      const revealU = THREE.MathUtils.clamp((elapsed - 0.58) / 0.42, 0, 1);
      const overshoot = 1 + Math.sin(revealU * Math.PI) * 0.12;
      const revealScale = BASE_SCALE * THREE.MathUtils.lerp(0.12, 1, 1 - ((1 - revealU) ** 3)) * overshoot;
      result.position.set(0, -0.45 + Math.sin(revealU * Math.PI) * 0.07, 0);
      result.scale.setScalar(revealScale);
      result.rotation.y = THREE.MathUtils.lerp(0.55, -0.24, revealU);
      animateJelly(resultParts, clock.elapsedTime, 0.7);

      if (elapsed >= 1.02) {
        const attackU = THREE.MathUtils.clamp((elapsed - 1.02) / 0.46, 0, 1);
        const attackRotation = animateResultAttack(resultParts, props.slimeId, props.toRank, attackU);
        result.rotation.y = -0.24 + attackRotation + Math.sin(attackU * Math.PI) * 0.04;
      }
    }

    if (!completed.current && elapsed >= 1.58) {
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

interface SlimePreviewProps {
  slimeId: SlimeId;
  fusionRank: number;
  fusionReady: boolean;
  isFusing: boolean;
  sequenceKey: number;
  fromRank: number;
  toRank: number;
  onFusionComplete: () => void;
}

export function SlimePreview(props: SlimePreviewProps) {
  const current = getSlimePresentationForRank(props.slimeId, props.fusionRank);
  const result = getSlimePresentationForRank(props.slimeId, props.toRank);
  return (
    <div className={`slime-preview fusion-stage ${props.isFusing ? 'is-fusing' : ''} ${props.fusionReady ? 'is-ready' : ''}`} aria-label={`${current.name} fusion preview`}>
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
          onComplete={props.onFusionComplete}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]} receiveShadow>
          <circleGeometry args={[1.55, 48]} />
          <meshStandardMaterial color="#dff0cf" roughness={1} transparent opacity={0.72} />
        </mesh>
      </Canvas>
      {props.fusionReady && !props.isFusing && <div className="fusion-stage__merge-mark" aria-hidden="true"><span>＋</span><small>FUSE</small></div>}
      {props.isFusing && <div className="fusion-stage__flash" key={props.sequenceKey} aria-hidden="true" />}
      {props.isFusing && <div className="fusion-stage__result" key={`result-${props.sequenceKey}`}><span>EVOLVED</span><strong>{result.name}</strong></div>}
    </div>
  );
}
