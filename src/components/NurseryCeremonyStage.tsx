import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { JobSlimeId } from '../domain';
import { SLIMES } from '../game/slimes';
import { NurseryIcon } from './NurseryIcon';

export type NurseryCeremonyKind = 'craft' | 'purchase' | 'job';

export type NurseryCeremony = Readonly<{
  key: number;
  kind: NurseryCeremonyKind;
  beforeStock: number;
  jobName?: string;
  jobId?: JobSlimeId;
}>;

type MorphMesh = THREE.Mesh & {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
};

function setMorph(body: MorphMesh | null, name: string, value: number) {
  if (!body?.morphTargetDictionary || !body.morphTargetInfluences) return;
  const index = body.morphTargetDictionary[name];
  if (index === undefined) return;
  body.morphTargetInfluences[index] = THREE.MathUtils.clamp(value, 0, 1);
}


function NurseryJobGearIcon({ jobId }: { jobId: JobSlimeId }) {
  if (jobId === 'sword') {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M20 4l8 8-14 14-8-8zM7 17l8 8M5 27l5-5" /></svg>;
  }
  if (jobId === 'shield') {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4l10 4v7c0 6-4 10-10 13-6-3-10-7-10-13V8zM16 8v15" /></svg>;
  }
  if (jobId === 'bow') {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 5c9 6 9 16 0 22M8 5l12 11L8 27M20 16h8M25 13l3 3-3 3" /></svg>;
  }
  if (jobId === 'wand') {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 26L22 9M21 4l1.6 3.4L26 9l-3.4 1.6L21 14l-1.6-3.4L16 9l3.4-1.6z" /></svg>;
  }
  if (jobId === 'dagger') {
    return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 25L20 8l5-2-1 5L11 27zM7 21l5 4M17 9l5 4" /></svg>;
  }
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 13h16l4 4-4 4H6zM9 21v5h6l2-5M23 14v-4h4" /></svg>;
}


function NurseryJobResult({ jobId }: { jobId: JobSlimeId }) {
  const definition = SLIMES[jobId];
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${definition.asset}`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const groupRef = useRef<THREE.Group>(null);
  const body = useMemo(() => model.getObjectByName('Body') as MorphMesh | null, [model]);
  const bodyBaseScale = useMemo(() => body?.scale.clone() ?? new THREE.Vector3(1, 1, 1), [body]);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [model]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    if (startedAt.current === null) startedAt.current = clock.elapsedTime;

    const elapsed = clock.elapsedTime - startedAt.current;
    const revealU = THREE.MathUtils.clamp((elapsed - 0.46) / 0.48, 0, 1);
    const identityU = THREE.MathUtils.clamp((elapsed - 0.88) / 0.34, 0, 1);
    group.visible = elapsed >= 0.46;

    if (!group.visible) return;

    body?.morphTargetInfluences?.fill(0);
    body?.scale.copy(bodyBaseScale);

    const revealEase = 1 - ((1 - revealU) ** 3);
    const overshoot = 1 + Math.sin(revealU * Math.PI) * 0.10;
    group.position.set(0, -0.58 + Math.sin(revealU * Math.PI) * 0.18, 0);
    group.scale.setScalar(0.58 * THREE.MathUtils.lerp(0.18, 1, revealEase) * overshoot);
    group.rotation.set(0, THREE.MathUtils.lerp(0.62, -0.2, revealEase), 0);

    if (revealU < 1) {
      setMorph(body, 'Stretch', Math.sin(revealU * Math.PI) * 0.28);
      return;
    }

    const beat = Math.sin(identityU * Math.PI);
    switch (jobId) {
      case 'sword':
        group.rotation.y = -0.2 + beat * 0.44;
        setMorph(body, 'Stretch', beat * 0.14);
        break;
      case 'shield':
        group.scale.set(0.58 * (1 + beat * 0.08), 0.58 * (1 - beat * 0.10), 0.58);
        setMorph(body, 'Squash', beat * 0.18);
        break;
      case 'bow':
        group.position.x = Math.sin(identityU * Math.PI * 2) * 0.08;
        group.rotation.y = -0.2 - beat * 0.22;
        setMorph(body, 'LeanLeft', beat * 0.11);
        break;
      case 'wand':
        group.position.y = -0.58 + beat * 0.16;
        group.rotation.y = -0.2 + identityU * Math.PI * 0.32;
        setMorph(body, 'Stretch', beat * 0.12);
        break;
      case 'dagger':
        group.rotation.y = -0.2 + Math.sin(identityU * Math.PI * 4) * beat * 0.28;
        setMorph(body, 'WobbleRight', beat * 0.14);
        break;
      case 'gun':
        group.position.x = -beat * 0.10;
        group.rotation.y = -0.2 - beat * 0.18;
        setMorph(body, 'Squash', beat * 0.12);
        break;
    }
  });

  return <group ref={groupRef} visible={false}><primitive object={model} /></group>;
}

function NurseryResident({ ceremony }: { ceremony: NurseryCeremony | null }) {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}assets/plain-slime.glb`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const groupRef = useRef<THREE.Group>(null);
  const body = useMemo(() => model.getObjectByName('Body') as MorphMesh | null, [model]);
  const baseScale = useMemo(() => body?.scale.clone() ?? new THREE.Vector3(1, 1, 1), [body]);
  const latestTime = useRef(0);
  const startedAt = useRef(-Infinity);

  useEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [model]);

  useEffect(() => {
    if (ceremony === null) return;
    startedAt.current = latestTime.current;
  }, [ceremony?.key]);

  useFrame(({ clock }) => {
    latestTime.current = clock.elapsedTime;
    const group = groupRef.current;
    if (!group) return;

    const time = clock.elapsedTime;
    const elapsed = time - startedAt.current;
    body?.morphTargetInfluences?.fill(0);
    body?.scale.copy(baseScale);
    group.visible = true;
    group.position.set(0, -0.58, 0);
    group.rotation.set(0, -0.2 + Math.sin(time * 0.65) * 0.025, 0);
    group.scale.setScalar(0.58);

    if (ceremony === null) {
      const breathe = 0.5 + 0.5 * Math.sin(time * 2.2);
      setMorph(body, 'Squash', breathe * 0.035);
      setMorph(body, 'WobbleLeft', Math.max(0, Math.sin(time * 1.2)) * 0.035);
      setMorph(body, 'WobbleRight', Math.max(0, -Math.sin(time * 1.2)) * 0.035);
      return;
    }

    if (ceremony.kind === 'craft') {
      if (elapsed < 0.32) {
        group.visible = false;
        return;
      }
      const u = THREE.MathUtils.clamp((elapsed - 0.32) / 0.58, 0, 1);
      const pop = Math.sin(u * Math.PI);
      group.position.y = -1.05 + u * 0.47 + pop * 0.24;
      group.scale.setScalar(0.22 + u * 0.36);
      setMorph(body, 'Stretch', pop * 0.42);
      setMorph(body, 'Squash', Math.max(0, Math.sin((u - 0.55) * Math.PI * 2)) * 0.28);
      return;
    }

    if (ceremony.kind === 'purchase') {
      const u = THREE.MathUtils.clamp(elapsed / 0.72, 0, 1);
      const eased = 1 - Math.pow(1 - u, 3);
      group.position.x = 1.55 * (1 - eased);
      group.position.y = -0.58 + Math.sin(u * Math.PI * 2) * (1 - u * 0.5) * 0.2;
      group.rotation.y = -0.2 + (1 - u) * 0.8;
      setMorph(body, 'WobbleLeft', Math.abs(Math.sin(u * Math.PI * 3)) * 0.15);
      return;
    }

    if (elapsed >= 0.50) {
      group.visible = false;
      return;
    }
    const u = THREE.MathUtils.clamp(elapsed / 0.50, 0, 1);
    const anticipation = Math.sin(u * Math.PI);
    group.rotation.y = -0.2 + u * Math.PI * 0.72;
    group.position.y = -0.58 - anticipation * 0.06;
    group.scale.set(0.58 * (1 + anticipation * 0.10), 0.58 * (1 - anticipation * 0.18), 0.58);
    setMorph(body, 'Squash', anticipation * 0.34);
  });

  return <group ref={groupRef}><primitive object={model} /></group>;
}

export function NurseryCeremonyStage({
  ceremony,
  stockLabel,
}: {
  ceremony: NurseryCeremony | null;
  stockLabel: string;
}) {
  const kind = ceremony?.kind ?? 'idle';
  const status = ceremony?.kind === 'craft'
    ? '素材がひとつの命になります'
    : ceremony?.kind === 'purchase'
      ? '新しい仲間がキャンプへ到着'
      : ceremony?.kind === 'job'
        ? `${ceremony.jobName ?? '新しい職業'}へ`
        : 'プレーンスライム';

  return (
    <div className={`nursery-stage nursery-stage--${kind}`} key={ceremony?.key ?? 0}>
      <div className="nursery-stage__scene" aria-hidden="true">
        <div className="nursery-stage__backglow" />
        <div className="nursery-stage__vat">
          <div className="nursery-stage__liquid" />
          <Canvas
            camera={{ fov: 27, near: 0.1, far: 30, position: [0, 1.65, 5.5] }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            shadows
          >
            <ambientLight intensity={2.3} />
            <directionalLight position={[-3, 4.5, 4]} intensity={4.0} castShadow />
            <pointLight position={[2, 1.5, 2]} intensity={1.2} color="#89e8f4" />
            <NurseryResident ceremony={ceremony} />
            {ceremony?.kind === 'job' && ceremony.jobId !== undefined && (
              <NurseryJobResult jobId={ceremony.jobId} />
            )}
          </Canvas>
          <div className="nursery-stage__ring" />
          <div className="nursery-stage__flash" />
        </div>

        {ceremony?.kind === 'craft' && (
          <div className="nursery-stage__ingredients">
            <span className="is-gel"><NurseryIcon kind="gel" /></span>
            <span className="is-water"><NurseryIcon kind="water" /></span>
            <span className="is-gel is-small"><NurseryIcon kind="gel" /></span>
          </div>
        )}
        {ceremony?.kind === 'purchase' && (
          <div className="nursery-stage__coins"><i /><i /><i /><i /><i /></div>
        )}
        {ceremony?.kind === 'job' && ceremony.jobId !== undefined && (
          <div className="nursery-stage__job-tool"><NurseryJobGearIcon jobId={ceremony.jobId} /></div>
        )}
        {ceremony !== null && (
          <div className="nursery-stage__result">
            <strong>
              {ceremony.kind === 'job'
                ? ceremony.jobName
                : ceremony.kind === 'purchase'
                  ? 'プレーンスライムが到着'
                  : 'プレーンスライム +1'}
            </strong>
            <span>
              {ceremony.kind === 'job'
                ? '仲間になりました'
                : ceremony.kind === 'purchase'
                  ? 'キャンプへ仲間入り'
                  : '生成槽から誕生'}
            </span>
          </div>
        )}
      </div>

      <div className="nursery-stage__caption" role="status" aria-live="polite">
        <span>{status}</span>
        <strong>{stockLabel}</strong>
      </div>
    </div>
  );
}