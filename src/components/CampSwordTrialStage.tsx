import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SLIMES } from '../game/slimes';

const SWORD_ASSET = `${import.meta.env.BASE_URL}${SLIMES.sword.asset}`;
useLoader.preload(GLTFLoader, SWORD_ASSET);

function SwordActor({ attemptKey, completed }: { attemptKey: number; completed: boolean }) {
  const gltf = useLoader(GLTFLoader, SWORD_ASSET);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const group = useRef<THREE.Group>(null);
  const startedAt = useRef(-Infinity);
  const latestTime = useRef(0);

  useEffect(() => {
    startedAt.current = latestTime.current;
  }, [attemptKey]);

  useFrame(({ clock }) => {
    latestTime.current = clock.elapsedTime;
    const node = group.current;
    if (node === null) return;

    const time = clock.elapsedTime;
    const elapsed = time - startedAt.current;
    const baseX = -0.36;
    const baseY = -0.58;
    node.position.set(baseX, baseY, 0);
    node.rotation.set(0, Math.PI / 2, 0);
    node.scale.setScalar(0.62);

    if (attemptKey > 0 && elapsed >= 0 && elapsed < 1.72) {
      if (elapsed < 0.28) {
        const u = elapsed / 0.28;
        node.position.x = baseX - 0.09 * u;
        node.position.y = baseY - 0.025 * u;
        node.scale.set(0.62 * (1 + 0.10 * u), 0.62 * (1 - 0.12 * u), 0.62);
        node.rotation.z = 0.08 * u;
        return;
      }
      if (elapsed < 0.62) {
        const u = (elapsed - 0.28) / 0.34;
        const eased = 1 - Math.pow(1 - u, 3);
        node.position.x = THREE.MathUtils.lerp(baseX - 0.09, 0.22, eased);
        node.position.y = baseY + Math.sin(u * Math.PI) * 0.17;
        node.rotation.z = THREE.MathUtils.lerp(0.08, -0.22, eased);
        node.scale.set(0.62 * (1 - 0.06 * u), 0.62 * (1 + 0.12 * u), 0.62);
        return;
      }
      if (elapsed < 0.82) {
        const u = (elapsed - 0.62) / 0.20;
        node.position.x = 0.22 + 0.10 * u;
        node.position.y = baseY + 0.025;
        node.rotation.z = THREE.MathUtils.lerp(-0.22, 0.28, u);
        node.scale.set(0.62 * (1 + 0.14 * (1 - u)), 0.62 * (1 - 0.16 * (1 - u)), 0.62);
        return;
      }
      const u = Math.min(1, (elapsed - 0.82) / 0.90);
      node.position.x = THREE.MathUtils.lerp(0.32, baseX, u);
      node.position.y = baseY + Math.sin(u * Math.PI) * 0.10;
      node.rotation.z = Math.sin(u * Math.PI) * -0.05;
      return;
    }

    const idle = Math.sin(time * 3.1) * 0.014;
    node.position.y = baseY + idle;
    node.scale.set(0.62 * (1 + idle * 0.7), 0.62 * (1 - idle * 0.5), 0.62);
    if (completed) node.rotation.z = Math.sin(time * 2.4) * 0.02;
  });

  return <group ref={group}><primitive object={model} /></group>;
}

function SlashTrail({ attemptKey }: { attemptKey: number }) {
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const startedAt = useRef(-Infinity);
  const latestTime = useRef(0);

  useEffect(() => {
    startedAt.current = latestTime.current;
  }, [attemptKey]);

  useFrame(({ clock }) => {
    latestTime.current = clock.elapsedTime;
    if (material.current === null || mesh.current === null) return;
    const elapsed = clock.elapsedTime - startedAt.current;
    const visible = attemptKey > 0 && elapsed >= 0.56 && elapsed <= 0.92;
    material.current.opacity = visible ? Math.max(0, 0.88 - Math.abs(elapsed - 0.72) * 3.5) : 0;
    mesh.current.rotation.z = -0.55 + Math.max(0, Math.min(1, (elapsed - 0.56) / 0.36)) * 1.2;
  });

  return (
    <mesh ref={mesh} position={[0.45, -0.02, 0.12]} rotation={[0, 0, -0.55]}>
      <ringGeometry args={[0.42, 0.52, 28, 1, -0.85, 1.7]} />
      <meshBasicMaterial ref={material} color="#fff5bd" transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

function TrainingDummy({ attemptKey }: { attemptKey: number }) {
  const group = useRef<THREE.Group>(null);
  const startedAt = useRef(-Infinity);
  const latestTime = useRef(0);

  useEffect(() => {
    startedAt.current = latestTime.current;
  }, [attemptKey]);

  useFrame(({ clock }) => {
    latestTime.current = clock.elapsedTime;
    const node = group.current;
    if (node === null) return;
    const elapsed = clock.elapsedTime - startedAt.current;
    node.position.set(0.78, -0.60, 0);
    node.rotation.set(0, -0.12, 0);
    if (attemptKey > 0 && elapsed >= 0.65 && elapsed < 1.22) {
      const u = (elapsed - 0.65) / 0.57;
      node.position.x = 0.78 + Math.sin(u * Math.PI) * 0.08;
      node.rotation.z = Math.sin(u * Math.PI * 2.5) * 0.12 * (1 - u);
    }
  });

  const wood = '#a66f3f';
  const darkWood = '#81522f';
  return (
    <group ref={group}>
      <mesh position={[0, 0.38, 0]} castShadow><cylinderGeometry args={[0.13, 0.16, 0.72, 12]} /><meshStandardMaterial color={wood} roughness={0.82} /></mesh>
      <mesh position={[0, 0.86, 0]} castShadow><sphereGeometry args={[0.19, 16, 12]} /><meshStandardMaterial color="#bc8450" roughness={0.82} /></mesh>
      <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.055, 0.055, 0.72, 10]} /><meshStandardMaterial color={darkWood} roughness={0.88} /></mesh>
      <mesh position={[0, -0.02, 0]} castShadow><cylinderGeometry args={[0.34, 0.40, 0.10, 18]} /><meshStandardMaterial color={darkWood} roughness={0.9} /></mesh>
    </group>
  );
}

export function CampSwordTrialStage({ onComplete }: { onComplete: () => void }) {
  const [attemptKey, setAttemptKey] = useState(0);
  const [attempting, setAttempting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => () => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
  }, []);

  const schedule = (callback: () => void, delayMs: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((active) => active !== timer);
      callback();
    }, delayMs);
    timersRef.current.push(timer);
  };

  const trySword = () => {
    if (attempting || completed) return;
    setAttempting(true);
    setAttemptKey((current) => current + 1);
    schedule(() => {
      setAttempting(false);
      setCompleted(true);
    }, 1650);
    // Keep the successful comparison visible for a full beat before advancing the cue.
    schedule(onComplete, 2550);
  };

  return (
    <div className={`camp-sword-trial ${attempting ? 'camp-sword-trial--attempting' : ''} ${completed ? 'camp-sword-trial--completed' : ''}`}>
      <div className="camp-sword-trial__stage" aria-label="剣士スライムが同じ木人へ再挑戦する">
        <Canvas camera={{ fov: 29, near: 0.1, far: 30, position: [0, 1.25, 5.25] }} dpr={[1, 2]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} shadows>
          <ambientLight intensity={2.25} />
          <directionalLight position={[-3, 5, 4]} intensity={3.5} castShadow />
          <pointLight position={[1.7, 1.4, 2.4]} intensity={0.9} color="#fff2c2" />
          <SwordActor attemptKey={attemptKey} completed={completed} />
          <SlashTrail attemptKey={attemptKey} />
          <TrainingDummy attemptKey={attemptKey} />
        </Canvas>
      </div>

      <div className="camp-sword-trial__hp" aria-label={completed ? '木人の体力は72%' : '木人の体力は100%'}>
        <span>木人</span><i><b style={{ width: completed || attempting ? '72%' : '100%' }} /></i><em>{completed || attempting ? '72%' : '100%'}</em>
      </div>

      {attempting && <div className="camp-sword-trial__damage" aria-live="polite">28</div>}
      {completed && <div className="camp-sword-trial__speech" role="status">さっきと違う。</div>}

      {!completed && (
        <button className="camp-sword-trial__action is-tutorial-target" type="button" disabled={attempting} onClick={trySword}>
          <strong>{attempting ? '斬り込む…' : 'もう一度、木人へ'}</strong>
          <small>今度は剣を持っている</small>
        </button>
      )}
    </div>
  );
}
