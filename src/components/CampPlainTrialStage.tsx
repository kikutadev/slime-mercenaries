import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

useLoader.preload(GLTFLoader, `${import.meta.env.BASE_URL}assets/plain-slime.glb`);

function PlainActor({ attemptKey, completed }: { attemptKey: number; completed: boolean }) {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}assets/plain-slime.glb`);
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
    const baseX = -0.72;
    const baseY = -0.58;
    node.position.set(baseX, baseY, 0);
    node.rotation.set(0, -0.18, 0);
    node.scale.setScalar(0.62);

    if (attemptKey > 0 && elapsed >= 0 && elapsed < 1.72) {
      if (elapsed < 0.34) {
        const u = elapsed / 0.34;
        node.scale.set(0.62 * (1 + 0.14 * u), 0.62 * (1 - 0.16 * u), 0.62);
        node.position.y = baseY - 0.04 * u;
        return;
      }
      if (elapsed < 0.84) {
        const u = (elapsed - 0.34) / 0.50;
        const eased = 1 - Math.pow(1 - u, 3);
        node.position.x = THREE.MathUtils.lerp(baseX, 0.36, eased);
        node.position.y = baseY + Math.sin(u * Math.PI) * 0.26;
        node.scale.set(0.62 * (1 - 0.08 * u), 0.62 * (1 + 0.14 * u), 0.62);
        return;
      }
      if (elapsed < 1.02) {
        const u = (elapsed - 0.84) / 0.18;
        node.position.x = 0.36 - 0.08 * u;
        node.position.y = baseY + 0.03;
        node.scale.set(0.62 * (1 + 0.20 * (1 - u)), 0.62 * (1 - 0.26 * (1 - u)), 0.62);
        node.rotation.z = -0.16 * (1 - u);
        return;
      }
      const u = (elapsed - 1.02) / 0.70;
      const back = Math.min(1, u);
      node.position.x = THREE.MathUtils.lerp(0.28, baseX, back);
      node.position.y = baseY + Math.sin(back * Math.PI) * 0.12;
      node.rotation.z = Math.sin(back * Math.PI * 2) * 0.12 * (1 - back);
      return;
    }

    const idle = Math.sin(time * 3.2) * 0.015;
    node.position.y = baseY + idle;
    node.scale.set(0.62 * (1 + idle * 0.7), 0.62 * (1 - idle * 0.5), 0.62);
    if (completed) node.rotation.z = Math.sin(time * 2.1) * 0.025;
  });

  return <group ref={group}><primitive object={model} /></group>;
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
    if (attemptKey > 0 && elapsed >= 0.82 && elapsed < 1.35) {
      const u = (elapsed - 0.82) / 0.53;
      node.rotation.z = Math.sin(u * Math.PI * 3) * 0.035 * (1 - u);
    }
  });

  const wood = '#a66f3f';
  const darkWood = '#81522f';
  return (
    <group ref={group}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.72, 12]} />
        <meshStandardMaterial color={wood} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.86, 0]} castShadow>
        <sphereGeometry args={[0.19, 16, 12]} />
        <meshStandardMaterial color="#bc8450" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.72, 10]} />
        <meshStandardMaterial color={darkWood} roughness={0.88} />
      </mesh>
      <mesh position={[0, -0.02, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.40, 0.10, 18]} />
        <meshStandardMaterial color={darkWood} roughness={0.9} />
      </mesh>
    </group>
  );
}

export function CampPlainTrialStage({ attemptKey, completed }: { attemptKey: number; completed: boolean }) {
  return (
    <div className="camp-plain-trial-stage" aria-label="プレーンスライムが木人に挑戦する">
      <Canvas
        camera={{ fov: 29, near: 0.1, far: 30, position: [0, 1.25, 5.25] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
      >
        <ambientLight intensity={2.25} />
        <directionalLight position={[-3, 5, 4]} intensity={3.5} castShadow />
        <pointLight position={[1.7, 1.4, 2.4]} intensity={0.9} color="#fff2c2" />
        <PlainActor attemptKey={attemptKey} completed={completed} />
        <TrainingDummy attemptKey={attemptKey} />
      </Canvas>
    </div>
  );
}
