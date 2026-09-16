import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BattleRuntime, type BattleSnapshot } from '../game/BattleRuntime';

interface BattleCanvasProps {
  encounterKey: string;
  showBow: boolean;
  swordFusionRank: number;
  swordAsset: string;
  onSnapshot: (snapshot: BattleSnapshot) => void;
}

function BattleRuntimeScene({ swordFusionRank, swordAsset, showBow, onSnapshot }: BattleCanvasProps) {
  const { scene, camera, gl } = useThree();
  const runtimeRef = useRef<BattleRuntime | null>(null);
  const rankRef = useRef(swordFusionRank);
  const snapshotRef = useRef(onSnapshot);

  rankRef.current = swordFusionRank;
  snapshotRef.current = onSnapshot;

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;

    const runtime = new BattleRuntime({
      scene,
      camera,
      baseUrl: import.meta.env.BASE_URL,
      swordAsset,
      showBow,
      onSnapshot: (snapshot) => snapshotRef.current(snapshot),
      getSwordFusionRank: () => rankRef.current,
    });
    runtimeRef.current = runtime;
    void runtime.initialize();

    return () => {
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [camera, gl, scene, swordAsset, showBow]);

  useFrame(({ clock }) => {
    runtimeRef.current?.tick(clock.elapsedTime);
  });

  return null;
}

export function BattleCanvas(props: BattleCanvasProps) {
  return (
    <Canvas
      key={`${props.encounterKey}:${props.swordAsset}:${props.showBow ? 'bow' : 'solo'}`}
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
