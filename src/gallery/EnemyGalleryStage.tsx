import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  ENEMY_MOTION_TIMING,
  MUSHROOM_SPORE_FLIGHT_SECONDS,
  createMushroomSporeMesh,
  getEnemyAttackContactU,
  getEnemyAttackDuration,
  getEnemyAttackMotion,
  getMushroomDefeatMotion,
  getMushroomHitMotion,
  getMushroomIdleMotion,
  getMushroomMoveMotion,
  getMushroomSporeArcHeight,
} from '../game/enemy-motion';
import type { GalleryCameraId, GalleryMotionId, SlimeGalleryDefinition } from './types';

interface EnemyGalleryStageProps {
  definition: SlimeGalleryDefinition;
  motion: GalleryMotionId;
  speed: number;
  loop: boolean;
  cameraMode: GalleryCameraId;
  showDummy: boolean;
  replayKey: number;
}

const HOME = new THREE.Vector3(0, 0.02, 0.28);
const FORWARD = new THREE.Vector3(0, 0, 1);
const BATTLE_CAMERA_POSITION = new THREE.Vector3(2.8, 5.35, 8.9);
const BATTLE_CAMERA_LOOK_AT = new THREE.Vector3(0, 0.38, -1.05);
const BATTLE_CAMERA_OFFSET = BATTLE_CAMERA_POSITION.clone().sub(BATTLE_CAMERA_LOOK_AT);
const sporeStart = new THREE.Vector3();
const sporeEnd = new THREE.Vector3();

function buildDefeatEyes(model: THREE.Object3D): { normalEyes: THREE.Object3D[]; xEyes: THREE.Group[] } {
  const normalEyes = ['Eye_L', 'Eye_R']
    .map((name) => model.getObjectByName(name))
    .filter((eye): eye is THREE.Object3D => Boolean(eye));
  const xEyes: THREE.Group[] = [];
  const geometry = new THREE.BoxGeometry(0.072, 0.020, 0.018);
  const material = new THREE.MeshBasicMaterial({ color: '#261d2b' });
  for (const eye of normalEyes) {
    const group = new THREE.Group();
    group.position.copy(eye.position);
    group.position.z += 0.022;
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

function CameraRig({ mode, definition }: { mode: GalleryCameraId; definition: SlimeGalleryDefinition }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const compact = size.width < 620 ? 1.16 : 1;
    const isBoss = definition.modelKind === 'great-mushroom';
    const lookAt = HOME.clone().setY(isBoss ? 0.42 : 0.28);
    if (mode === 'gameplay') {
      camera.position.copy(lookAt).addScaledVector(BATTLE_CAMERA_OFFSET, (isBoss ? 0.44 : 0.34) * compact);
    } else if (mode === 'front') {
      camera.position.set(0, isBoss ? 0.96 : 0.72, (isBoss ? 3.35 : 2.25) * compact);
    } else {
      camera.position.set((isBoss ? 2.05 : 1.5) * compact, (isBoss ? 1.2 : 0.92) * compact, (isBoss ? 3.25 : 2.25) * compact);
    }
    camera.lookAt(lookAt);
    camera.updateProjectionMatrix();
  }, [camera, definition.modelKind, mode, size.width]);
  return null;
}

function clipDuration(motion: GalleryMotionId, definition: SlimeGalleryDefinition): number {
  if (motion === 'move') return 1.55;
  if (motion === 'hit') return 0.22;
  if (motion === 'defeat') return ENEMY_MOTION_TIMING.defeat;
  if (motion === 'attack' && definition.enemyBehaviorId) {
    if (definition.enemyBehaviorId === 'mushroom-spore') {
      const releaseAt = getEnemyAttackDuration(definition.enemyBehaviorId) * getEnemyAttackContactU(definition.enemyBehaviorId);
      return releaseAt + MUSHROOM_SPORE_FLIGHT_SECONDS;
    }
    return getEnemyAttackDuration(definition.enemyBehaviorId);
  }
  return 2.4;
}

function EnemyModel({ definition, motion, speed, loop, showDummy, replayKey }: EnemyGalleryStageProps) {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${definition.asset}`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const eyes = useMemo(() => buildDefeatEyes(model), [model]);
  const faceRoot = useMemo(() => model.getObjectByName('FaceRoot') ?? null, [model]);
  const faceBasePosition = useMemo(() => faceRoot?.position.clone() ?? new THREE.Vector3(), [faceRoot]);
  const faceBaseScale = useMemo(() => faceRoot?.scale.clone() ?? new THREE.Vector3(1, 1, 1), [faceRoot]);
  const effectOrigin = useMemo(() => model.getObjectByName('EffectOrigin') ?? null, [model]);
  const spore = useMemo(() => createMushroomSporeMesh(), []);
  const rootRef = useRef<THREE.Group>(null);
  const dummyRef = useRef<THREE.Group>(null);
  const startedAt = useRef(0);
  const previousReplayKey = useRef(replayKey);
  const scale = definition.productionScale ?? 0.31;

  useEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    document.documentElement.dataset.galleryModelLoaded = definition.id;
    return () => {
      if (document.documentElement.dataset.galleryModelLoaded === definition.id) {
        delete document.documentElement.dataset.galleryModelLoaded;
      }
    };
  }, [definition.id, model]);

  useFrame(({ clock }) => {
    const root = rootRef.current;
    if (!root) return;
    if (previousReplayKey.current !== replayKey) {
      previousReplayKey.current = replayKey;
      startedAt.current = clock.elapsedTime;
    }

    root.position.copy(HOME);
    root.rotation.set(0, 0, 0);
    root.scale.setScalar(scale);
    if (faceRoot) {
      faceRoot.position.copy(faceBasePosition);
      faceRoot.scale.copy(faceBaseScale);
    }
    eyes.normalEyes.forEach((eye) => { eye.visible = true; });
    eyes.xEyes.forEach((eye) => { eye.visible = false; });
    spore.visible = false;

    const duration = clipDuration(motion, definition);
    const elapsed = Math.max(0, (clock.elapsedTime - startedAt.current) * speed);
    const local = loop ? elapsed % duration : Math.min(elapsed, duration);
    const dummyHome = HOME.clone().addScaledVector(FORWARD, definition.modelKind === 'great-mushroom' ? 1.25 : 0.92);
    if (dummyRef.current) {
      dummyRef.current.visible = showDummy && motion === 'attack';
      dummyRef.current.position.copy(dummyHome);
    }

    if (motion === 'idle') {
      const pose = getMushroomIdleMotion(local, 0.2);
      root.position.y += pose.jump;
      root.scale.set(scale * pose.scaleX, scale * pose.scaleY, scale * pose.scaleZ);
      root.rotation.z = pose.wobbleZ;
      return;
    }

    if (motion === 'move') {
      const u = THREE.MathUtils.clamp(local / 1.55, 0, 1);
      const pose = getMushroomMoveMotion(local, 0.1);
      root.position.addScaledVector(FORWARD, u * 0.7);
      root.position.y += pose.jump;
      root.scale.set(scale * pose.scaleX, scale * pose.scaleY, scale * pose.scaleZ);
      root.rotation.z = pose.wobbleZ;
      return;
    }

    if (motion === 'hit') {
      const u = THREE.MathUtils.clamp(local / 0.22, 0, 1);
      const pose = getMushroomHitMotion(u, -1);
      root.scale.set(scale * pose.scaleX, scale * pose.scaleY, scale * pose.scaleZ);
      root.rotation.z = pose.rotationZ;
      return;
    }

    if (motion === 'defeat') {
      const u = THREE.MathUtils.clamp(local / ENEMY_MOTION_TIMING.defeat, 0, 1);
      const pose = getMushroomDefeatMotion(u, -1);
      root.position.x += pose.lateralDrift;
      root.position.z -= pose.backwardDrift;
      root.position.y += pose.yOffset;
      root.rotation.z = pose.rotationZ;
      root.scale.set(
        scale * pose.scaleX * pose.opacity,
        scale * pose.scaleY * pose.opacity,
        scale * pose.scaleZ * pose.opacity,
      );
      if (faceRoot) {
        faceRoot.position.copy(faceBasePosition);
        faceRoot.position.z += 0.14 * Math.sin(Math.min(1, u / 0.72) * Math.PI * 0.5);
        faceRoot.scale.set(
          faceBaseScale.x / Math.max(0.2, pose.scaleX),
          faceBaseScale.y / Math.max(0.2, pose.scaleY),
          faceBaseScale.z / Math.max(0.2, pose.scaleZ),
        );
      }
      eyes.normalEyes.forEach((eye) => { eye.visible = false; });
      eyes.xEyes.forEach((eye) => { eye.visible = true; });
      return;
    }

    if (definition.enemyBehaviorId) {
      const attackDuration = getEnemyAttackDuration(definition.enemyBehaviorId);
      const u = THREE.MathUtils.clamp(local / attackDuration, 0, 1);
      const pose = getEnemyAttackMotion(definition.enemyBehaviorId, u);
      const travelBase = definition.enemyBehaviorId === 'mushroom-spore'
        ? 0.16
        : definition.modelKind === 'great-mushroom' ? 0.5 : 0.4;
      root.position.addScaledVector(FORWARD, travelBase * pose.travel);
      root.position.y += pose.jump;
      root.scale.set(scale * pose.scaleX, scale * pose.scaleY, scale * pose.scaleZ);
      root.rotation.z = pose.wobbleZ;

      if (definition.enemyBehaviorId === 'mushroom-spore') {
        const releaseAt = attackDuration * getEnemyAttackContactU(definition.enemyBehaviorId);
        if (local >= releaseAt) {
          const flightU = THREE.MathUtils.clamp((local - releaseAt) / MUSHROOM_SPORE_FLIGHT_SECONDS, 0, 1);
          root.updateMatrixWorld(true);
          if (effectOrigin) effectOrigin.getWorldPosition(sporeStart);
          else sporeStart.copy(root.position).add(new THREE.Vector3(0, 0.3, 0));
          sporeEnd.copy(dummyHome).add(new THREE.Vector3(0, 0.2, 0));
          spore.visible = flightU < 1;
          spore.position.lerpVectors(sporeStart, sporeEnd, flightU);
          spore.position.y += getMushroomSporeArcHeight(flightU);
          spore.rotation.y = local * 7.5;
          spore.rotation.z = local * 4.2;
        }
      }
    }
  });

  return (
    <>
      <group ref={rootRef}><primitive object={model} /></group>
      <primitive object={spore} />
      <group ref={dummyRef} visible={false}>
        <mesh castShadow position={[0, 0.18, 0]} scale={[0.24, 0.2, 0.23]}>
          <sphereGeometry args={[1, 28, 20]} />
          <meshStandardMaterial color="#61cde0" roughness={0.52} />
        </mesh>
        <mesh position={[-0.06, 0.22, 0.2]}><sphereGeometry args={[0.026, 12, 8]} /><meshBasicMaterial color="#20314c" /></mesh>
        <mesh position={[0.06, 0.22, 0.2]}><sphereGeometry args={[0.026, 12, 8]} /><meshBasicMaterial color="#20314c" /></mesh>
      </group>
    </>
  );
}

export function EnemyGalleryStage(props: EnemyGalleryStageProps) {
  return (
    <div className="gallery-stage" aria-label={`${props.definition.name} motion preview`}>
      <Canvas
        camera={{ fov: 31, near: 0.05, far: 40, position: [1.25, 0.92, 2.0] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
      >
        <color attach="background" args={['#eff5e8']} />
        <fog attach="fog" args={['#eff5e8', 5.5, 11]} />
        <ambientLight intensity={2.0} />
        <directionalLight position={[-3, 5, 4]} intensity={4.1} castShadow />
        <CameraRig mode={props.cameraMode} definition={props.definition} />
        <Suspense fallback={null}>
          <EnemyModel {...props} />
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, -0.005, 0]} receiveShadow>
          <circleGeometry args={[1.55, 64]} />
          <meshStandardMaterial color="#d8e8cd" roughness={1} />
        </mesh>
      </Canvas>
      <div className="gallery-stage__badge">PRODUCTION ENEMY MOTION</div>
    </div>
  );
}
