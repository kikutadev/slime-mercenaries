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
}

export interface EnemyRigRestPose {
  primaryRotation: THREE.Euler | null;
  secondaryRotation: THREE.Euler | null;
  headRotation: THREE.Euler | null;
  tailRotation: THREE.Euler | null;
  earLRotation: THREE.Euler | null;
  earRRotation: THREE.Euler | null;
  shellScale: THREE.Vector3 | null;
  openScale: THREE.Vector3 | null;
}

function first(root: THREE.Object3D, names: readonly string[]): THREE.Object3D | null {
  for (const name of names) {
    const part = root.getObjectByName(name);
    if (part) return part;
  }
  return null;
}

export function resolveEnemyRigParts(root: THREE.Object3D): EnemyRigParts {
  return {
    primary: first(root, ['LeafRoot', 'StemRoot', 'HeadRoot']),
    secondary: first(root, ['LeafSecondary', 'PetalRoot']),
    head: first(root, ['HeadRoot']),
    tail: first(root, ['TailRoot']),
    earL: first(root, ['Ear_L']),
    earR: first(root, ['Ear_R']),
    shell: first(root, ['ShellRoot']),
    openRoot: first(root, ['PetalRoot', 'PuffRoot']),
  };
}

export function captureEnemyRigRestPose(parts: EnemyRigParts): EnemyRigRestPose {
  return {
    primaryRotation: parts.primary?.rotation.clone() ?? null,
    secondaryRotation: parts.secondary?.rotation.clone() ?? null,
    headRotation: parts.head?.rotation.clone() ?? null,
    tailRotation: parts.tail?.rotation.clone() ?? null,
    earLRotation: parts.earL?.rotation.clone() ?? null,
    earRRotation: parts.earR?.rotation.clone() ?? null,
    shellScale: parts.shell?.scale.clone() ?? null,
    openScale: parts.openRoot?.scale.clone() ?? null,
  };
}

function restoreRotation(part: THREE.Object3D | null, rest: THREE.Euler | null): void {
  if (part && rest) part.rotation.copy(rest);
}

export function resetEnemySecondaryPose(parts: EnemyRigParts, rest: EnemyRigRestPose): void {
  restoreRotation(parts.primary, rest.primaryRotation);
  restoreRotation(parts.secondary, rest.secondaryRotation);
  restoreRotation(parts.head, rest.headRotation);
  restoreRotation(parts.tail, rest.tailRotation);
  restoreRotation(parts.earL, rest.earLRotation);
  restoreRotation(parts.earR, rest.earRRotation);
  if (parts.shell && rest.shellScale) parts.shell.scale.copy(rest.shellScale);
  if (parts.openRoot && rest.openScale) parts.openRoot.scale.copy(rest.openScale);
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
  if (parts.secondary && rest.secondaryRotation) {
    parts.secondary.rotation.x = rest.secondaryRotation.x + (pose.secondaryBend ?? 0);
  }
  if (parts.head && rest.headRotation) {
    parts.head.rotation.x = rest.headRotation.x + (pose.headNod ?? 0);
  }
  if (parts.tail && rest.tailRotation) {
    parts.tail.rotation.z = rest.tailRotation.z + (pose.wag ?? 0);
  }
  const earDrop = pose.earDrop ?? 0;
  if (parts.earL && rest.earLRotation) parts.earL.rotation.x = rest.earLRotation.x + earDrop;
  if (parts.earR && rest.earRRotation) parts.earR.rotation.x = rest.earRRotation.x + earDrop;

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
    parts.openRoot.scale.set(rest.openScale.x * radial, rest.openScale.y * radial, rest.openScale.z * (1 + open * 0.08));
  }
}
