import * as THREE from 'three';
import type { EnemySecondaryPose } from './shared';

export interface EnemyRigParts {
  primary: THREE.Object3D | null;
  secondary: THREE.Object3D | null;
  head: THREE.Object3D | null;
  tail: THREE.Object3D | null;
  earL: THREE.Object3D | null;
  earR: THREE.Object3D | null;
  shell: THREE.Object3D | null;
  openRoot: THREE.Object3D | null;
  inflateRoot: THREE.Object3D | null;
  glowMaterials: THREE.MeshStandardMaterial[];
}

export interface EnemyRigRestPose {
  primaryRotation: THREE.Euler | null;
  primaryPosition: THREE.Vector3 | null;
  secondaryRotation: THREE.Euler | null;
  secondaryPosition: THREE.Vector3 | null;
  headRotation: THREE.Euler | null;
  headPosition: THREE.Vector3 | null;
  tailRotation: THREE.Euler | null;
  earLRotation: THREE.Euler | null;
  earRRotation: THREE.Euler | null;
  shellRotation: THREE.Euler | null;
  shellScale: THREE.Vector3 | null;
  openScale: THREE.Vector3 | null;
  inflateScale: THREE.Vector3 | null;
  glowEmissive: THREE.Color[];
  glowIntensity: number[];
}

function first(root: THREE.Object3D, names: readonly string[]): THREE.Object3D | null {
  for (const name of names) {
    const part = root.getObjectByName(name);
    if (part) return part;
  }
  return null;
}

function emissiveMaterials(root: THREE.Object3D | null): THREE.MeshStandardMaterial[] {
  if (!root) return [];
  const materials: THREE.MeshStandardMaterial[] = [];
  const seen = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) {
      if (!(material instanceof THREE.MeshStandardMaterial) || seen.has(material)) continue;
      seen.add(material);
      materials.push(material);
    }
  });
  return materials;
}

export function resolveEnemyRigParts(root: THREE.Object3D): EnemyRigParts {
  const inflateRoot = first(root, ['ThroatRoot', 'BubbleShellRoot', 'GlowRoot']);
  return {
    primary: first(root, ['PrimaryRoot', 'LeafRoot', 'StemRoot', 'HeadRoot']),
    secondary: first(root, ['SecondaryRoot', 'LeafSecondary', 'PetalRoot']),
    head: first(root, ['HeadRoot']),
    tail: first(root, ['TailRoot']),
    earL: first(root, ['Ear_L']),
    earR: first(root, ['Ear_R']),
    shell: first(root, ['ShellRoot']),
    openRoot: first(root, ['WingPairRoot', 'RockClusterRoot', 'LeafPairRoot', 'PadRoot', 'PetalRoot', 'PuffRoot', 'SporePouchRoot']),
    inflateRoot,
    glowMaterials: emissiveMaterials(inflateRoot),
  };
}

export function captureEnemyRigRestPose(parts: EnemyRigParts): EnemyRigRestPose {
  return {
    primaryRotation: parts.primary?.rotation.clone() ?? null,
    primaryPosition: parts.primary?.position.clone() ?? null,
    secondaryRotation: parts.secondary?.rotation.clone() ?? null,
    secondaryPosition: parts.secondary?.position.clone() ?? null,
    headRotation: parts.head?.rotation.clone() ?? null,
    headPosition: parts.head?.position.clone() ?? null,
    tailRotation: parts.tail?.rotation.clone() ?? null,
    earLRotation: parts.earL?.rotation.clone() ?? null,
    earRRotation: parts.earR?.rotation.clone() ?? null,
    shellRotation: parts.shell?.rotation.clone() ?? null,
    shellScale: parts.shell?.scale.clone() ?? null,
    openScale: parts.openRoot?.scale.clone() ?? null,
    inflateScale: parts.inflateRoot?.scale.clone() ?? null,
    glowEmissive: parts.glowMaterials.map((material) => material.emissive.clone()),
    glowIntensity: parts.glowMaterials.map((material) => material.emissiveIntensity),
  };
}

function restoreRotation(part: THREE.Object3D | null, rest: THREE.Euler | null): void {
  if (part && rest) part.rotation.copy(rest);
}

export function resetEnemySecondaryPose(parts: EnemyRigParts, rest: EnemyRigRestPose): void {
  restoreRotation(parts.primary, rest.primaryRotation);
  if (parts.primary && rest.primaryPosition) parts.primary.position.copy(rest.primaryPosition);
  restoreRotation(parts.secondary, rest.secondaryRotation);
  if (parts.secondary && rest.secondaryPosition) parts.secondary.position.copy(rest.secondaryPosition);
  restoreRotation(parts.head, rest.headRotation);
  if (parts.head && rest.headPosition) parts.head.position.copy(rest.headPosition);
  restoreRotation(parts.tail, rest.tailRotation);
  restoreRotation(parts.earL, rest.earLRotation);
  restoreRotation(parts.earR, rest.earRRotation);
  restoreRotation(parts.shell, rest.shellRotation);
  if (parts.shell && rest.shellScale) parts.shell.scale.copy(rest.shellScale);
  if (parts.openRoot && rest.openScale) parts.openRoot.scale.copy(rest.openScale);
  if (parts.inflateRoot && rest.inflateScale) parts.inflateRoot.scale.copy(rest.inflateScale);
  parts.glowMaterials.forEach((material, index) => {
    const color = rest.glowEmissive[index];
    if (color) material.emissive.copy(color);
    material.emissiveIntensity = rest.glowIntensity[index] ?? material.emissiveIntensity;
  });
}

/** Apply bounded semantic secondary channels shared by game and gallery. */
export function applyEnemySecondaryPose(
  parts: EnemyRigParts,
  rest: EnemyRigRestPose,
  pose: EnemySecondaryPose | undefined,
): void {
  resetEnemySecondaryPose(parts, rest);
  if (!pose) return;

  if (parts.primary && rest.primaryRotation) {
    parts.primary.rotation.x = rest.primaryRotation.x + (pose.primaryBend ?? 0);
    parts.primary.rotation.z = rest.primaryRotation.z + (pose.twist ?? 0);
  }
  if (parts.primary && rest.primaryPosition) {
    parts.primary.position.z = rest.primaryPosition.z + Math.max(-0.28, Math.min(0.22, pose.primaryLift ?? 0));
  }
  if (parts.secondary && rest.secondaryRotation) {
    parts.secondary.rotation.x = rest.secondaryRotation.x + (pose.secondaryBend ?? 0);
    parts.secondary.rotation.z = rest.secondaryRotation.z + (pose.secondaryTwist ?? 0);
  }
  if (parts.secondary && rest.secondaryPosition) {
    parts.secondary.position.z = rest.secondaryPosition.z + Math.max(-0.28, Math.min(0.22, pose.secondaryLift ?? 0));
  }
  if (parts.head && rest.headRotation) {
    parts.head.rotation.x = rest.headRotation.x + (pose.headNod ?? 0);
  }
  if (parts.head && rest.headPosition) {
    parts.head.position.y = rest.headPosition.y + Math.max(-0.12, Math.min(0.18, pose.headRetract ?? 0));
  }
  if (parts.tail && rest.tailRotation) {
    parts.tail.rotation.z = rest.tailRotation.z + (pose.wag ?? 0);
  }
  const earDrop = pose.earDrop ?? 0;
  if (parts.earL && rest.earLRotation) parts.earL.rotation.x = rest.earLRotation.x + earDrop;
  if (parts.earR && rest.earRRotation) parts.earR.rotation.x = rest.earRRotation.x + earDrop;

  if (parts.shell && rest.shellRotation) {
    parts.shell.rotation.x = rest.shellRotation.x + (pose.shellRoll ?? 0);
  }
  if (parts.shell && rest.shellScale) {
    const curl = Math.max(-0.3, Math.min(0.3, pose.shellCurl ?? 0));
    parts.shell.scale.set(
      rest.shellScale.x * (1 + curl * 0.25),
      rest.shellScale.y * (1 + curl * 0.25),
      rest.shellScale.z * (1 - curl * 0.18),
    );
  }
  if (parts.openRoot && rest.openScale) {
    const open = Math.max(-0.5, Math.min(0.5, pose.open ?? 0));
    const radial = 1 + open * 0.16;
    parts.openRoot.scale.set(
      rest.openScale.x * radial,
      rest.openScale.y * radial,
      rest.openScale.z * (1 + open * 0.08),
    );
  }
  if (parts.inflateRoot && rest.inflateScale) {
    const inflate = Math.max(-0.45, Math.min(1.10, pose.inflate ?? 0));
    parts.inflateRoot.scale.set(
      rest.inflateScale.x * (1 + inflate),
      rest.inflateScale.y * (1 + inflate * 0.72),
      rest.inflateScale.z * (1 + inflate),
    );
  }

  const glow = Math.max(-1, Math.min(2.5, pose.glow ?? 0));
  const heat = Math.max(0, Math.min(1, pose.glowHeat ?? 0));
  const hot = new THREE.Color(1.0, 0.58, 0.08);
  parts.glowMaterials.forEach((material, index) => {
    const baseColor = rest.glowEmissive[index];
    if (baseColor) material.emissive.copy(baseColor).lerp(hot, heat);
    material.emissiveIntensity = Math.max(0, (rest.glowIntensity[index] ?? 1) * (1 + glow * 2.2));
  });
}