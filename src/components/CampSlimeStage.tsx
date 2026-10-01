import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getCampIdleMotion } from '../game/camp-slime-motion';
import type { CampReaction } from '../game/camp-types';
import type { CampTemperament } from '../game/camp-temperament';
import type { SlimePresentation } from '../game/slimes';
import { applySlimeMutationVisuals, disposeSlimeMutationVisuals } from '../game/slime-mutation-visuals';

type MorphMesh = THREE.Mesh & {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
};

interface FacePart {
  object: THREE.Object3D;
  baseScale: THREE.Vector3;
}

interface ModelParts {
  body: MorphMesh | null;
  bodyBaseScale: THREE.Vector3;
  eyes: readonly FacePart[];
}

interface CampResidentProps {
  presentation: SlimePresentation;
  reaction: CampReaction;
  reactionKey: number;
  reactionStrength: 1 | 2 | 3;
  temperament: CampTemperament | null;
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
  for (const eye of parts.eyes) eye.object.scale.copy(eye.baseScale);
}

function animateIdle(
  parts: ModelParts,
  time: number,
  presentation: SlimePresentation,
  group: THREE.Group,
  temperament: CampTemperament | null,
) {
  resetBody(parts);
  const pose = getCampIdleMotion(time, presentation.id, temperament);
  group.position.set(pose.offsetX, -0.50 + pose.offsetY, 0);
  group.rotation.set(pose.pitch, -0.24 + pose.yawOffset, pose.roll);
  setMorph(parts.body, 'Squash', pose.squash);
  setMorph(parts.body, 'Stretch', pose.stretch);
  setMorph(parts.body, pose.lean < 0 ? 'LeanLeft' : 'LeanRight', Math.abs(pose.lean));
  setMorph(parts.body, pose.wobble < 0 ? 'WobbleLeft' : 'WobbleRight', Math.abs(pose.wobble));
  for (const eye of parts.eyes) {
    eye.object.scale.set(
      eye.baseScale.x,
      eye.baseScale.y * THREE.MathUtils.clamp(pose.eyeOpen, 0.12, 1),
      eye.baseScale.z,
    );
  }
}

function CampResident({
  presentation,
  reaction,
  reactionKey,
  reactionStrength,
  temperament,
}: CampResidentProps) {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${presentation.asset}`);
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true);
    applySlimeMutationVisuals(clone, presentation.mutationId);
    return clone;
  }, [gltf.scene, presentation.mutationId]);
  const parts = useMemo<ModelParts>(() => {
    const body = model.getObjectByName('Body') as MorphMesh | null;
    const eyes = ['Eye_L', 'Eye_R']
      .map((name) => model.getObjectByName(name))
      .filter((object): object is THREE.Object3D => object !== undefined)
      .map((object) => ({ object, baseScale: object.scale.clone() }));
    return {
      body,
      bodyBaseScale: body?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
      eyes,
    };
  }, [model]);
  const groupRef = useRef<THREE.Group>(null);
  const latestTime = useRef(0);
  const reactionStartedAt = useRef(-Infinity);
  const idleStartedAt = useRef(0);

  useEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return () => disposeSlimeMutationVisuals(model);
  }, [model]);

  useEffect(() => {
    if (reaction === 'idle') {
      idleStartedAt.current = latestTime.current;
      return;
    }
    reactionStartedAt.current = latestTime.current;
  }, [reaction, reactionKey, presentation.asset]);

  useFrame(({ clock }) => {
    latestTime.current = clock.elapsedTime;
    const group = groupRef.current;
    if (!group) return;

    const time = clock.elapsedTime;
    const elapsed = time - reactionStartedAt.current;
    group.position.set(0, -0.50, 0);
    group.rotation.set(0, -0.24, 0);
    group.scale.setScalar(MODEL_SCALE);

    if (reaction === 'level-up' && elapsed >= 0 && elapsed < 1.12) {
      resetBody(parts);
      const power = reactionStrength === 1 ? 1 : reactionStrength === 2 ? 1.34 : 1.72;
      if (elapsed < 0.18) {
        const u = elapsed / 0.18;
        setMorph(parts.body, 'Squash', Math.min(0.58, 0.34 * power * u));
        group.scale.set(
          MODEL_SCALE * (1 + 0.07 * power * u),
          MODEL_SCALE * (1 - 0.10 * power * u),
          MODEL_SCALE,
        );
      } else if (elapsed < 0.68) {
        const u = (elapsed - 0.18) / 0.50;
        const jump = Math.sin(u * Math.PI) * (0.36 + 0.12 * power);
        group.position.y = -0.50 + jump;
        setMorph(parts.body, 'Stretch', Math.min(0.52, 0.24 * power * Math.sin(u * Math.PI)));
        group.rotation.y = -0.24 + Math.sin(u * Math.PI) * (0.15 + 0.10 * power);
        if (reactionStrength === 3) {
          group.rotation.y += u * Math.PI * 0.82;
        }
      } else {
        const u = (elapsed - 0.68) / 0.44;
        const settle = Math.sin(u * Math.PI) * (1 - u);
        setMorph(parts.body, 'Squash', Math.min(0.40, 0.17 * power * settle));
        setMorph(
          parts.body,
          reactionStrength === 1 ? 'WobbleRight' : 'WobbleLeft',
          Math.min(0.30, 0.12 * power * settle),
        );
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
      return;
    }

    if (reaction === 'fusion' && elapsed >= 0 && elapsed < 1.16) {
      resetBody(parts);
      const u = elapsed / 1.16;
      const lift = Math.sin(u * Math.PI) * 0.22;
      const shimmer = Math.sin(u * Math.PI * 4) * (1 - u);
      group.position.y = -0.50 + lift;
      group.rotation.y = -0.24 + Math.sin(u * Math.PI) * 0.34;
      setMorph(parts.body, 'Stretch', Math.max(0, Math.sin(u * Math.PI * 2)) * 0.16);
      setMorph(parts.body, shimmer < 0 ? 'WobbleLeft' : 'WobbleRight', Math.abs(shimmer) * 0.10);
      return;
    }

    if (reaction === 'retreat' && elapsed >= 0 && elapsed < 2.85) {
      resetBody(parts);
      const u = elapsed / 2.85;
      const exhausted = 1 - u;
      const recoverHopU = Math.max(0, Math.min(1, (elapsed - 2.02) / 0.58));
      const recoverHop = recoverHopU > 0 && recoverHopU < 1 ? Math.sin(recoverHopU * Math.PI) : 0;
      group.position.y = -0.50 - exhausted * 0.06 + recoverHop * 0.07;
      group.rotation.z = -0.055 * exhausted + Math.sin(elapsed * 2.9) * exhausted * 0.018;
      setMorph(parts.body, 'Squash', 0.12 * exhausted);
      setMorph(parts.body, 'Stretch', 0.08 * recoverHop);
      setMorph(parts.body, 'WobbleLeft', Math.abs(Math.sin(elapsed * 2.6)) * exhausted * 0.08);
      for (const eye of parts.eyes) {
        eye.object.scale.set(
          eye.baseScale.x,
          eye.baseScale.y * (0.34 + u * 0.66),
          eye.baseScale.z,
        );
      }
      return;
    }

    const completedReactionDuration = reaction === 'level-up'
      ? 1.12
      : reaction === 'formation'
        ? 0.78
        : reaction === 'recruit'
          ? 1.12
          : reaction === 'fusion'
            ? 1.16
            : reaction === 'retreat'
              ? 2.85
              : 0;
    const idleTime = reaction === 'idle'
      ? Math.max(0, time - idleStartedAt.current)
      : Math.max(0, elapsed - completedReactionDuration);
    animateIdle(parts, idleTime, presentation, group, temperament);
  });

  return <group ref={groupRef}><primitive object={model} /></group>;
}

interface CampSlimeStageProps {
  presentation: SlimePresentation;
  reaction: CampReaction;
  reactionKey: number;
  reactionStrength?: 1 | 2 | 3;
  temperament?: CampTemperament | null;
}

/** Camp-only character stage. Fusion choreography deliberately lives elsewhere. */
export function CampSlimeStage({
  presentation,
  reaction,
  reactionKey,
  reactionStrength = 1,
  temperament = null,
}: CampSlimeStageProps) {
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
        <CampResident
          presentation={presentation}
          reaction={reaction}
          reactionKey={reactionKey}
          reactionStrength={reactionStrength}
          temperament={temperament}
        />
      </Canvas>
    </div>
  );
}
