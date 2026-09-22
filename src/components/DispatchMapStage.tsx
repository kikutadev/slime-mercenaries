import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { dispatchRoutePresentation } from '../game/dispatch-presentation';
import type { DispatchContractId, SlimeMutationId } from '../domain';
import { applySlimeMutationVisuals, disposeSlimeMutationVisuals } from '../game/slime-mutation-visuals';

export type DispatchTraveler = Readonly<{
  contractId: DispatchContractId;
  asset: string;
  mutationId: SlimeMutationId | null;
  progress: number;
  departureKey?: number;
}>;

type ReturningTraveler = DispatchTraveler & Readonly<{ returnKey: number }>;

function MapEnvironment() {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}assets/environments/dispatch-map.glb`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const { camera, scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.Fog('#cce5c8', 11, 27);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, 8.4, 10.6);
      camera.fov = 39;
      camera.near = 0.1;
      camera.far = 50;
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0, 0.15);
    }
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [camera, model, scene]);

  return <primitive object={model} />;
}

function Traveler({
  traveler,
  index,
  returning = false,
}: {
  traveler: DispatchTraveler | ReturningTraveler;
  index: number;
  returning?: boolean;
}) {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${traveler.asset}`);
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true);
    applySlimeMutationVisuals(clone, traveler.mutationId);
    return clone;
  }, [gltf.scene, traveler.mutationId]);
  const group = useRef<THREE.Group>(null);
  const route = dispatchRoutePresentation[traveler.contractId];
  const start = useMemo(() => new THREE.Vector3(...route.start), [route.start]);
  const end = useMemo(() => new THREE.Vector3(...route.end), [route.end]);
  const position = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3().subVectors(end, start).normalize(), [end, start]);
  const startedAt = useRef<number | null>(null);
  const motionKey = returning
    ? ('returnKey' in traveler ? traveler.returnKey : 0)
    : traveler.departureKey ?? 0;

  useEffect(() => {
    startedAt.current = null;
  }, [motionKey, returning]);

  useEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return () => disposeSlimeMutationVisuals(model);
  }, [model]);

  useFrame(({ clock }) => {
    const target = group.current;
    if (target === null) return;
    if (startedAt.current === null) startedAt.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startedAt.current;

    let visibleProgress = THREE.MathUtils.clamp(traveler.progress, 0, 1);
    let intensity = 1;
    if (returning) {
      const u = THREE.MathUtils.clamp(elapsed / 0.96, 0, 1);
      const eased = 1 - ((1 - u) ** 3);
      visibleProgress = 1 - eased;
      intensity = 1.45;
    } else if (traveler.departureKey !== undefined && elapsed < 0.9) {
      const u = THREE.MathUtils.clamp(elapsed / 0.9, 0, 1);
      const eased = 1 - ((1 - u) ** 3);
      visibleProgress = Math.max(visibleProgress, eased * 0.14);
      intensity = 1.65 - u * 0.45;
    }

    position.lerpVectors(start, end, visibleProgress);
    const hop = Math.abs(Math.sin(clock.elapsedTime * 5.2 + index * 1.1)) * 0.08 * intensity;
    position.y += hop;
    target.position.copy(position);
    target.rotation.y = Math.atan2(
      returning ? -direction.x : direction.x,
      returning ? -direction.z : direction.z,
    );
    const squash = 1 + Math.sin(clock.elapsedTime * 5.2 + index * 1.1) * 0.035 * intensity;
    const settle = returning && elapsed > 0.8
      ? THREE.MathUtils.lerp(1, 0.82, THREE.MathUtils.clamp((elapsed - 0.8) / 0.16, 0, 1))
      : 1;
    const scale = 0.34 * settle;
    target.scale.set(scale / squash, scale * squash, scale / squash);
  });

  return <group ref={group}><primitive object={model} /></group>;
}

export function DispatchMapStage({ travelers }: { travelers: readonly DispatchTraveler[] }) {
  const previousTravelers = useRef<readonly DispatchTraveler[]>(travelers);
  const returnSerial = useRef(0);
  const returnTimers = useRef<Set<number>>(new Set());
  const [returningTravelers, setReturningTravelers] = useState<readonly ReturningTraveler[]>([]);

  useEffect(() => () => {
    for (const timer of returnTimers.current) window.clearTimeout(timer);
    returnTimers.current.clear();
  }, []);

  useEffect(() => {
    const activeIds = new Set(travelers.map((traveler) => traveler.contractId));
    const completed = previousTravelers.current.filter((traveler) => !activeIds.has(traveler.contractId));
    previousTravelers.current = travelers;
    if (completed.length === 0) return;

    const additions = completed.map((traveler) => ({
      ...traveler,
      progress: 1,
      returnKey: ++returnSerial.current,
    }));
    setReturningTravelers((current) => [...current, ...additions]);

    const keys = new Set(additions.map((traveler) => traveler.returnKey));
    const timer = window.setTimeout(() => {
      returnTimers.current.delete(timer);
      setReturningTravelers((current) => current.filter((traveler) => !keys.has(traveler.returnKey)));
    }, 1040);
    returnTimers.current.add(timer);
  }, [travelers]);

  return (
    <div className="dispatch-map-stage" aria-hidden="true">
      <Canvas
        camera={{ fov: 39, near: 0.1, far: 50, position: [0, 8.4, 10.6] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
      >
        <hemisphereLight args={['#edfaff', '#70975d', 2.1]} />
        <directionalLight position={[-4, 9, 5]} intensity={3.1} color="#fff2d2" castShadow />
        <MapEnvironment />
        {travelers.map((traveler, index) => (
          <Traveler key={traveler.contractId} traveler={traveler} index={index} />
        ))}
        {returningTravelers.map((traveler, index) => (
          <Traveler
            key={'return-' + traveler.contractId + '-' + traveler.returnKey}
            traveler={traveler}
            index={travelers.length + index}
            returning
          />
        ))}
      </Canvas>
    </div>
  );
}