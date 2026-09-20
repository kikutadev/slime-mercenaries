import * as THREE from 'three';
import { easeOutCubic, type RogueAttackMotionPose } from './slime-motion';

/** Build the exact arrow mesh used by production battle and gallery playback. */
export function createSlimeArrowMesh(): THREE.Group {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#8a5a2d', roughness: 0.85 });
  const steel = new THREE.MeshStandardMaterial({ color: '#d1dce3', roughness: 0.28, metalness: 0.65 });
  const feather = new THREE.MeshStandardMaterial({ color: '#72bf68', roughness: 0.68 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.38, 6), wood);
  group.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.09, 6), steel);
  tip.position.y = 0.235;
  group.add(tip);
  const fletching = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.065, 0.014), feather);
  fletching.position.y = -0.195;
  fletching.rotation.y = Math.PI / 4;
  group.add(fletching);
  return group;
}


export function createMagicOrbMesh(): THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color: '#aa7cff', transparent: true, opacity: 0.92, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 10), material);
  orb.visible = false;
  orb.renderOrder = 6;
  return orb;
}

export function createGunBulletMesh(): THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({ color: '#ffe7a3' });
  const bullet = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 6), material);
  bullet.visible = false;
  bullet.renderOrder = 6;
  return bullet;
}

export function createMuzzleFlashMesh(): THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color: '#ffd66b', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const flash = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 8), material);
  flash.visible = false;
  flash.renderOrder = 7;
  return flash;
}

export function createGuardPulseVfx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'GuardianGuardPulseVfx';
  group.visible = false;
  group.renderOrder = 7;

  const makeRing = (inner: number, outer: number, color: string, opacity: number) => {
    const material = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, side: THREE.DoubleSide,
      depthWrite: false, depthTest: false, blending: THREE.NormalBlending,
    });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 40), material);
    mesh.rotation.x = -Math.PI / 2;
    group.add(mesh);
    return mesh;
  };
  const inner = makeRing(0.14, 0.20, '#ffd86a', 0);
  inner.name = 'GuardianPulseInner';
  const outer = makeRing(0.24, 0.29, '#5bc9ff', 0);
  outer.name = 'GuardianPulseOuter';

  const spokeMaterial = new THREE.MeshBasicMaterial({
    color: '#c8eeff', transparent: true, opacity: 0,
    depthWrite: false, depthTest: false, blending: THREE.NormalBlending,
  });
  for (let i = 0; i < 4; i += 1) {
    const spoke = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.42), spokeMaterial.clone());
    spoke.name = `GuardianPulseSpoke${i + 1}`;
    spoke.rotation.x = -Math.PI / 2;
    spoke.rotation.z = i * Math.PI * 0.5;
    group.add(spoke);
  }
  return group;
}

export function applyGuardPulseVfx(vfx: THREE.Group | null, pulse: number, progress: number): void {
  if (!vfx) return;
  const visible = pulse > 0.005 && progress < 1;
  vfx.visible = visible;
  if (!visible) return;
  const scale = 0.74 + easeOutCubic(progress) * 2.15;
  vfx.scale.setScalar(scale);
  vfx.rotation.y = progress * 0.42;
  vfx.children.forEach((child, index) => {
    if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.MeshBasicMaterial)) return;
    const base = index === 0 ? 0.95 : index === 1 ? 0.70 : 0.52;
    child.material.opacity = pulse * base;
  });
}

export function createMageCastSigil(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MageCastSigil';
  group.visible = false;
  const colors = ['#8b5cff', '#52d7ff'];
  [0.13, 0.21].forEach((radius, index) => {
    const material = new THREE.MeshBasicMaterial({
      color: colors[index]!, transparent: true, opacity: 0,
      side: THREE.DoubleSide, depthWrite: false, depthTest: false,
      blending: THREE.NormalBlending,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.025, 36), material);
    ring.name = `MageCastRing${index + 1}`;
    group.add(ring);
  });
  for (let i = 0; i < 4; i += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? '#8f5dff' : '#35cfff', transparent: true, opacity: 0,
      depthWrite: false, depthTest: false, blending: THREE.NormalBlending,
    });
    const spark = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 0.11), material);
    spark.position.set(Math.cos(i * Math.PI / 2) * 0.18, Math.sin(i * Math.PI / 2) * 0.18, 0.002);
    spark.rotation.z = i * Math.PI / 2;
    group.add(spark);
  }
  return group;
}

export function applyMageCastSigil(vfx: THREE.Group | null, pulse: number, rotation: number): void {
  if (!vfx) return;
  const visible = pulse > 0.02;
  vfx.visible = visible;
  if (!visible) return;
  vfx.rotation.z = rotation * 0.72;
  const scale = 0.74 + pulse * 0.62;
  vfx.scale.setScalar(scale);
  vfx.children.forEach((child, index) => {
    if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.MeshBasicMaterial)) return;
    child.material.opacity = pulse * (index < 2 ? 0.82 : 0.60);
  });
}

export function createMageOrbVfx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MageOrbVfx';
  group.visible = false;
  const outerMaterial = new THREE.MeshBasicMaterial({
    color: '#5f63ff', transparent: true, opacity: 0.38, depthWrite: false,
  });
  const outer = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 12), outerMaterial);
  outer.name = 'MageOrbOuter';
  group.add(outer);
  const coreMaterial = new THREE.MeshBasicMaterial({ color: '#c8f5ff' });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), coreMaterial);
  core.name = 'MageOrbCore';
  group.add(core);
  return group;
}

export function createRogueSlashArc(): THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color: '#8d55ff', transparent: true, opacity: 0,
    side: THREE.DoubleSide, depthWrite: false, depthTest: false,
    blending: THREE.NormalBlending,
  });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.030, 8, 36, Math.PI * 0.72), material);
  arc.name = 'RogueSlashArc';
  arc.visible = false;
  arc.renderOrder = 7;
  return arc;
}

export function applyRogueSlashVfx(
  arc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null,
  pose: RogueAttackMotionPose,
  cameraQuaternion: THREE.Quaternion,
  position: THREE.Vector3,
): void {
  if (!arc) return;
  const active = pose.hitProgress >= 0 && pose.hitProgress < 1;
  arc.visible = active;
  if (!active) {
    arc.material.opacity = 0;
    return;
  }
  const pulse = Math.sin(pose.hitProgress * Math.PI);
  arc.position.copy(position);
  arc.quaternion.copy(cameraQuaternion);
  arc.rotation.z = pose.comboHit === 0
    ? -0.95 + pose.hitProgress * 1.35
    : 1.05 - pose.hitProgress * 1.45;
  arc.scale.set(0.86 + pulse * 0.55, 0.72 + pulse * 0.30, 1);
  arc.material.color.set(pose.comboHit === 0 ? '#9b72ff' : '#55e0ff');
  arc.material.opacity = pulse * 0.92;
}

export function createGunnerTracerMesh(): THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color: '#ffbd38', transparent: true, opacity: 0.96,
    depthWrite: false, depthTest: false, blending: THREE.NormalBlending,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.20, 0.045), material);
  mesh.name = 'GunnerTracer';
  mesh.visible = false;
  mesh.renderOrder = 8;
  return mesh;
}

/** Build the exact short slash arc used by production Sword attacks. */
export function createSwordSlashArc(): THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color: '#ffd85e',
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.024, 8, 36, Math.PI * 0.62), material);
  arc.visible = false;
  arc.renderOrder = 5;
  return arc;
}

/** Build the exact broad arc used by production Greatsword attacks. */
export function createGreatswordSpinArc(): THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> {
  const material = new THREE.MeshBasicMaterial({
    color: '#fff1a8',
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.70, 0.020, 8, 64), material);
  arc.visible = false;
  arc.rotation.x = Math.PI / 2;
  arc.renderOrder = 5;
  return arc;
}
