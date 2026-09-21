import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
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
}>;

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

function Traveler({ traveler, index }: { traveler: DispatchTraveler; index: number }) {
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
    position.lerpVectors(start, end, THREE.MathUtils.clamp(traveler.progress, 0, 1));
    position.y += Math.abs(Math.sin(clock.elapsedTime * 4.6 + index * 1.1)) * 0.08;
    target.position.copy(position);
    target.rotation.y = Math.atan2(direction.x, direction.z);
    const squash = 1 + Math.sin(clock.elapsedTime * 4.6 + index * 1.1) * 0.035;
    target.scale.set(0.34 / squash, 0.34 * squash, 0.34 / squash);
  });

  return <group ref={group}><primitive object={model} /></group>;
}

export function DispatchMapStage({ travelers }: { travelers: readonly DispatchTraveler[] }) {
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
      </Canvas>
    </div>
  );
}
