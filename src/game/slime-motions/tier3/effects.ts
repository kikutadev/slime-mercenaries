import * as THREE from 'three';

import type {
  AssassinSignatureMotionPose,
  NinjaSignatureMotionPose,
} from './rogue';
import type {
  CannoneerSignatureMotionPose,
  EngineerSignatureMotionPose,
} from './gun';

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const TEMP_DIRECTION = new THREE.Vector3();
const TEMP_POSITION = new THREE.Vector3();

function material(color: string): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

function makeBillboard(name: string, width: number, height: number, color: string): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material(color));
  mesh.name = name;
  mesh.visible = false;
  return mesh;
}

function makeBeam(name: string, radius: number, color: string): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 7), material(color));
  mesh.name = name;
  mesh.visible = false;
  return mesh;
}

function placeBeam(
  mesh: THREE.Mesh | undefined,
  start: THREE.Vector3,
  end: THREE.Vector3,
  opacity: number,
  widthScale = 1,
): void {
  if (!mesh || !(mesh.material instanceof THREE.MeshBasicMaterial)) return;
  const clampedOpacity = THREE.MathUtils.clamp(opacity, 0, 1);
  mesh.visible = clampedOpacity > 0.005;
  mesh.material.opacity = clampedOpacity;
  if (!mesh.visible) return;

  TEMP_DIRECTION.copy(end).sub(start);
  const distance = TEMP_DIRECTION.length();
  if (distance < 0.00001) {
    mesh.visible = false;
    return;
  }
  TEMP_DIRECTION.multiplyScalar(1 / distance);
  mesh.position.copy(start).lerp(end, 0.5);
  mesh.quaternion.setFromUnitVectors(Y_AXIS, TEMP_DIRECTION);
  mesh.scale.set(widthScale, distance, widthScale);
}

function setBillboard(
  mesh: THREE.Mesh | undefined,
  position: THREE.Vector3,
  cameraQuaternion: THREE.Quaternion,
  opacity: number,
  scaleX: number,
  scaleY: number,
  rotationZ = 0,
): void {
  if (!mesh || !(mesh.material instanceof THREE.MeshBasicMaterial)) return;
  const clampedOpacity = THREE.MathUtils.clamp(opacity, 0, 1);
  mesh.visible = clampedOpacity > 0.005;
  mesh.material.opacity = clampedOpacity;
  if (!mesh.visible) return;
  mesh.position.copy(position);
  mesh.quaternion.copy(cameraQuaternion);
  mesh.rotateZ(rotationZ);
  mesh.scale.set(scaleX, scaleY, 1);
}

function setObjectOpacity(root: THREE.Object3D | undefined, opacity: number): void {
  if (!root) return;
  root.visible = opacity > 0.005;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((candidate) => {
      if (!(candidate instanceof THREE.MeshBasicMaterial)) return;
      candidate.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
    });
  });
}

export function createNinjaSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'NinjaSignatureVfx';
  group.visible = false;

  group.add(makeBillboard('NinjaVanishSmoke', 0.42, 0.30, '#9b8ac7'));
  group.add(makeBillboard('NinjaReturnSmoke', 0.38, 0.28, '#b7a9df'));

  for (let i = 0; i < 4; i += 1) {
    const ghost = makeBillboard(`NinjaAfterimage${i}`, 0.20, 0.34, i % 2 === 0 ? '#b9a8ff' : '#7d6cc7');
    group.add(ghost);
  }
  for (let i = 0; i < 5; i += 1) {
    group.add(makeBeam(`NinjaSpeedLine${i}`, 0.008 + i * 0.0015, '#d9d1ff'));
  }
  for (let i = 0; i < 4; i += 1) {
    group.add(makeBillboard(`NinjaDelayedSlash${i}`, 0.68, 0.022, i % 2 === 0 ? '#f0ecff' : '#b68cff'));
  }
  return group;
}

export function applyNinjaSignatureVfx(
  group: THREE.Group | null,
  pose: NinjaSignatureMotionPose,
  cameraQuaternion: THREE.Quaternion,
  origin: THREE.Vector3,
  target: THREE.Vector3,
): void {
  if (!group) return;
  const active = pose.vfx.vanishSmoke > 0.005
    || pose.vfx.returnSmoke > 0.005
    || pose.vfx.afterimage > 0.005
    || pose.vfx.speedLines > 0.005
    || pose.vfx.delayedSlashBurst > 0.005;
  group.visible = active;
  if (!active) return;

  setBillboard(
    group.getObjectByName('NinjaVanishSmoke') as THREE.Mesh | undefined,
    origin,
    cameraQuaternion,
    pose.vfx.vanishSmoke * 0.62,
    pose.vfx.vanishSmokeScale,
    pose.vfx.vanishSmokeScale * 0.82,
  );
  setBillboard(
    group.getObjectByName('NinjaReturnSmoke') as THREE.Mesh | undefined,
    target,
    cameraQuaternion,
    pose.vfx.returnSmoke * 0.68,
    0.88 + pose.vfx.returnSmoke * 1.12,
    0.76 + pose.vfx.returnSmoke * 0.90,
  );

  for (let i = 0; i < 4; i += 1) {
    const ghost = group.getObjectByName(`NinjaAfterimage${i}`) as THREE.Mesh | undefined;
    if (!ghost) continue;
    const trail = THREE.MathUtils.clamp(pose.dashProgress - i * 0.085, 0, 1);
    TEMP_POSITION.copy(origin).lerp(target, trail);
    TEMP_POSITION.y += 0.22 + (i % 2) * 0.025;
    setBillboard(
      ghost,
      TEMP_POSITION,
      cameraQuaternion,
      pose.vfx.afterimage * (0.72 - i * 0.12),
      0.78 + pose.vfx.afterimageSpread * 0.28,
      1.02 + pose.vfx.afterimage * 0.18,
      (i - 1.5) * 0.08,
    );
  }

  for (let i = 0; i < 5; i += 1) {
    const line = group.getObjectByName(`NinjaSpeedLine${i}`) as THREE.Mesh | undefined;
    TEMP_POSITION.copy(origin);
    TEMP_POSITION.y += 0.12 + i * 0.045;
    const end = target.clone();
    end.y += 0.10 + i * 0.045;
    placeBeam(line, TEMP_POSITION, end, pose.vfx.speedLines * (0.42 + (i % 3) * 0.12), 0.72);
  }

  const angles = [-0.72, 0.62, -0.38, 0.34];
  for (let i = 0; i < 4; i += 1) {
    const slash = group.getObjectByName(`NinjaDelayedSlash${i}`) as THREE.Mesh | undefined;
    TEMP_POSITION.copy(target);
    TEMP_POSITION.y += 0.25 + (i % 2) * 0.035;
    setBillboard(
      slash,
      TEMP_POSITION,
      cameraQuaternion,
      pose.vfx.delayedSlashPulses[i] ?? 0,
      0.78 + (pose.vfx.delayedSlashPulses[i] ?? 0) * 0.85,
      1,
      angles[i] ?? 0,
    );
  }
}

export function createAssassinSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'AssassinSignatureVfx';
  group.visible = false;
  group.add(makeBillboard('AssassinShadowBlink', 0.34, 0.26, '#76538f'));
  group.add(makeBillboard('AssassinCrossA', 0.72, 0.026, '#efe6ff'));
  group.add(makeBillboard('AssassinCrossB', 0.72, 0.026, '#c185e8'));
  group.add(makeBillboard('AssassinImpactFlash', 0.22, 0.22, '#ffffff'));
  group.add(makeBillboard('AssassinExecutionGlow', 1.02, 0.055, '#74246f'));
  group.add(makeBillboard('AssassinExecutionLine', 1.12, 0.024, '#ff5fc8'));
  return group;
}

export function applyAssassinSignatureVfx(
  group: THREE.Group | null,
  pose: AssassinSignatureMotionPose,
  cameraQuaternion: THREE.Quaternion,
  target: THREE.Vector3,
): void {
  if (!group) return;
  const active = pose.vfx.shadowBlink > 0.005
    || pose.vfx.crossSlashA > 0.005
    || pose.vfx.crossSlashB > 0.005
    || pose.vfx.impactFlash > 0.005
    || pose.vfx.executionLine > 0.005
    || pose.vfx.executionGlow > 0.005;
  group.visible = active;
  if (!active) return;

  TEMP_POSITION.copy(target);
  TEMP_POSITION.y += 0.25;
  setBillboard(
    group.getObjectByName('AssassinShadowBlink') as THREE.Mesh | undefined,
    TEMP_POSITION,
    cameraQuaternion,
    pose.vfx.shadowBlink * 0.52,
    0.78 + pose.vfx.shadowBlink * 0.72,
    0.72 + pose.vfx.shadowBlink * 0.55,
  );
  setBillboard(
    group.getObjectByName('AssassinCrossA') as THREE.Mesh | undefined,
    TEMP_POSITION,
    cameraQuaternion,
    pose.vfx.crossSlashA * 0.96,
    0.86 + pose.vfx.crossSlashA * 0.72,
    1,
    -0.72,
  );
  setBillboard(
    group.getObjectByName('AssassinCrossB') as THREE.Mesh | undefined,
    TEMP_POSITION,
    cameraQuaternion,
    pose.vfx.crossSlashB * 0.96,
    0.86 + pose.vfx.crossSlashB * 0.72,
    1,
    0.72,
  );
  setBillboard(
    group.getObjectByName('AssassinImpactFlash') as THREE.Mesh | undefined,
    TEMP_POSITION,
    cameraQuaternion,
    pose.vfx.impactFlash,
    0.72 + pose.vfx.impactFlash * 1.20,
    0.72 + pose.vfx.impactFlash * 1.20,
  );
  setBillboard(
    group.getObjectByName('AssassinExecutionGlow') as THREE.Mesh | undefined,
    TEMP_POSITION,
    cameraQuaternion,
    pose.vfx.executionGlow * 0.54,
    0.82 + pose.vfx.executionGlow * 1.10,
    1,
    -0.10,
  );
  setBillboard(
    group.getObjectByName('AssassinExecutionLine') as THREE.Mesh | undefined,
    TEMP_POSITION,
    cameraQuaternion,
    pose.vfx.executionLine,
    0.82 + pose.vfx.executionLine * 1.15,
    1,
    -0.10,
  );
}

export function createCannoneerSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'CannoneerSignatureVfx';
  group.visible = false;
  group.add(makeBillboard('CannoneerMuzzleGlow', 0.36, 0.36, '#ffb14a'));
  group.add(makeBillboard('CannoneerMuzzleCore', 0.20, 0.20, '#fff3cf'));
  group.add(makeBeam('CannoneerTracerGlow', 0.024, '#ffb04a'));
  group.add(makeBeam('CannoneerTracerCore', 0.008, '#fff6d8'));
  for (let i = 0; i < 4; i += 1) {
    group.add(makeBillboard(`CannoneerSmoke${i}`, 0.24, 0.18, i % 2 === 0 ? '#d2c5b2' : '#a99f95'));
  }
  group.add(makeBillboard('CannoneerImpactFlash', 0.36, 0.36, '#fff4cc'));
  group.add(makeBillboard('CannoneerExplosion', 0.54, 0.54, '#ff7a35'));
  group.add(makeBillboard('CannoneerImpactSmoke', 0.48, 0.38, '#a88f7d'));
  return group;
}

export function applyCannoneerSignatureVfx(
  group: THREE.Group | null,
  pose: CannoneerSignatureMotionPose,
  cameraQuaternion: THREE.Quaternion,
  muzzle: THREE.Vector3,
  target: THREE.Vector3,
): void {
  if (!group) return;
  const vfx = pose.vfx;
  const active = vfx.muzzleFlash > 0.005
    || vfx.smoke > 0.005
    || vfx.tracer > 0.005
    || vfx.impactFlash > 0.005
    || vfx.explosion > 0.005
    || vfx.impactSmoke > 0.005;
  group.visible = active;
  if (!active) return;

  setBillboard(
    group.getObjectByName('CannoneerMuzzleGlow') as THREE.Mesh | undefined,
    muzzle,
    cameraQuaternion,
    vfx.muzzleFlash * 0.88,
    0.78 + vfx.muzzleFlash * 1.65,
    0.78 + vfx.muzzleFlash * 1.65,
  );
  setBillboard(
    group.getObjectByName('CannoneerMuzzleCore') as THREE.Mesh | undefined,
    muzzle,
    cameraQuaternion,
    vfx.muzzleCore,
    0.78 + vfx.muzzleCore * 1.35,
    0.78 + vfx.muzzleCore * 1.35,
  );
  placeBeam(
    group.getObjectByName('CannoneerTracerGlow') as THREE.Mesh | undefined,
    muzzle,
    target,
    vfx.tracer * 0.58,
    1,
  );
  placeBeam(
    group.getObjectByName('CannoneerTracerCore') as THREE.Mesh | undefined,
    muzzle,
    target,
    vfx.tracer,
    1,
  );

  TEMP_DIRECTION.copy(target).sub(muzzle);
  if (TEMP_DIRECTION.lengthSq() > 0.00001) TEMP_DIRECTION.normalize();
  for (let i = 0; i < 4; i += 1) {
    const smoke = group.getObjectByName(`CannoneerSmoke${i}`) as THREE.Mesh | undefined;
    TEMP_POSITION.copy(muzzle)
      .addScaledVector(TEMP_DIRECTION, vfx.smokeDrift * (0.55 + i * 0.18));
    TEMP_POSITION.y += 0.02 + i * 0.018;
    setBillboard(
      smoke,
      TEMP_POSITION,
      cameraQuaternion,
      vfx.smoke * (0.44 - i * 0.07),
      vfx.smokeScale * (0.64 + i * 0.12),
      vfx.smokeScale * (0.52 + i * 0.10),
      i * 0.31,
    );
  }

  TEMP_POSITION.copy(target);
  TEMP_POSITION.y += 0.24;
  setBillboard(
    group.getObjectByName('CannoneerImpactFlash') as THREE.Mesh | undefined,
    TEMP_POSITION,
    cameraQuaternion,
    vfx.impactFlash,
    0.74 + vfx.impactFlash * 2.25,
    0.74 + vfx.impactFlash * 2.25,
  );
  setBillboard(
    group.getObjectByName('CannoneerExplosion') as THREE.Mesh | undefined,
    TEMP_POSITION,
    cameraQuaternion,
    vfx.explosion * 0.88,
    Math.max(0.01, vfx.explosionScale),
    Math.max(0.01, vfx.explosionScale),
  );
  setBillboard(
    group.getObjectByName('CannoneerImpactSmoke') as THREE.Mesh | undefined,
    TEMP_POSITION,
    cameraQuaternion,
    vfx.impactSmoke * 0.50,
    0.82 + vfx.impactSmoke * 2.15,
    0.68 + vfx.impactSmoke * 1.80,
  );
}

export function createEngineerSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'EngineerSignatureVfx';
  group.visible = false;
  for (let i = 0; i < 6; i += 1) {
    const part = new THREE.Mesh(
      new THREE.BoxGeometry(0.055 + (i % 2) * 0.018, 0.034, 0.040),
      material(i % 2 === 0 ? '#f2b85d' : '#8da0a6'),
    );
    part.name = `EngineerLoosePart${i}`;
    group.add(part);
  }
  group.add(makeBillboard('EngineerEnergy', 0.32, 0.32, '#72e2ff'));
  for (let i = 0; i < 5; i += 1) {
    group.add(makeBillboard(`EngineerSpark${i}`, 0.16, 0.012, '#ffe19a'));
  }
  group.add(makeBillboard('EngineerActivation', 0.36, 0.36, '#8ff3ff'));
  group.add(makeBillboard('EngineerMuzzle', 0.20, 0.20, '#fff2b0'));
  group.add(makeBeam('EngineerTracer', 0.010, '#ffd56d'));
  return group;
}

export function applyEngineerSignatureVfx(
  group: THREE.Group | null,
  pose: EngineerSignatureMotionPose,
  cameraQuaternion: THREE.Quaternion,
  caster: THREE.Vector3,
  turret: THREE.Vector3,
  muzzle: THREE.Vector3,
  target: THREE.Vector3,
): void {
  if (!group) return;
  const active = pose.vfx.partsOpacity > 0.005
    || pose.vfx.energyPulse > 0.005
    || pose.vfx.assemblySparks > 0.005
    || pose.vfx.activationPulse > 0.005
    || pose.turret.muzzlePulse > 0.005;
  group.visible = active;
  if (!active) return;

  for (let i = 0; i < 6; i += 1) {
    const part = group.getObjectByName(`EngineerLoosePart${i}`) as THREE.Mesh | undefined;
    if (!part || !(part.material instanceof THREE.MeshBasicMaterial)) continue;
    const angle = pose.vfx.partsRotation + (i / 6) * Math.PI * 2;
    part.visible = pose.vfx.partsOpacity > 0.005;
    part.material.opacity = pose.vfx.partsOpacity * (0.68 + (i % 2) * 0.20);
    part.position.copy(caster);
    part.position.x += Math.cos(angle) * pose.vfx.partsRadius;
    part.position.z += Math.sin(angle) * pose.vfx.partsRadius * 0.72;
    part.position.y += 0.18 + pose.vfx.partsLift + (i % 3) * 0.025;
    part.rotation.set(angle * 0.33, angle, angle * 0.48);
  }

  TEMP_POSITION.copy(turret);
  TEMP_POSITION.y += 0.12;
  setBillboard(
    group.getObjectByName('EngineerEnergy') as THREE.Mesh | undefined,
    TEMP_POSITION,
    cameraQuaternion,
    pose.vfx.energyPulse * 0.58,
    pose.vfx.energyScale,
    pose.vfx.energyScale,
    pose.vfx.partsRotation * 0.08,
  );
  for (let i = 0; i < 5; i += 1) {
    const spark = group.getObjectByName(`EngineerSpark${i}`) as THREE.Mesh | undefined;
    TEMP_POSITION.copy(turret);
    TEMP_POSITION.x += Math.cos(i * 1.31) * 0.08;
    TEMP_POSITION.y += 0.10 + (i % 3) * 0.05;
    TEMP_POSITION.z += Math.sin(i * 1.31) * 0.08;
    setBillboard(
      spark,
      TEMP_POSITION,
      cameraQuaternion,
      pose.vfx.assemblySparks * (0.50 + (i % 2) * 0.30),
      0.72 + pose.vfx.assemblySparks * 0.72,
      1,
      i * 0.72,
    );
  }
  setBillboard(
    group.getObjectByName('EngineerActivation') as THREE.Mesh | undefined,
    TEMP_POSITION.copy(turret).add(new THREE.Vector3(0, 0.13, 0)),
    cameraQuaternion,
    pose.vfx.activationPulse * 0.82,
    0.72 + pose.vfx.activationPulse * 1.45,
    0.72 + pose.vfx.activationPulse * 1.45,
  );
  setBillboard(
    group.getObjectByName('EngineerMuzzle') as THREE.Mesh | undefined,
    muzzle,
    cameraQuaternion,
    pose.turret.muzzlePulse,
    0.72 + pose.turret.muzzlePulse * 1.30,
    0.72 + pose.turret.muzzlePulse * 1.30,
  );
  placeBeam(
    group.getObjectByName('EngineerTracer') as THREE.Mesh | undefined,
    muzzle,
    target,
    pose.turret.muzzlePulse * 0.92,
    1,
  );
}
