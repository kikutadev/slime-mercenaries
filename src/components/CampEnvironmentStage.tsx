import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { CampSlimeReaction } from './CampSlimeStage';

interface Props {
  reaction: CampSlimeReaction;
  reactionKey: number;
  fusionReady: boolean;
}

function CampEnvironment({ reaction, reactionKey, fusionReady }: Props) {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}assets/environments/camp.glb`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const { camera, scene } = useThree();
  const reactionStartedAt = useRef(-Infinity);
  const timeRef = useRef(0);

  const dummyBody = useMemo(() => model.getObjectByName('TrainingDummyBody'), [model]);
  const dummyTarget = useMemo(() => model.getObjectByName('TrainingDummyTarget'), [model]);
  const dummyArm = useMemo(() => model.getObjectByName('TrainingDummyArm'), [model]);
  const formationFlag = useMemo(() => model.getObjectByName('FormationFlag'), [model]);
  const fusionRing = useMemo(() => model.getObjectByName('FusionAltarRing'), [model]);
  const nurseryBubble = useMemo(() => model.getObjectByName('NurserySlimeBubble'), [model]);
  const fusionCrystals = useMemo(
    () => [0, 1, 2, 3].map((index) => model.getObjectByName(`FusionCrystal_${index}`)).filter(Boolean) as THREE.Object3D[],
    [model],
  );

  useEffect(() => {
    scene.fog = new THREE.Fog('#cfe7bd', 12, 29);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, 6.8, 12.2);
      camera.fov = 42;
      camera.near = 0.1;
      camera.far = 50;
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0.55, 0.35);
    }
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [camera, model, scene]);

  useEffect(() => {
    if (reaction === 'idle') return;
    reactionStartedAt.current = timeRef.current;
  }, [reaction, reactionKey]);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    timeRef.current = now;
    const elapsed = now - reactionStartedAt.current;

    if (fusionRing !== undefined) {
      fusionRing.rotation.y = now * (fusionReady ? 0.72 : 0.18);
      const pulse = fusionReady ? 1 + Math.sin(now * 3.2) * 0.035 : 1;
      fusionRing.scale.setScalar(pulse);
    }
    fusionCrystals.forEach((crystal, index) => {
      const pulse = fusionReady ? 1 + Math.sin(now * 3.4 + index * 1.2) * 0.10 : 1;
      crystal.scale.setScalar(pulse);
    });

    if (nurseryBubble !== undefined) {
      nurseryBubble.position.y = 0.88 + Math.sin(now * 1.8) * 0.035;
      nurseryBubble.scale.y = 1 + Math.sin(now * 2.2) * 0.035;
    }

    if (formationFlag !== undefined) {
      formationFlag.rotation.z = Math.sin(now * 1.6) * 0.025;
      if (reaction === 'formation' && elapsed >= 0 && elapsed < 0.75) {
        formationFlag.rotation.z += Math.sin(elapsed * Math.PI * 5) * (1 - elapsed / 0.75) * 0.16;
      }
    }

    if (dummyBody !== undefined && dummyTarget !== undefined && dummyArm !== undefined) {
      const hit = reaction === 'level-up' && elapsed >= 0 && elapsed < 0.55
        ? Math.sin(Math.min(1, elapsed / 0.28) * Math.PI) * (1 - Math.min(1, elapsed / 0.55))
        : 0;
      dummyBody.rotation.z = -hit * 0.20;
      dummyTarget.rotation.z = -hit * 0.20;
      dummyArm.rotation.z = -hit * 0.24;
    }
  });

  return <primitive object={model} />;
}

/** Full-screen authored Camp diorama behind the selected slime and interaction labels. */
export function CampEnvironmentStage(props: Props) {
  return (
    <div className="camp-environment-stage" aria-hidden="true">
      <Canvas
        camera={{ fov: 42, near: 0.1, far: 50, position: [0, 6.8, 12.2] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
      >
        <hemisphereLight args={['#eaf8ff', '#6c9e55', 2.0]} />
        <directionalLight position={[-4, 8, 5]} intensity={3.2} color="#fff2cf" castShadow />
        <pointLight position={[2.6, 2.4, 0.4]} intensity={1.25} color="#8ff0c8" />
        <CampEnvironment {...props} />
      </Canvas>
    </div>
  );
}
