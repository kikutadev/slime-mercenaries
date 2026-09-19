import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  applyEnemySecondaryPose,
  captureEnemyRigRestPose,
  getEnemyMotionProfile,
  resetEnemySecondaryPose,
  resolveEnemyRigParts,
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
const projectileStart = new THREE.Vector3();
const projectileEnd = new THREE.Vector3();

function buildDefeatEyes(model: THREE.Object3D): { normalEyes: THREE.Object3D[]; xEyes: THREE.Group[] } {
  model.updateMatrixWorld(true);
  const normalEyes = ['Eye_L', 'Eye_R']
    .map((name) => model.getObjectByName(name))
    .filter((eye): eye is THREE.Object3D => Boolean(eye));
  const xEyes: THREE.Group[] = [];
  const material = new THREE.MeshBasicMaterial({ color: '#261d2b' });

  for (const eye of normalEyes) {
    const footprint = new THREE.Vector3(0.04, 0.02, 0.04);
    if (eye instanceof THREE.Mesh) {
      eye.geometry.computeBoundingBox();
      const bounds = eye.geometry.boundingBox;
      if (bounds) {
        bounds.getSize(footprint);
        footprint.multiply(eye.scale);
      }
    }

    const visibleDiameter = Math.max(footprint.x, footprint.z);
    const barLength = THREE.MathUtils.clamp(visibleDiameter * 1.08, 0.020, 0.074);
    const barThickness = THREE.MathUtils.clamp(barLength * 0.22, 0.006, 0.018);
    const barDepth = THREE.MathUtils.clamp(footprint.y * 0.72, 0.006, 0.018);
    const geometry = new THREE.BoxGeometry(barLength, barThickness, barDepth);

    const group = new THREE.Group();
    group.position.copy(eye.position);
    group.position.z += Math.max(0.006, footprint.y * 0.54);
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
    const isBoss = definition.classification.startsWith('Boss');
    const lookAt = HOME.clone().setY(isBoss ? 0.42 : 0.28);
    if (mode === 'gameplay') camera.position.copy(lookAt).addScaledVector(BATTLE_CAMERA_OFFSET, (isBoss ? 0.44 : 0.34) * compact);
    else if (mode === 'front') camera.position.set(0, isBoss ? 0.96 : 0.72, (isBoss ? 3.35 : 2.25) * compact);
    else camera.position.set((isBoss ? 2.05 : 1.5) * compact, (isBoss ? 1.2 : 0.92) * compact, (isBoss ? 3.25 : 2.25) * compact);
    camera.lookAt(lookAt); camera.updateProjectionMatrix();
  }, [camera, definition.modelKind, mode, size.width]);
  return null;
}

function EnemyModel({ definition, motion, speed, loop, showDummy, replayKey }: EnemyGalleryStageProps) {
  if (!definition.enemyBehaviorId) throw new Error(`Enemy gallery definition ${definition.id} requires enemyBehaviorId`);
  const profile = useMemo(() => getEnemyMotionProfile(definition.enemyBehaviorId!), [definition.enemyBehaviorId]);
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${definition.asset}`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const eyes = useMemo(() => buildDefeatEyes(model), [model]);
  const bodyRoot = useMemo(() => model.getObjectByName('BodyRoot') ?? model, [model]);
  const bodyBaseScale = useMemo(() => bodyRoot.scale.clone(), [bodyRoot]);
  const faceRoot = useMemo(() => model.getObjectByName('FaceRoot') ?? null, [model]);
  const faceBasePosition = useMemo(() => faceRoot?.position.clone() ?? new THREE.Vector3(), [faceRoot]);
  const faceBaseScale = useMemo(() => faceRoot?.scale.clone() ?? new THREE.Vector3(1, 1, 1), [faceRoot]);
  const effectOrigin = useMemo(() => model.getObjectByName('EffectOrigin') ?? null, [model]);
  const rigParts = useMemo(() => resolveEnemyRigParts(model), [model]);
  const rigRest = useMemo(() => captureEnemyRigRestPose(rigParts), [rigParts]);
  const projectile = useMemo(() => profile.projectile?.createMesh() ?? new THREE.Group(), [profile]);
  const rootRef = useRef<THREE.Group>(null);
  const dummyRef = useRef<THREE.Group>(null);
  const attackTelegraphRef = useRef<THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>>(null);
  const attackImpactRef = useRef<THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>>(null);
  const startedAt = useRef(0);
  const previousReplayKey = useRef(replayKey);
  const scale = definition.productionScale ?? 0.31;

  useEffect(() => {
    model.traverse((object) => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
    document.documentElement.dataset.galleryModelLoaded = definition.id;
    return () => { if (document.documentElement.dataset.galleryModelLoaded === definition.id) delete document.documentElement.dataset.galleryModelLoaded; };
  }, [definition.id, model]);

  useFrame(({ clock }) => {
    const root = rootRef.current; if (!root) return;
    if (previousReplayKey.current !== replayKey) { previousReplayKey.current = replayKey; startedAt.current = clock.elapsedTime; }

    root.position.copy(HOME); root.rotation.set(0, 0, 0); root.scale.setScalar(scale);
    bodyRoot.scale.copy(bodyBaseScale); resetEnemySecondaryPose(rigParts, rigRest);
    if (faceRoot) { faceRoot.position.copy(faceBasePosition); faceRoot.scale.copy(faceBaseScale); }
    eyes.normalEyes.forEach((eye) => { eye.visible = true; }); eyes.xEyes.forEach((eye) => { eye.visible = false; });
    projectile.visible = false;
    if (attackTelegraphRef.current) attackTelegraphRef.current.visible = false;
    if (attackImpactRef.current) attackImpactRef.current.visible = false;

    const duration = motion === 'move' ? profile.moveDuration : motion === 'hit' ? 0.22 : motion === 'defeat' ? profile.defeatDuration : motion === 'attack' ? (profile.attackDuration + (profile.projectile?.flightSeconds ?? 0)) : 2.4;
    const elapsed = Math.max(0, (clock.elapsedTime - startedAt.current) * speed);
    const local = loop ? elapsed % duration : Math.min(elapsed, duration);
    const dummyHome = HOME.clone().addScaledVector(FORWARD, definition.classification.startsWith('Boss') ? 1.25 : 0.92);
    if (dummyRef.current) { dummyRef.current.visible = showDummy && motion === 'attack'; dummyRef.current.position.copy(dummyHome); }

    if (motion === 'idle') {
      const pose = profile.idle(local, 0.2); root.position.y += pose.jump; root.scale.set(scale * pose.scaleX, scale * pose.scaleY, scale * pose.scaleZ); root.rotation.z = pose.wobbleZ; applyEnemySecondaryPose(rigParts, rigRest, pose.secondary); return;
    }
    if (motion === 'move') {
      const u = THREE.MathUtils.clamp(local / profile.moveDuration, 0, 1); const pose = profile.move(local, 0.1); root.position.addScaledVector(FORWARD, u * profile.moveDistance); root.position.y += pose.jump; root.scale.set(scale * pose.scaleX, scale * pose.scaleY, scale * pose.scaleZ); root.rotation.z = pose.wobbleZ; applyEnemySecondaryPose(rigParts, rigRest, pose.secondary); return;
    }
    if (motion === 'hit') {
      const u = THREE.MathUtils.clamp(local / 0.22, 0, 1); const pose = profile.hit(u, -1); root.scale.set(scale * pose.scaleX, scale * pose.scaleY, scale * pose.scaleZ); root.rotation.z = pose.rotationZ; applyEnemySecondaryPose(rigParts, rigRest, pose.secondary); return;
    }
    if (motion === 'defeat') {
      const u = THREE.MathUtils.clamp(local / profile.defeatDuration, 0, 1); const pose = profile.defeat(u, -1); root.position.x += pose.lateralDrift; root.position.z -= pose.backwardDrift; root.position.y += pose.yOffset; root.rotation.z = pose.rotationZ; root.scale.setScalar(scale * pose.opacity); bodyRoot.scale.set(bodyBaseScale.x * pose.scaleX, bodyBaseScale.y * pose.scaleY, bodyBaseScale.z * pose.scaleZ); applyEnemySecondaryPose(rigParts, rigRest, pose.secondary);
      if (faceRoot) {
        faceRoot.position.copy(faceBasePosition);
        faceRoot.scale.set(
          faceBaseScale.x * pose.scaleX,
          faceBaseScale.y * pose.scaleY,
          faceBaseScale.z * pose.scaleZ,
        );
      }
      eyes.normalEyes.forEach((eye) => { eye.visible = false; }); eyes.xEyes.forEach((eye) => { eye.visible = true; }); return;
    }

    const attackU = THREE.MathUtils.clamp(local / profile.attackDuration, 0, 1);
    const pose = profile.attack(attackU); root.position.addScaledVector(FORWARD, profile.attackTravelDistance * pose.travel); root.position.y += pose.jump; root.scale.set(scale * pose.scaleX, scale * pose.scaleY, scale * pose.scaleZ); root.rotation.z = pose.wobbleZ; applyEnemySecondaryPose(rigParts, rigRest, pose.secondary);
    if (profile.attackVfx) {
      const vfx = profile.attackVfx.pose(attackU);
      if (attackTelegraphRef.current) {
        attackTelegraphRef.current.visible = vfx.telegraphOpacity > 0.001;
        attackTelegraphRef.current.position.copy(dummyHome).setY(0.014);
        attackTelegraphRef.current.scale.setScalar(vfx.telegraphScale);
        attackTelegraphRef.current.material.opacity = vfx.telegraphOpacity;
        attackTelegraphRef.current.rotation.z = local * 0.22;
      }
      if (attackImpactRef.current) {
        attackImpactRef.current.visible = vfx.impactStrength > 0.01;
        attackImpactRef.current.position.copy(dummyHome).setY(0.018);
        attackImpactRef.current.scale.setScalar(0.7 + vfx.impactStrength * 0.8);
        attackImpactRef.current.material.opacity = vfx.impactStrength * 0.82;
      }
    }
    if (profile.projectile) {
      const releaseAt = profile.attackDuration * profile.contactU;
      if (local >= releaseAt) {
        const flightU = THREE.MathUtils.clamp((local - releaseAt) / profile.projectile.flightSeconds, 0, 1); root.updateMatrixWorld(true); if (effectOrigin) effectOrigin.getWorldPosition(projectileStart); else projectileStart.copy(root.position).add(new THREE.Vector3(0, 0.3, 0)); projectileEnd.copy(dummyHome).add(new THREE.Vector3(0, 0.2, 0)); projectile.visible = flightU < 1; projectile.position.lerpVectors(projectileStart, projectileEnd, flightU); projectile.position.y += profile.projectile.arcHeight(flightU); projectile.rotation.y = local * 7.5; projectile.rotation.z = local * 4.2;
      }
    }
  });

  return <><group ref={rootRef}><primitive object={model} /></group><primitive object={projectile} />{profile.attackVfx && <><mesh ref={attackTelegraphRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}><ringGeometry args={[profile.attackVfx.radius * 0.66, profile.attackVfx.radius, 40]} /><meshBasicMaterial color={profile.attackVfx.color} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} /></mesh><mesh ref={attackImpactRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}><ringGeometry args={[profile.attackVfx.radius * 0.72, profile.attackVfx.radius * 1.15, 40]} /><meshBasicMaterial color={profile.attackVfx.impactColor} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} /></mesh></>}<group ref={dummyRef} visible={false}><mesh castShadow position={[0, 0.18, 0]} scale={[0.24, 0.2, 0.23]}><sphereGeometry args={[1, 28, 20]} /><meshStandardMaterial color="#61cde0" roughness={0.52} /></mesh><mesh position={[-0.06, 0.22, 0.2]}><sphereGeometry args={[0.026, 12, 8]} /><meshBasicMaterial color="#20314c" /></mesh><mesh position={[0.06, 0.22, 0.2]}><sphereGeometry args={[0.026, 12, 8]} /><meshBasicMaterial color="#20314c" /></mesh></group></>;
}

export function EnemyGalleryStage(props: EnemyGalleryStageProps) {
  return <div className="gallery-stage" aria-label={`${props.definition.name} motion preview`}><Canvas camera={{ fov: 31, near: 0.05, far: 40, position: [1.25, 0.92, 2.0] }} dpr={[1, 2]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} shadows><color attach="background" args={['#eff5e8']} /><fog attach="fog" args={['#eff5e8', 5.5, 11]} /><ambientLight intensity={2.0} /><directionalLight position={[-3, 5, 4]} intensity={4.1} castShadow /><CameraRig mode={props.cameraMode} definition={props.definition} /><Suspense fallback={null}><EnemyModel {...props} /></Suspense><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, -0.005, 0]} receiveShadow><circleGeometry args={[1.55, 64]} /><meshStandardMaterial color="#d8e8cd" roughness={1} /></mesh></Canvas><div className="gallery-stage__badge">PRODUCTION ENEMY MOTION</div></div>;
}