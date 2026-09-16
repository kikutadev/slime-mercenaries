import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GalleryCameraId, GalleryMotionId, SlimeGalleryDefinition } from './types';

type MorphMesh = THREE.Mesh & {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
};

interface ModelParts {
  body: MorphMesh | null;
  equipment: THREE.Object3D | null;
  normalEyes: THREE.Object3D[];
  xEyes: THREE.Group[];
  bodyBaseScale: THREE.Vector3;
  equipmentBaseQuaternion: THREE.Quaternion;
  equipmentBasePosition: THREE.Vector3;
}

interface StageProps {
  definition: SlimeGalleryDefinition;
  motion: GalleryMotionId;
  speed: number;
  loop: boolean;
  cameraMode: GalleryCameraId;
  showDummy: boolean;
  replayKey: number;
}

const xAxis = new THREE.Vector3(1, 0, 0);
const zAxis = new THREE.Vector3(0, 0, 1);
const q1 = new THREE.Quaternion();
const q2 = new THREE.Quaternion();

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function easeOutCubic(value: number): number {
  return 1 - ((1 - value) ** 3);
}

function setMorph(body: MorphMesh | null, name: string, value: number): void {
  if (!body?.morphTargetDictionary || !body.morphTargetInfluences) return;
  const index = body.morphTargetDictionary[name];
  if (index === undefined) return;
  body.morphTargetInfluences[index] = clamp01(value);
}

function buildDefeatEyes(model: THREE.Object3D): { normalEyes: THREE.Object3D[]; xEyes: THREE.Group[] } {
  const normalEyes = ['Eye_L', 'Eye_R']
    .map((name) => model.getObjectByName(name))
    .filter((eye): eye is THREE.Object3D => Boolean(eye));
  const xEyes: THREE.Group[] = [];
  for (const eye of normalEyes) {
    const group = new THREE.Group();
    group.name = `${eye.name}_GalleryDefeatX`;
    group.position.copy(eye.position);
    group.position.z += 0.065;
    const geometry = new THREE.BoxGeometry(0.24, 0.045, 0.028);
    const material = new THREE.MeshBasicMaterial({ color: '#211a25' });
    for (const rotation of [-Math.PI / 4, Math.PI / 4]) {
      const bar = new THREE.Mesh(geometry, material);
      bar.rotation.z = rotation;
      group.add(bar);
    }
    group.visible = false;
    eye.parent?.add(group);
    xEyes.push(group);
  }
  return { normalEyes, xEyes };
}

function collectParts(model: THREE.Object3D, definition: SlimeGalleryDefinition): ModelParts {
  const body = model.getObjectByName('Body') as MorphMesh | null;
  const equipment = model.getObjectByName(definition.equipmentAnchor) ?? null;
  const { normalEyes, xEyes } = buildDefeatEyes(model);
  return {
    body,
    equipment,
    normalEyes,
    xEyes,
    bodyBaseScale: body?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
    equipmentBaseQuaternion: equipment?.quaternion.clone() ?? new THREE.Quaternion(),
    equipmentBasePosition: equipment?.position.clone() ?? new THREE.Vector3(),
  };
}

function resetParts(parts: ModelParts): void {
  parts.body?.morphTargetInfluences?.fill(0);
  parts.body?.scale.copy(parts.bodyBaseScale);
  parts.equipment?.quaternion.copy(parts.equipmentBaseQuaternion);
  if (parts.equipment) parts.equipment.position.copy(parts.equipmentBasePosition);
  parts.normalEyes.forEach((eye) => { eye.visible = true; });
  parts.xEyes.forEach((eye) => { eye.visible = false; });
}

function setEquipment(parts: ModelParts, angle: number, sweep = 0, lift = 0): void {
  if (!parts.equipment) return;
  q1.setFromAxisAngle(xAxis, angle);
  q2.setFromAxisAngle(zAxis, sweep);
  parts.equipment.quaternion.copy(parts.equipmentBaseQuaternion).multiply(q1).multiply(q2);
  parts.equipment.position.copy(parts.equipmentBasePosition);
  parts.equipment.position.y += lift;
}

function applyIdle(parts: ModelParts, time: number): void {
  const wave = Math.sin(time * 2.35);
  const lean = Math.sin(time * 1.2) * 0.055;
  setMorph(parts.body, 'Squash', 0.035 * (0.5 + wave * 0.5));
  setMorph(parts.body, 'Stretch', 0.02 * (0.5 - wave * 0.5));
  setMorph(parts.body, lean < 0 ? 'LeanLeft' : 'LeanRight', Math.abs(lean));
  setMorph(parts.body, lean < 0 ? 'WobbleLeft' : 'WobbleRight', Math.abs(lean) * 0.8);
  setEquipment(parts, lean * 0.22);
}

function motionDuration(motion: GalleryMotionId, kind: SlimeGalleryDefinition['modelKind']): number {
  switch (motion) {
    case 'idle': return 2.4;
    case 'move': return 1.15;
    case 'attack': return kind === 'greatsword' ? 0.68 : kind === 'bow' ? 0.86 : 0.9;
    case 'skill': return 0.82;
    case 'hit': return 0.48;
    case 'defeat': return 1.15;
    case 'celebrate': return 1.2;
  }
}

function CameraRig({ mode }: { mode: GalleryCameraId }) {
  const { camera } = useThree();
  useEffect(() => {
    const position = mode === 'gameplay'
      ? new THREE.Vector3(3.35, 2.45, 4.75)
      : new THREE.Vector3(0, 1.6, 5.4);
    camera.position.copy(position);
    camera.lookAt(0, 0.52, 0);
    camera.updateProjectionMatrix();
  }, [camera, mode]);
  return null;
}

function GalleryModel({ definition, motion, speed, loop, cameraMode, showDummy, replayKey }: StageProps) {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${definition.asset}`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const parts = useMemo(() => collectParts(model, definition), [definition, model]);
  const rootRef = useRef<THREE.Group>(null);
  const dummyRef = useRef<THREE.Group>(null);
  const slashRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.Group>(null);
  const startedAt = useRef(0);
  const previousReplayKey = useRef(replayKey);

  useEffect(() => {
    document.documentElement.dataset.galleryModelLoaded = definition.id;
    return () => {
      if (document.documentElement.dataset.galleryModelLoaded === definition.id) {
        delete document.documentElement.dataset.galleryModelLoaded;
      }
    };
  }, [definition.id, model]);

  useEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [model]);

  useFrame(({ clock }) => {
    const root = rootRef.current;
    if (!root) return;
    if (previousReplayKey.current !== replayKey) {
      previousReplayKey.current = replayKey;
      startedAt.current = clock.elapsedTime;
    }

    resetParts(parts);
    root.position.set(-0.38, 0, 0);
    root.rotation.set(0, cameraMode === 'gameplay' ? -0.34 : 0, 0);
    root.scale.setScalar(0.78);
    if (slashRef.current) slashRef.current.visible = false;
    if (arrowRef.current) arrowRef.current.visible = false;
    if (dummyRef.current) {
      dummyRef.current.visible = showDummy && (motion === 'attack' || motion === 'skill');
      dummyRef.current.position.set(1.18, 0, -0.02);
      dummyRef.current.rotation.z = 0;
      dummyRef.current.scale.set(1, 1, 1);
    }

    const duration = motionDuration(motion, definition.modelKind);
    const elapsed = Math.max(0, (clock.elapsedTime - startedAt.current) * speed);
    const local = loop ? elapsed % duration : Math.min(elapsed, duration);
    const u = clamp01(local / duration);

    if (motion === 'idle') {
      applyIdle(parts, local);
      return;
    }

    if (motion === 'move') {
      const cycle = (u * 2) % 1;
      const jump = 4 * 0.17 * cycle * (1 - cycle);
      root.position.y = jump;
      root.position.x += Math.sin(u * Math.PI * 2) * 0.12;
      const landing = cycle < 0.14 ? 1 - cycle / 0.14 : 0;
      setMorph(parts.body, 'Squash', 0.5 * landing);
      setMorph(parts.body, 'Stretch', 0.24 * Math.sin(cycle * Math.PI));
      const wobble = Math.sin(cycle * Math.PI * 2) * 0.11;
      setMorph(parts.body, wobble < 0 ? 'WobbleLeft' : 'WobbleRight', Math.abs(wobble));
      setEquipment(parts, wobble * 0.32, 0, jump * 0.04);
      return;
    }

    if (motion === 'hit') {
      const impulse = Math.sin(u * Math.PI) * (1 - u * 0.35);
      root.position.x -= impulse * 0.16;
      root.rotation.z = -impulse * 0.11;
      setMorph(parts.body, 'Squash', impulse * 0.22);
      setMorph(parts.body, 'WobbleRight', impulse * 0.34);
      setEquipment(parts, -impulse * 0.16);
      return;
    }

    if (motion === 'defeat') {
      const fall = easeOutCubic(clamp01(u / 0.58));
      const settle = clamp01((u - 0.52) / 0.48);
      root.position.y = -0.12 * fall;
      root.rotation.z = -0.12 * fall;
      if (parts.body) {
        parts.body.scale.set(
          parts.bodyBaseScale.x * (1 + 0.42 * fall),
          parts.bodyBaseScale.y * (1 - 0.74 * fall),
          parts.bodyBaseScale.z * (1 + 0.24 * fall),
        );
      }
      parts.normalEyes.forEach((eye) => { eye.visible = u < 0.22; });
      parts.xEyes.forEach((eye) => { eye.visible = u >= 0.22; });
      setEquipment(parts, -0.72 * fall, 0.18 * settle, -0.04 * fall);
      return;
    }

    if (motion === 'celebrate') {
      const jump = Math.sin(u * Math.PI) * 0.34;
      const wiggle = Math.sin(u * Math.PI * 4) * 0.12 * Math.sin(u * Math.PI);
      root.position.y = jump;
      root.rotation.z = wiggle;
      setMorph(parts.body, 'Stretch', Math.sin(u * Math.PI) * 0.18);
      setMorph(parts.body, wiggle < 0 ? 'LeanLeft' : 'LeanRight', Math.abs(wiggle));
      setEquipment(parts, wiggle * 1.4, wiggle * 0.8, jump * 0.04);
      return;
    }

    if (definition.modelKind === 'bow') {
      const tension = Math.sin(Math.min(1, u / 0.55) * Math.PI * 0.5);
      const release = clamp01((u - 0.55) / 0.15);
      setMorph(parts.body, 'Squash', 0.08 * tension);
      setMorph(parts.body, 'Stretch', 0.14 * release);
      setMorph(parts.body, tension > 0 ? 'LeanLeft' : 'LeanRight', 0.08 * tension);
      setEquipment(parts, -0.38 * tension + 0.48 * release, 0, 0.012 * tension);
      if (arrowRef.current && u >= 0.55) {
        const flight = clamp01((u - 0.55) / 0.42);
        arrowRef.current.visible = flight < 1;
        arrowRef.current.position.set(
          THREE.MathUtils.lerp(0.12, 1.18, flight),
          0.55 + Math.sin(flight * Math.PI) * 0.12,
          0.02,
        );
        arrowRef.current.rotation.z = -Math.PI / 2;
      }
      if (dummyRef.current && u >= 0.93) {
        const hit = Math.sin(clamp01((u - 0.93) / 0.07) * Math.PI);
        dummyRef.current.rotation.z = hit * 0.1;
        dummyRef.current.scale.set(1 + hit * 0.08, 1 - hit * 0.1, 1);
      }
      return;
    }

    const greatsword = definition.modelKind === 'greatsword';
    if (greatsword) {
      const anticipation = clamp01(u / 0.2);
      const slashU = clamp01((u - 0.16) / (motion === 'skill' ? 0.30 : 0.26));
      const slashEase = 1 - ((1 - slashU) ** 4);
      const settle = clamp01((u - 0.56) / 0.44);
      const sweepEnd = motion === 'skill' ? Math.PI * 0.92 : Math.PI * 0.78;
      root.rotation.y += slashU < 1
        ? THREE.MathUtils.lerp(-0.3 * anticipation, -0.3 + sweepEnd, slashEase)
        : THREE.MathUtils.lerp(-0.3 + sweepEnd, 0, easeOutCubic(settle));
      setMorph(parts.body, 'Squash', u < 0.2 ? 0.28 * anticipation : 0.05 * (1 - settle));
      setMorph(parts.body, 'Stretch', slashU > 0 && slashU < 1 ? 0.3 * Math.sin(slashU * Math.PI) : 0);
      const horizontal = THREE.MathUtils.lerp(0, -1.58, anticipation);
      setEquipment(parts, settle > 0 ? THREE.MathUtils.lerp(horizontal, 0, easeOutCubic(settle)) : horizontal, -0.86 * Math.sin(slashU * Math.PI));
      if (slashRef.current && slashU > 0 && slashU < 1) {
        slashRef.current.visible = true;
        slashRef.current.position.set(0.48, 0.43, 0.04);
        slashRef.current.rotation.set(-Math.PI / 2.5, 0, -0.75 + slashEase * 1.1);
        const size = motion === 'skill' ? 1.3 : 1;
        slashRef.current.scale.set(size, size * 0.62, size);
        const material = slashRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = Math.sin(slashU * Math.PI) * 0.76;
      }
      if (dummyRef.current && slashU >= 0.48) {
        const hit = Math.sin(clamp01((slashU - 0.48) / 0.45) * Math.PI);
        dummyRef.current.rotation.z = hit * 0.16;
        dummyRef.current.position.x += hit * 0.16;
      }
      return;
    }

    const anticipation = clamp01(u / 0.34);
    const release = clamp01((u - 0.30) / 0.36);
    const recovery = clamp01((u - 0.68) / 0.32);
    const swing = u < 0.30
      ? THREE.MathUtils.lerp(0, -0.78, anticipation)
      : u < 0.68
        ? THREE.MathUtils.lerp(-0.78, 1.28, easeOutCubic(release))
        : THREE.MathUtils.lerp(1.28, 0, recovery);
    const forward = u >= 0.3 && u < 0.68 ? easeOutCubic(release) * 0.28 : THREE.MathUtils.lerp(0.28, 0, recovery);
    root.position.x += forward;
    setMorph(parts.body, 'Squash', u < 0.30 ? 0.3 * anticipation : 0.06 * (1 - recovery));
    setMorph(parts.body, 'Stretch', u >= 0.30 && u < 0.68 ? 0.24 * Math.sin(release * Math.PI) : 0);
    setEquipment(parts, swing, 0.15 * Math.sin(release * Math.PI));
    if (slashRef.current && u >= 0.36 && u < 0.72) {
      const arc = clamp01((u - 0.36) / 0.36);
      slashRef.current.visible = true;
      slashRef.current.position.set(0.46, 0.46, 0.05);
      slashRef.current.rotation.set(-Math.PI / 2.7, 0, -0.8 + arc * 1.25);
      slashRef.current.scale.set(0.86, 0.56, 0.86);
      (slashRef.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(arc * Math.PI) * 0.78;
    }
    if (dummyRef.current && u >= 0.54) {
      const hit = Math.sin(clamp01((u - 0.54) / 0.34) * Math.PI);
      dummyRef.current.rotation.z = hit * 0.13;
      dummyRef.current.position.x += hit * 0.1;
    }
  });

  return (
    <>
      <group ref={rootRef}><primitive object={model} /></group>
      <group ref={dummyRef}>
        <mesh castShadow position={[0, 0.32, 0]} scale={[0.58, 0.5, 0.54]}>
          <sphereGeometry args={[0.55, 32, 24]} />
          <meshStandardMaterial color="#9c6a8f" roughness={0.68} />
        </mesh>
        <mesh position={[-0.16, 0.42, 0.49]}><sphereGeometry args={[0.055, 16, 12]} /><meshBasicMaterial color="#251d2a" /></mesh>
        <mesh position={[0.16, 0.42, 0.49]}><sphereGeometry args={[0.055, 16, 12]} /><meshBasicMaterial color="#251d2a" /></mesh>
      </group>
      <mesh ref={slashRef} visible={false}>
        <ringGeometry args={[0.62, 0.79, 48, 1, -1.75, 3.5]} />
        <meshBasicMaterial color={definition.accent} transparent opacity={0.76} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <group ref={arrowRef} visible={false}>
        <mesh><cylinderGeometry args={[0.018, 0.018, 0.58, 10]} /><meshStandardMaterial color="#7a5439" /></mesh>
        <mesh position={[0, 0.34, 0]}><coneGeometry args={[0.055, 0.12, 10]} /><meshStandardMaterial color="#d7dce2" metalness={0.5} roughness={0.35} /></mesh>
      </group>
    </>
  );
}

export function GalleryStage(props: StageProps) {
  return (
    <div className="gallery-stage" aria-label={`${props.definition.name} motion preview`}>
      <Canvas
        camera={{ fov: 31, near: 0.1, far: 40, position: [3.35, 2.45, 4.75] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
      >
        <color attach="background" args={['#eff5e8']} />
        <fog attach="fog" args={['#eff5e8', 6.8, 12]} />
        <ambientLight intensity={2.0} />
        <directionalLight position={[-3, 5, 4]} intensity={4.1} castShadow />
        <pointLight position={[2.8, 2.1, 1.8]} intensity={1.2} color={props.definition.accent} />
        <CameraRig mode={props.cameraMode} />
        <Suspense fallback={null}>
          <GalleryModel {...props} />
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.18, -0.29, 0]} receiveShadow>
          <circleGeometry args={[2.25, 64]} />
          <meshStandardMaterial color="#d8e8cd" roughness={1} />
        </mesh>
      </Canvas>
      <div className="gallery-stage__badge">LIVE MODEL</div>
    </div>
  );
}
