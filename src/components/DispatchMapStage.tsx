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

export type DispatchMapAnchorPositions = Readonly<Record<DispatchContractId, Readonly<{ x: number; y: number }>>>;

type ReturningTraveler = DispatchTraveler & Readonly<{ returnKey: number }>;

function MapEnvironment() {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}assets/environments/dispatch-map.glb`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const { camera, scene } = useThree();

  useEffect(() => {
    const previousFog = scene.fog;
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
    return () => {
      scene.fog = previousFog;
    };
  }, [camera, model, scene]);

  return <primitive object={model} />;
}

function MapAnchorReporter({
  onChange,
}: {
  onChange: ((positions: DispatchMapAnchorPositions) => void) | undefined;
}) {
  const { camera, size } = useThree();
  const previousKey = useRef('');
  const scratch = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (onChange === undefined || size.width <= 0 || size.height <= 0) return;
    const entries = (Object.entries(dispatchRoutePresentation) as [DispatchContractId, (typeof dispatchRoutePresentation)[DispatchContractId]][])
      .map(([contractId, route]) => {
        scratch.set(...route.labelAnchor).project(camera);
        const projectedX = ((scratch.x + 1) * 50);
        const projectedY = ((1 - scratch.y) * 50);
        return [contractId, {
          // Destination labels are DOM controls with real width, so keep their centers inside
          // a safe horizontal band even when the 3D landmark itself sits at the diorama edge.
          x: Math.round(THREE.MathUtils.clamp(projectedX, 16, 84) * 10) / 10,
          y: Math.round(THREE.MathUtils.clamp(projectedY, 16, 88) * 10) / 10,
        }] as const;
      });
    const next = Object.fromEntries(entries) as DispatchMapAnchorPositions;
    const key = entries.map(([id, point]) => `${id}:${point.x},${point.y}`).join('|');
    if (key === previousKey.current) return;
    previousKey.current = key;
    onChange(next);
  });

  return null;
}

function createRouteSampler(waypoints: readonly (readonly [number, number, number])[]) {
  const points = waypoints.map((point) => new THREE.Vector3(...point));
  const segments = points.slice(1).map((point, index) => {
    const start = points[index]!;
    return {
      start,
      end: point,
      length: start.distanceTo(point),
    };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);

  return (progress: number, position: THREE.Vector3, direction: THREE.Vector3) => {
    if (segments.length === 0 || totalLength <= 0) {
      position.copy(points[0] ?? new THREE.Vector3());
      direction.set(0, 0, 1);
      return;
    }
    let remaining = THREE.MathUtils.clamp(progress, 0, 1) * totalLength;
    let segment = segments[segments.length - 1]!;
    for (const candidate of segments) {
      if (remaining <= candidate.length) {
        segment = candidate;
        break;
      }
      remaining -= candidate.length;
    }
    const u = segment.length <= 0 ? 0 : THREE.MathUtils.clamp(remaining / segment.length, 0, 1);
    position.lerpVectors(segment.start, segment.end, u);
    direction.subVectors(segment.end, segment.start).normalize();
  };
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
  const sampleRoute = useMemo(() => createRouteSampler(route.waypoints), [route.waypoints]);
  const position = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
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

    sampleRoute(visibleProgress, position, direction);
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

export function DispatchMapStage({
  travelers,
  onAnchorPositionsChange,
}: {
  travelers: readonly DispatchTraveler[];
  onAnchorPositionsChange?: (positions: DispatchMapAnchorPositions) => void;
}) {
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
        <MapAnchorReporter onChange={onAnchorPositionsChange} />
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
