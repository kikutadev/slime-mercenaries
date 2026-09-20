import * as THREE from 'three';
import type { EnemyDefeatPose } from './shared';

export function followsAncestor(object: THREE.Object3D, ancestor: THREE.Object3D): boolean {
  let cursor: THREE.Object3D | null = object.parent;
  while (cursor !== null) {
    if (cursor === ancestor) return true;
    cursor = cursor.parent;
  }
  return false;
}

/**
 * Keep the authored face attached to the mass that is actually collapsing.
 *
 * Some older enemy GLBs author FaceRoot as a sibling of BodyRoot. For those
 * models we emulate BodyRoot's non-uniform defeat deformation on both the
 * face position and face scale. Newer models may parent FaceRoot under
 * BodyRoot/PrimaryRoot; those already inherit the deformation and must not
 * be scaled twice.
 */
export function applyEnemyDefeatFacePose(
  faceRoot: THREE.Object3D | null,
  bodyRoot: THREE.Object3D,
  basePosition: THREE.Vector3,
  baseScale: THREE.Vector3,
  pose: Pick<EnemyDefeatPose, 'scaleX' | 'scaleY' | 'scaleZ'>,
): void {
  if (faceRoot === null) return;

  faceRoot.position.copy(basePosition);
  faceRoot.scale.copy(baseScale);

  if (followsAncestor(faceRoot, bodyRoot)) return;

  faceRoot.position.set(
    basePosition.x * pose.scaleX,
    basePosition.y * pose.scaleY,
    basePosition.z * pose.scaleZ,
  );
  faceRoot.scale.set(
    baseScale.x * pose.scaleX,
    baseScale.y * pose.scaleY,
    baseScale.z * pose.scaleZ,
  );
}

export function buildEnemyDefeatEyes(
  model: THREE.Object3D,
): { normalEyes: THREE.Object3D[]; xEyes: THREE.Group[] } {
  model.updateMatrixWorld(true);
  const normalEyes = ['Eye_L', 'Eye_R']
    .map((name) => model.getObjectByName(name))
    .filter((eye): eye is THREE.Object3D => Boolean(eye));
  const xEyes: THREE.Group[] = [];
  const material = new THREE.MeshBasicMaterial({ color: '#261d2b' });

  for (const eye of normalEyes) {
    if (eye.parent === null) continue;

    const footprint = new THREE.Vector3(0.04, 0.02, 0.04);
    if (eye instanceof THREE.Mesh) {
      eye.geometry.computeBoundingBox();
      const bounds = eye.geometry.boundingBox;
      if (bounds !== null) {
        bounds.getSize(footprint);
        footprint.multiply(eye.scale);
      }
    }

    const visibleDiameter = Math.max(footprint.x, footprint.z);
    const barLength = THREE.MathUtils.clamp(visibleDiameter * 1.08, 0.020, 0.074);
    const barThickness = THREE.MathUtils.clamp(barLength * 0.22, 0.006, 0.018);
    const barDepth = THREE.MathUtils.clamp(footprint.y * 0.72, 0.006, 0.018);
    const geometry = new THREE.BoxGeometry(barLength, barThickness, barDepth);

    const group = new THREE.Group();
    group.name = `${eye.name}_DefeatX`;
    group.position.copy(eye.position);
    group.position.z += Math.max(0.006, footprint.y * 0.54);
    for (const rotation of [-Math.PI / 4, Math.PI / 4]) {
      const bar = new THREE.Mesh(geometry, material);
      bar.rotation.z = rotation;
      group.add(bar);
    }
    group.visible = false;
    eye.parent.add(group);
    xEyes.push(group);
  }

  return { normalEyes, xEyes };
}
