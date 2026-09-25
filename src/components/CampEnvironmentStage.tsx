import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getCampLifePose } from '../game/camp-life-motion';
import {
  campFormationFlagRotation,
  campFusionAltarPose,
  campNurseryBubblePose,
  campTrainingDummyHit,
} from '../game/camp-environment-reactions';
import type { CampLifeResidentSpec } from '../game/camp-life-residents';
import type { CampReaction } from '../game/camp-types';
import { CampLifePopulation } from './CampLifePopulation';

interface Props {
  reaction: CampReaction;
  reactionKey: number;
  fusionReady: boolean;
  residents: readonly CampLifeResidentSpec[];
}

function CampEnvironment({ reaction, reactionKey, fusionReady, residents, lifeOriginRef }: Props & { lifeOriginRef: MutableRefObject<number | null> }) {
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
    if (lifeOriginRef.current === null) lifeOriginRef.current = now;
    const lifeTime = now - lifeOriginRef.current;
    timeRef.current = now;
    const elapsed = now - reactionStartedAt.current;

    const fusionPose = campFusionAltarPose(now, fusionReady, reaction, elapsed);
    if (fusionRing !== undefined) {
      fusionRing.rotation.y = fusionPose.ringRotationY;
      fusionRing.scale.setScalar(fusionPose.ringScale);
    }
    fusionCrystals.forEach((crystal, index) => {
      crystal.scale.setScalar(fusionPose.crystalScale(index));
    });

    if (nurseryBubble !== undefined) {
      const bubblePose = campNurseryBubblePose(now);
      nurseryBubble.position.y = bubblePose.y;
      nurseryBubble.scale.y = bubblePose.scaleY;
    }

    if (formationFlag !== undefined) {
      formationFlag.rotation.z = campFormationFlagRotation(now, reaction, elapsed);
    }

    if (dummyBody !== undefined && dummyTarget !== undefined && dummyArm !== undefined) {
      const residentHit = residents[0] === undefined
        ? 0
        : getCampLifePose(lifeTime, 0, residents[0].presentation.id).practiceImpact;
      const hit = campTrainingDummyHit(reaction, elapsed, residentHit);
      dummyBody.rotation.z = -hit * 0.20;
      dummyTarget.rotation.z = -hit * 0.20;
      dummyArm.rotation.z = -hit * 0.24;
    }
  });

  return <primitive object={model} />;
}

/** Full-screen authored Camp diorama behind the selected slime and interaction labels. */
export function CampEnvironmentStage(props: Props) {
  const lifeOriginRef = useRef<number | null>(null);
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
        <CampEnvironment {...props} lifeOriginRef={lifeOriginRef} />
        <Suspense fallback={null}>
          <CampLifePopulation
            residents={props.residents}
            lifeOriginRef={lifeOriginRef}
            reaction={props.reaction}
            reactionKey={props.reactionKey}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
