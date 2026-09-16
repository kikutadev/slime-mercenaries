import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getSlimePresentationForRank, type SlimeId } from '../game/slimes';

export type CampSlimeReaction = 'idle' | 'level-up' | 'formation' | 'recruit';

type MorphMesh = THREE.Mesh & {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
};

interface ModelParts {
  body: MorphMesh | null;
  bodyBaseScale: THREE.Vector3;
}

interface CampResidentProps {
  slimeId: SlimeId;
  fusionRank: number;
  reaction: CampSlimeReaction;
  reactionKey: number;
}

const MODEL_SCALE = 0.54;

function setMorph(body: MorphMesh | null, name: string, value: number) {
  if (!body?.morphTargetDictionary || !body.morphTargetInfluences) return;
  const index = body.morphTargetDictionary[name];
  if (index === undefined) return;
  body.morphTargetInfluences[index] = THREE.MathUtils.clamp(value, 0, 1);
}

function resetBody(parts: ModelParts) {
  parts.body?.morphTargetInfluences?.fill(0);
  parts.body?.scale.copy(parts.bodyBaseScale);
}

function animateIdle(parts: ModelParts, time: number) {
  resetBody(parts);
  const breathe = Math.sin(time * 2.25);
  setMorph(parts.body, 'Squash', 0.025 * (0.5 + 0.5 * breathe));
  setMorph(parts.body, 'Stretch', 0.014 * (0.5 - 0.5 * breathe));
  const sway = Math.sin(time * 1.15) * 0.045;
  setMorph(parts.body, sway < 0 ? 'LeanLeft' : 'LeanRight', Math.abs(sway));
  setMorph(parts.body, sway < 0 ? 'WobbleLeft' : 'WobbleRight', Math.abs(sway) * 0.72);
}

function CampResident({ slimeId, fusionRank, reaction, reactionKey }: CampResidentProps) {
  const presentation = getSlimePresentationForRank(slimeId, fusionRank);
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${presentation.asset}`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const parts = useMemo<ModelParts>(() => {
    const body = model.getObjectByName('Body') as MorphMesh | null;
    return {
      body,
      bodyBaseScale: body?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
    };
  }, [model]);
  const groupRef = useRef<THREE.Group>(null);
  const latestTime = useRef(0);
  const reactionStartedAt = useRef(-Infinity);

  useEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [model]);

  useEffect(() => {
    if (reaction === 'idle') return;
    reactionStartedAt.current = latestTime.current;
  }, [reaction, reactionKey]);

  useFrame(({ clock }) => {
    latestTime.current = clock.elapsedTime;
    const group = groupRef.current;
    if (!group) return;

    const time = clock.elapsedTime;
    const elapsed = time - reactionStartedAt.current;
    group.position.set(0, -0.50, 0);
    group.rotation.set(0, -0.24 + Math.sin(time * 0.55) * 0.025, 0);
    group.scale.setScalar(MODEL_SCALE);
    animateIdle(parts, time);

    if (reaction === 'level-up' && elapsed >= 0 && elapsed < 0.92) {
      resetBody(parts);
      if (elapsed < 0.18) {
        const u = elapsed / 0.18;
        setMorph(parts.body, 'Squash', 0.38 * u);
        group.scale.set(MODEL_SCALE * (1 + 0.08 * u), MODEL_SCALE * (1 - 0.12 * u), MODEL_SCALE);
      } else if (elapsed < 0.55) {
        const u = (elapsed - 0.18) / 0.37;
        const jump = Math.sin(u * Math.PI) * 0.48;
        group.position.y = -0.50 + jump;
        setMorph(parts.body, 'Stretch', 0.30 * Math.sin(u * Math.PI));
        group.rotation.y = -0.24 + Math.sin(u * Math.PI) * 0.18;
      } else {
        const u = (elapsed - 0.55) / 0.37;
        const settle = Math.sin(u * Math.PI) * (1 - u);
        setMorph(parts.body, 'Squash', 0.22 * settle);
        setMorph(parts.body, 'WobbleRight', 0.16 * settle);
      }
      return;
    }

    if (reaction === 'formation' && elapsed >= 0 && elapsed < 0.78) {
      resetBody(parts);
      const u = elapsed / 0.78;
      const hop = Math.sin(Math.min(1, u * 1.25) * Math.PI) * 0.26;
      group.position.y = -0.50 + hop;
      group.rotation.y = -0.24 + Math.sin(u * Math.PI * 2) * 0.42;
      setMorph(parts.body, 'Squash', 0.16 * Math.max(0, Math.sin(u * Math.PI * 2)));
      setMorph(parts.body, 'Stretch', 0.18 * Math.max(0, Math.sin((u - 0.08) * Math.PI)));
      return;
    }

    if (reaction === 'recruit' && elapsed >= 0 && elapsed < 1.12) {
      resetBody(parts);
      const u = elapsed / 1.12;
      const hop = Math.abs(Math.sin(u * Math.PI * 2.05)) * (1 - u * 0.28) * 0.34;
      group.position.y = -0.50 + hop;
      group.rotation.y = -0.24 + u * Math.PI * 2;
      setMorph(parts.body, 'Stretch', 0.24 * Math.max(0, Math.sin(u * Math.PI * 4)));
      setMorph(parts.body, 'WobbleLeft', 0.12 * Math.abs(Math.sin(u * Math.PI * 3)));
    }
  });

  return <group ref={groupRef}><primitive object={model} /></group>;
}

interface CampSlimeStageProps {
  slimeId: SlimeId;
  fusionRank: number;
  reaction: CampSlimeReaction;
  reactionKey: number;
}

/** Camp-only character stage. Fusion choreography deliberately lives elsewhere. */
export function CampSlimeStage({ slimeId, fusionRank, reaction, reactionKey }: CampSlimeStageProps) {
  const presentation = getSlimePresentationForRank(slimeId, fusionRank);
  return (
    <div className={`camp-resident-stage camp-resident-stage--${reaction}`} aria-label={`${presentation.name}のキャンプ表示`}>
      <Canvas
        camera={{ fov: 27, near: 0.1, far: 30, position: [0, 1.72, 5.75] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
      >
        <ambientLight intensity={2.1} />
        <directionalLight position={[-3, 5, 4]} intensity={4.0} castShadow />
        <pointLight position={[2.2, 1.8, 2]} intensity={1.15} color={presentation.accent} />
        <CampResident slimeId={slimeId} fusionRank={fusionRank} reaction={reaction} reactionKey={reactionKey} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]} receiveShadow>
          <circleGeometry args={[1.42, 48]} />
          <meshStandardMaterial color="#d6e8b8" roughness={1} transparent opacity={0.68} />
        </mesh>
      </Canvas>
    </div>
  );
}
