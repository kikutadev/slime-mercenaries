import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { WeaponRarity } from '../domain';

export type ForgeVisualPhase = 'idle' | 'charging' | 'impact' | 'reveal';

interface ForgeStageProps {
  phase: ForgeVisualPhase;
  sequenceKey: number;
  weaponAsset: string | null;
  weaponRarity: WeaponRarity | null;
}

function ForgeEnvironment({ phase, sequenceKey }: Pick<ForgeStageProps, 'phase' | 'sequenceKey'>) {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}assets/environments/forge.glb`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const hammer = useMemo(() => model.getObjectByName('ForgeHammerPivot'), [model]);
  const core = useMemo(() => model.getObjectByName('ForgeCore'), [model]);
  const runeOuter = useMemo(() => model.getObjectByName('ForgeRuneOuter'), [model]);
  const runeInner = useMemo(() => model.getObjectByName('ForgeRuneInner'), [model]);
  const phaseStartedAt = useRef(0);
  const latestTime = useRef(0);
  const { camera, scene } = useThree();

  useEffect(() => {
    phaseStartedAt.current = latestTime.current;
  }, [phase, sequenceKey]);

  useEffect(() => {
    // The asset is authored in runtime X/Y/Z coordinates inside Blender and then exported
    // through Blender's Z-up -> glTF Y-up conversion. This one root rotation restores the
    // authored runtime frame while preserving every local machine pivot.
    model.rotation.x = Math.PI / 2;
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    scene.fog = new THREE.Fog('#172c31', 8.5, 17);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, 2.75, 7.25);
      camera.fov = 37;
      camera.near = 0.1;
      camera.far = 30;
      camera.updateProjectionMatrix();
      camera.lookAt(0, 1.12, -0.30);
    }
  }, [camera, model, scene]);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    latestTime.current = now;
    const elapsed = Math.max(0, now - phaseStartedAt.current);

    if (runeOuter !== undefined) runeOuter.rotation.z = now * 0.50;
    if (runeInner !== undefined) runeInner.rotation.z = -now * 0.72;

    if (core !== undefined) {
      const active = phase === 'charging' || phase === 'impact' || phase === 'reveal';
      const pulse = active ? 1 + Math.sin(now * 10) * 0.13 : 1 + Math.sin(now * 2.2) * 0.035;
      core.scale.setScalar(pulse);
    }

    if (hammer !== undefined) {
      if (phase === 'impact') {
        const strikeU = THREE.MathUtils.clamp(elapsed / 0.22, 0, 1);
        const returnU = THREE.MathUtils.clamp((elapsed - 0.22) / 0.28, 0, 1);
        const down = strikeU < 1
          ? THREE.MathUtils.smoothstep(strikeU, 0, 1)
          : 1 - THREE.MathUtils.smoothstep(returnU, 0, 1);
        hammer.rotation.x = -0.72 * down;
      } else {
        hammer.rotation.x *= 0.78;
      }
    }
  });

  return <primitive object={model} />;
}

function ForgeKey({ phase, sequenceKey }: Pick<ForgeStageProps, 'phase' | 'sequenceKey'>) {
  const mesh = useRef<THREE.Mesh>(null);
  const latestTime = useRef(0);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = latestTime.current;
  }, [phase, sequenceKey]);

  useFrame(({ clock }) => {
    latestTime.current = clock.elapsedTime;
    const target = mesh.current;
    if (target === null) return;

    if (phase !== 'charging') {
      target.visible = false;
      return;
    }

    target.visible = true;
    const u = THREE.MathUtils.clamp((clock.elapsedTime - startedAt.current) / 0.34, 0, 1);
    const eased = 1 - Math.pow(1 - u, 3);
    target.position.set(
      1.45 * (1 - eased),
      1.20 - eased * 0.68 + Math.sin(u * Math.PI) * 0.24,
      1.85 - eased * 0.75,
    );
    target.rotation.y = u * Math.PI * 1.5;
    target.rotation.z = Math.PI / 4;
    target.scale.setScalar(0.19 * (1 - 0.32 * eased));
  });

  return (
    <mesh ref={mesh}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#76d9df"
        emissive="#3da9b1"
        emissiveIntensity={1.8}
        roughness={0.24}
        metalness={0.08}
      />
    </mesh>
  );
}

function ForgeSparks({ phase, sequenceKey }: Pick<ForgeStageProps, 'phase' | 'sequenceKey'>) {
  const group = useRef<THREE.Group>(null);
  const latestTime = useRef(0);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = latestTime.current;
  }, [phase, sequenceKey]);

  useFrame(({ clock }) => {
    latestTime.current = clock.elapsedTime;
    const root = group.current;
    if (root === null) return;
    const elapsed = clock.elapsedTime - startedAt.current;
    root.visible = phase === 'impact' && elapsed < 0.52;
    if (!root.visible) return;

    root.children.forEach((child, index) => {
      const angle = (Math.PI * 2 * index) / root.children.length + 0.24;
      const u = THREE.MathUtils.clamp(elapsed / 0.48, 0, 1);
      const distance = 0.20 + u * (0.72 + (index % 3) * 0.12);
      child.position.set(
        Math.cos(angle) * distance,
        1.08 + Math.sin(angle) * distance * 0.42 + Math.sin(u * Math.PI) * 0.44,
        -0.35 + Math.sin(angle * 1.7) * distance * 0.36,
      );
      child.scale.setScalar((1 - u) * 0.075);
    });
  });

  return (
    <group ref={group}>
      {Array.from({ length: 10 }, (_, index) => (
        <mesh key={index}>
          <sphereGeometry args={[1, 7, 5]} />
          <meshBasicMaterial color={index % 3 === 0 ? '#fff1a6' : '#ffad35'} />
        </mesh>
      ))}
    </group>
  );
}

function WeaponReveal({ asset, rarity, sequenceKey }: { asset: string; rarity: WeaponRarity; sequenceKey: number }) {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${asset}`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const group = useRef<THREE.Group>(null);
  const latestTime = useRef(0);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = latestTime.current;
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [model, sequenceKey]);

  useFrame(({ clock }) => {
    latestTime.current = clock.elapsedTime;
    const root = group.current;
    if (root === null) return;
    const elapsed = Math.max(0, clock.elapsedTime - startedAt.current);
    const u = THREE.MathUtils.clamp(elapsed / 0.38, 0, 1);
    const overshoot = 1 + Math.sin(u * Math.PI) * 0.10;
    const baseScale = rarity === 'mythic' ? 0.82 : rarity === 'rare' ? 0.76 : 0.70;
    root.scale.setScalar(baseScale * u * overshoot);
    root.position.set(0, 1.62 + Math.sin(clock.elapsedTime * 2.0) * 0.06, 0.55);
    root.rotation.set(-0.10, clock.elapsedTime * 0.58, 0.06);
  });

  return <group ref={group}><primitive object={model} /></group>;
}

export function ForgeStage({ phase, sequenceKey, weaponAsset, weaponRarity }: ForgeStageProps) {
  const glow = weaponRarity === 'mythic' ? '#c9a0ff' : weaponRarity === 'rare' ? '#80d7ef' : '#ffc65a';
  return (
    <div className="forge-stage" aria-hidden="true">
      <Canvas
        camera={{ fov: 37, near: 0.1, far: 30, position: [0, 2.75, 7.25] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        shadows
      >
        <color attach="background" args={['#172c31']} />
        <hemisphereLight args={['#badde0', '#172526', 1.35]} />
        <directionalLight position={[-4, 7, 5]} intensity={2.1} color="#d8eff0" castShadow />
        <pointLight position={[0, 1.5, 2.2]} intensity={phase === 'idle' ? 1.4 : 3.2} color="#ffac3d" />
        {phase === 'reveal' && <pointLight position={[0, 2.2, 2.0]} intensity={3.2} color={glow} />}
        <ForgeEnvironment phase={phase} sequenceKey={sequenceKey} />
        <ForgeKey phase={phase} sequenceKey={sequenceKey} />
        <ForgeSparks phase={phase} sequenceKey={sequenceKey} />
        {phase === 'reveal' && weaponAsset !== null && weaponRarity !== null && (
          <WeaponReveal asset={weaponAsset} rarity={weaponRarity} sequenceKey={sequenceKey} />
        )}
      </Canvas>
    </div>
  );
}
