import { useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getCampLifePose } from '../game/camp-life-motion';
import type { CampLifeResidentSpec } from '../game/camp-life-residents';
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

interface ResidentParts {
  body: MorphMesh | null;
  bodyBaseScale: THREE.Vector3;
  eyes: readonly FacePart[];
  mouth: FacePart | null;
  yawnMouth: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial> | null;
  equipment: THREE.Object3D | null;
  equipmentBaseQuaternion: THREE.Quaternion;
}

interface CampLifeResidentProps {
  resident: CampLifeResidentSpec;
  slotIndex: number;
  lifeOriginRef: MutableRefObject<number | null>;
}

const AMBIENT_SLIME_SCALE = 0.44;

function setMorph(body: MorphMesh | null, name: string, value: number): void {
  if (!body?.morphTargetDictionary || !body.morphTargetInfluences) return;
  const index = body.morphTargetDictionary[name];
  if (index === undefined) return;
  body.morphTargetInfluences[index] = THREE.MathUtils.clamp(value, 0, 1);
}

function facePart(model: THREE.Object3D, name: string): FacePart | null {
  const object = model.getObjectByName(name);
  return object === undefined ? null : { object, baseScale: object.scale.clone() };
}

function createYawnMouth(model: THREE.Object3D): THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial> | null {
  const mouth = model.getObjectByName('Mouth');
  if (mouth === undefined || mouth.parent === null) return null;
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 20),
    new THREE.MeshBasicMaterial({ color: '#251a2a', depthWrite: false }),
  );
  mesh.name = 'CampYawnMouth';
  mesh.position.copy(mouth.position);
  mesh.position.z += 0.035;
  mesh.visible = false;
  mesh.renderOrder = 5;
  mouth.parent.add(mesh);
  return mesh;
}

function resetParts(parts: ResidentParts): void {
  parts.body?.morphTargetInfluences?.fill(0);
  parts.body?.scale.copy(parts.bodyBaseScale);
  for (const eye of parts.eyes) eye.object.scale.copy(eye.baseScale);
  if (parts.mouth !== null) parts.mouth.object.scale.copy(parts.mouth.baseScale);
  parts.equipment?.quaternion.copy(parts.equipmentBaseQuaternion);
}

function AmbientResident({ resident, slotIndex, lifeOriginRef }: CampLifeResidentProps) {
  const gltf = useLoader(GLTFLoader, `${import.meta.env.BASE_URL}${resident.presentation.asset}`);
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true);
    applySlimeMutationVisuals(clone, resident.presentation.mutationId);
    return clone;
  }, [gltf.scene, resident.presentation.mutationId]);

  const parts = useMemo<ResidentParts>(() => {
    const body = model.getObjectByName('Body') as MorphMesh | null;
    const eyes = ['Eye_L', 'Eye_R']
      .map((name) => facePart(model, name))
      .filter((part): part is FacePart => part !== null);
    const mouth = facePart(model, 'Mouth');
    const yawnMouth = createYawnMouth(model);
    const equipment = resident.presentation.battle.equipmentAnchorName === null
      ? null
      : model.getObjectByName(resident.presentation.battle.equipmentAnchorName) ?? null;
    return {
      body,
      bodyBaseScale: body?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
      eyes,
      mouth,
      yawnMouth,
      equipment,
      equipmentBaseQuaternion: equipment?.quaternion.clone() ?? new THREE.Quaternion(),
    };
  }, [model, resident.presentation.battle.equipmentAnchorName]);

  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = false;
      }
    });
    return () => {
      if (parts.yawnMouth !== null) {
        parts.yawnMouth.removeFromParent();
        parts.yawnMouth.geometry.dispose();
        parts.yawnMouth.material.dispose();
      }
      disposeSlimeMutationVisuals(model);
    };
  }, [model, parts]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (group === null) return;
    if (lifeOriginRef.current === null) lifeOriginRef.current = clock.elapsedTime;
    const pose = getCampLifePose(clock.elapsedTime - lifeOriginRef.current, slotIndex, resident.presentation.id);

    resetParts(parts);
    group.position.set(pose.x, pose.y, pose.z);
    group.rotation.set(0, pose.yaw, pose.roll);
    group.scale.setScalar(AMBIENT_SLIME_SCALE);

    setMorph(parts.body, 'Squash', pose.bodySquash);
    setMorph(parts.body, 'Stretch', pose.bodyStretch);
    setMorph(parts.body, pose.lean < 0 ? 'LeanLeft' : 'LeanRight', Math.abs(pose.lean));
    setMorph(parts.body, pose.wobble < 0 ? 'WobbleLeft' : 'WobbleRight', Math.abs(pose.wobble));

    for (const eye of parts.eyes) {
      eye.object.scale.set(
        eye.baseScale.x,
        eye.baseScale.y * THREE.MathUtils.clamp(pose.eyeOpen, 0.12, 1),
        eye.baseScale.z,
      );
    }
    if (parts.mouth !== null) {
      const yawning = pose.activity === 'yawn' && pose.mouthOpen > 1.5;
      parts.mouth.object.visible = !yawning;
      parts.mouth.object.scale.set(
        parts.mouth.baseScale.x * pose.mouthWidth,
        parts.mouth.baseScale.y * pose.mouthOpen,
        parts.mouth.baseScale.z,
      );
      if (parts.yawnMouth !== null) {
        const intensity = THREE.MathUtils.clamp((pose.mouthOpen - 1) / 5, 0, 1);
        parts.yawnMouth.visible = yawning;
        parts.yawnMouth.scale.set(
          0.19 + intensity * 0.075,
          0.24 + intensity * 0.13,
          1,
        );
      }
    }
    if (parts.equipment !== null && pose.equipmentAngle !== 0) {
      parts.equipment.rotateZ(pose.equipmentAngle);
    }
  });

  return (
    <group ref={groupRef} name={`CampLifeResident:${resident.instanceId}`}>
      <primitive object={model} />
    </group>
  );
}

export function CampLifePopulation({
  residents,
}: {
  residents: readonly CampLifeResidentSpec[];
}) {
  const lifeOriginRef = useRef<number | null>(null);
  return (
    <group name="CampLifePopulation">
      {residents.slice(0, 4).map((resident, slotIndex) => (
        <AmbientResident
          key={resident.instanceId}
          resident={resident}
          slotIndex={slotIndex}
          lifeOriginRef={lifeOriginRef}
        />
      ))}
    </group>
  );
}
