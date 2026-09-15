import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getSwordAttackHits } from '../game/fusion';
import { SLIMES, type SlimeId } from '../game/slimes';

type MorphMesh = THREE.Mesh & {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
};

interface PreviewModelProps {
  slimeId: SlimeId;
  fusionRank: number;
  burstKey: number;
}

function setMorph(body: MorphMesh | null, name: string, value: number) {
  if (!body?.morphTargetDictionary || !body.morphTargetInfluences) return;
  const index = body.morphTargetDictionary[name];
  if (index === undefined) return;
  body.morphTargetInfluences[index] = THREE.MathUtils.clamp(value, 0, 1);
}

function PreviewModel({ slimeId, fusionRank, burstKey }: PreviewModelProps) {
  const definition = SLIMES[slimeId];
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${definition.asset}`);
  const model = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const groupRef = useRef<THREE.Group>(null);
  const burstStartedAt = useRef(-Infinity);
  const latestTime = useRef(0);

  const body = useMemo(() => model.getObjectByName('Body') as MorphMesh | null, [model]);
  const equipment = useMemo(
    () => model.getObjectByName(slimeId === 'sword' ? 'WeaponAnchor' : 'BowAnchor'),
    [model, slimeId],
  );
  const bodyBaseScale = useMemo(() => body?.scale.clone() ?? new THREE.Vector3(1, 1, 1), [body]);
  const equipmentBaseQuaternion = useMemo(() => equipment?.quaternion.clone() ?? new THREE.Quaternion(), [equipment]);
  const equipmentBasePosition = useMemo(() => equipment?.position.clone() ?? new THREE.Vector3(), [equipment]);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [model]);

  useEffect(() => {
    burstStartedAt.current = latestTime.current;
  }, [burstKey]);

  useFrame(({ clock }) => {
    latestTime.current = clock.elapsedTime;
    if (!groupRef.current || !body) return;

    body.morphTargetInfluences?.fill(0);
    body.scale.copy(bodyBaseScale);
    equipment?.quaternion.copy(equipmentBaseQuaternion);
    if (equipment) equipment.position.copy(equipmentBasePosition);

    const fusionBurstU = THREE.MathUtils.clamp((clock.elapsedTime - burstStartedAt.current) / 1.05, 0, 1);
    const isFusionBurst = fusionBurstU < 1;
    const cycle = (clock.elapsedTime % 2.8) / 2.8;

    let squash = 0.03 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.4));
    let stretch = 0.015;
    let lean = Math.sin(clock.elapsedTime * 1.2) * 0.045;
    let weaponAngle = lean * 0.2;

    if (isFusionBurst) {
      const compression = Math.sin(Math.min(1, fusionBurstU * 1.6) * Math.PI);
      const release = Math.sin(Math.max(0, (fusionBurstU - 0.35) / 0.65) * Math.PI);
      squash = 0.58 * compression;
      stretch = 0.34 * release;
      lean = Math.sin(fusionBurstU * Math.PI * 4) * 0.08 * (1 - fusionBurstU);
      weaponAngle = Math.sin(fusionBurstU * Math.PI * 3) * 0.42 * (1 - fusionBurstU);
    } else if (cycle > 0.58) {
      const attackU = (cycle - 0.58) / 0.42;
      if (slimeId === 'sword') {
        const hits = getSwordAttackHits(fusionRank);
        const phase = Math.min(hits - 0.001, attackU * hits);
        const local = phase % 1;
        const release = THREE.MathUtils.clamp((local - 0.28) / 0.42, 0, 1);
        weaponAngle = local < 0.28
          ? THREE.MathUtils.lerp(-0.5, -1.0, local / 0.28)
          : local < 0.7
            ? THREE.MathUtils.lerp(-1.0, 0.95, release)
            : THREE.MathUtils.lerp(0.95, 0, (local - 0.7) / 0.3);
        squash = local < 0.28 ? 0.22 * (local / 0.28) : 0.05;
        stretch = local >= 0.28 && local < 0.7 ? 0.28 * Math.sin(release * Math.PI) : 0;
        lean = 0.16 * Math.sin(local * Math.PI);
      } else {
        const tension = Math.sin(Math.min(1, attackU / 0.58) * Math.PI * 0.5);
        const release = THREE.MathUtils.clamp((attackU - 0.58) / 0.18, 0, 1);
        weaponAngle = -0.36 * tension + 0.5 * release;
        squash = 0.09 * tension;
        stretch = 0.12 * release;
        lean = -0.05 * tension + 0.08 * release;
      }
    }

    setMorph(body, 'Squash', squash);
    setMorph(body, 'Stretch', stretch);
    setMorph(body, lean < 0 ? 'LeanLeft' : 'LeanRight', Math.abs(lean));
    setMorph(body, lean < 0 ? 'WobbleLeft' : 'WobbleRight', Math.abs(lean) * 0.7);

    if (equipment) {
      const axis = slimeId === 'sword' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
      tempQuaternion.setFromAxisAngle(axis, weaponAngle);
      equipment.quaternion.copy(equipmentBaseQuaternion).multiply(tempQuaternion);
    }

    groupRef.current.rotation.y = -0.28 + Math.sin(clock.elapsedTime * 0.55) * 0.045;
  });

  return (
    <group ref={groupRef} position={[0, -0.45, 0]} scale={0.54}>
      <primitive object={model} />
    </group>
  );
}

interface SlimePreviewProps {
  slimeId: SlimeId;
  fusionRank: number;
  burstKey: number;
}

export function SlimePreview({ slimeId, fusionRank, burstKey }: SlimePreviewProps) {
  return (
    <div className="slime-preview" aria-label={`${SLIMES[slimeId].name} preview`}>
      <Canvas
        camera={{ fov: 28, near: 0.1, far: 30, position: [2.6, 2.05, 5.8] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
      >
        <ambientLight intensity={2.3} />
        <directionalLight position={[-3, 5, 4]} intensity={4.2} castShadow />
        <pointLight position={[2.5, 1.8, 2]} intensity={1.4} color={SLIMES[slimeId].accent} />
        <PreviewModel slimeId={slimeId} fusionRank={fusionRank} burstKey={burstKey} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]} receiveShadow>
          <circleGeometry args={[1.15, 48]} />
          <meshStandardMaterial color="#dff0cf" roughness={1} transparent opacity={0.72} />
        </mesh>
      </Canvas>
    </div>
  );
}
