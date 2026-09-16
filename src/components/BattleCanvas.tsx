import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BattleSceneModel } from '../application/selectors/battle-scene';
import { BattleRuntime, type BattleSnapshot } from '../game/BattleRuntime';

interface BattleCanvasProps {
  model: BattleSceneModel;
  onSnapshot: (snapshot: BattleSnapshot) => void;
}

function BattleRuntimeScene({ model, onSnapshot }: BattleCanvasProps) {
  const { scene, camera, gl } = useThree();
  const runtimeRef = useRef<BattleRuntime | null>(null);
  const snapshotRef = useRef(onSnapshot);
  snapshotRef.current = onSnapshot;

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;

    const sword = model.allies.find((ally) => ally.slimeId === 'sword') ?? null;
    const bow = model.allies.find((ally) => ally.slimeId === 'bow') ?? null;
    const runtime = new BattleRuntime({
      scene,
      camera,
      baseUrl: import.meta.env.BASE_URL,
      swordAsset: sword?.asset ?? 'assets/sword-slime.glb',
      bowAsset: bow?.asset ?? 'assets/archer-slime.glb',
      showSword: sword !== null,
      showBow: bow !== null,
      onSnapshot: (snapshot) => snapshotRef.current(snapshot),
      getSwordFusionRank: () => sword?.fusionRank ?? 1,
    });
    runtimeRef.current = runtime;
    void runtime.initialize();

    return () => {
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [camera, gl, scene, model.visualKey]);

  useFrame(({ clock }) => {
    runtimeRef.current?.tick(clock.elapsedTime);
  });

  return null;
}

export function BattleCanvas(props: BattleCanvasProps) {
  return (
    <Canvas
      key={`${props.model.encounterKey}:${props.model.visualKey}`}
      className="battle-canvas"
      camera={{ fov: 31, near: 0.1, far: 50, position: [2.8, 5.35, 8.9] }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      shadows
    >
      <BattleRuntimeScene {...props} />
    </Canvas>
  );
}
