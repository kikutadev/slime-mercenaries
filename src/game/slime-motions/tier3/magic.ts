import * as THREE from 'three';

import {
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  type EquipmentPose,
  type IdleMotionPose,
} from '../../slime-motion';

export const TIER3_MAGIC_TIMING = {
  archmageAttack: 1.42,
  frostMageAttack: 1.32,
  meteorFlight: 0.30,
  iceBoltFlight: 0.22,
  freezeFieldHold: 0.62,
} as const;

export const TIER3_MAGIC_THRESHOLDS = {
  archmageReleaseU: 0.54,
  archmageImpactU: 0.69,
  frostReleaseU: 0.48,
  frostImpactU: 0.64,
  freezeFieldU: 0.64,
} as const;

/**
 * Parent-runtime contract for Archmage's signature cast.
 *
 * - runeCharge/runeConvergence: gather multiple independent rune/mote anchors.
 * - grandCircle: reveal the large target-side ritual circle.
 * - meteorRelease/meteorDrop: start and advance a vertical large-spell descent.
 * - impactPulse/impactDominance: brief screen-dominant impact beat.
 */
export interface ArchmageAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  runeCharge: number;
  runeConvergence: number;
  moteBoost: number;
  grandCircle: number;
  meteorRelease: number;
  meteorDrop: number;
  impactPulse: number;
  impactDominance: number;
}

/**
 * Parent-runtime contract for Frost Mage's signature cast.
 *
 * coldStillness intentionally suppresses bounce/wobble during the lock phase.
 * boltRelease/iceLance advance the projectile, then freezeField/spikeBurst own
 * the target-side freeze result rather than behaving as a recolored magic orb.
 */
export interface FrostMageAttackMotionPose extends IdleMotionPose {
  bodyOffset: number;
  staffPlant: number;
  frostCharge: number;
  coldStillness: number;
  boltRelease: number;
  iceLance: number;
  freezeField: number;
  spikeBurst: number;
}

export const TIER3_MAGIC_VFX_NODES = {
  archmage: {
    grandCircle: 'ArchmageGrandCircle',
    meteorRig: 'ArchmageMeteorRig',
    impactFlash: 'ArchmageImpactFlash',
    impactWave: 'ArchmageImpactWave',
  },
  frostMage: {
    lanceRig: 'FrostIceLanceRig',
    freezeField: 'FrostFreezeField',
    freezeFlash: 'FrostFreezeFlash',
  },
} as const;

const equipment = (angle = 0, lift = 0, sweep = 0): EquipmentPose => ({ angle, lift, sweep });

/**
 * Clamp arbitrary runtime input to a deterministic unit interval.
 * NaN is treated as the beginning of the motion; infinities resolve to an end.
 */
const stableUnit = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  if (value === Number.POSITIVE_INFINITY) return 1;
  if (value === Number.NEGATIVE_INFINITY) return 0;
  return clamp01(value);
};

const pulse01 = (value: number): number => Math.sin(clamp01(value) * Math.PI);

const materialOpacity = (object: THREE.Object3D, opacity: number): void => {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
      child.material.opacity = clamp01(opacity);
    }
  });
};

/**
 * Archmage is authored as a multi-beat major cast, not a larger Mage orb:
 * deep coil -> runes converge -> grand circle locks -> meteor falls -> impact hold.
 */
export function getArchmageAttackMotion(uInput: number): ArchmageAttackMotionPose {
  const u = stableUnit(uInput);

  if (u < 0.27) {
    const t = easeInOutCubic(u / 0.27);
    return {
      bodyOffset: -0.025 * t,
      runeCharge: 0.72 * t,
      runeConvergence: 0.18 * t,
      moteBoost: 0.35 + t * 0.90,
      grandCircle: 0.18 * t,
      meteorRelease: 0,
      meteorDrop: 0,
      impactPulse: 0,
      impactDominance: 0,
      deformation: {
        squash: 0.58 * t,
        stretch: 0,
        lean: -0.11 * t,
        wobble: 0.055 * Math.sin(t * Math.PI * 4),
        jump: 0,
      },
      equipment: equipment(-0.62 * t, 0.012 * t, -0.14 * t),
    };
  }

  if (u < 0.52) {
    const t = easeOutCubic((u - 0.27) / 0.25);
    const liftPulse = Math.sin(t * Math.PI);
    return {
      bodyOffset: -0.025 + 0.045 * t,
      runeCharge: 0.72 + 0.28 * t,
      runeConvergence: 0.18 + 0.82 * t,
      moteBoost: 1.25 + 0.85 * t,
      grandCircle: 0.18 + 0.82 * t,
      meteorRelease: 0,
      meteorDrop: 0,
      impactPulse: 0,
      impactDominance: 0,
      deformation: {
        squash: 0.58 * (1 - t),
        stretch: 0.68 * t,
        lean: THREE.MathUtils.lerp(-0.11, 0.07, t),
        wobble: 0.05 * liftPulse,
        jump: 0.11 * liftPulse,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-0.62, 0.28, t),
        0.02 + 0.065 * t,
        THREE.MathUtils.lerp(-0.14, 0.21, t),
      ),
    };
  }

  if (u < 0.69) {
    const phase = clamp01((u - 0.52) / 0.17);
    const t = easeOutCubic(phase);
    const snap = Math.sin(t * Math.PI * 0.5);
    return {
      bodyOffset: THREE.MathUtils.lerp(0.02, 0.075, t),
      runeCharge: THREE.MathUtils.lerp(1, 0.42, t),
      runeConvergence: 1,
      moteBoost: THREE.MathUtils.lerp(2.10, 1.30, t),
      grandCircle: 1,
      meteorRelease: snap,
      meteorDrop: easeInOutCubic(phase),
      impactPulse: 0,
      impactDominance: 0,
      deformation: {
        squash: 0.04,
        stretch: 0.62 * (1 - t),
        lean: 0.26 * snap,
        wobble: 0.18 * snap,
        jump: 0.075 * (1 - t),
      },
      equipment: equipment(
        THREE.MathUtils.lerp(0.28, 1.03, t),
        THREE.MathUtils.lerp(0.085, 0.015, t),
        THREE.MathUtils.lerp(0.21, 0.50, t),
      ),
    };
  }

  if (u < 0.81) {
    const t = clamp01((u - 0.69) / 0.12);
    const impact = pulse01(t);
    const dominance = Math.min(1, Math.sin(Math.min(1, t * 1.35) * Math.PI * 0.5));
    return {
      bodyOffset: THREE.MathUtils.lerp(0.075, 0.02, t),
      runeCharge: 0.42 * (1 - t),
      runeConvergence: 1,
      moteBoost: THREE.MathUtils.lerp(1.30, 0.72, t),
      grandCircle: 1 - 0.18 * t,
      meteorRelease: 1,
      meteorDrop: 1,
      impactPulse: impact,
      impactDominance: dominance * (1 - Math.max(0, (t - 0.72) / 0.28) * 0.32),
      deformation: {
        squash: 0.22 + impact * 0.30,
        stretch: 0,
        lean: -0.13 * impact,
        wobble: 0.22 * Math.sin(t * Math.PI * 2) * impact,
        jump: 0,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(1.03, 0.35, t),
        0,
        THREE.MathUtils.lerp(0.50, 0.14, t),
      ),
    };
  }

  const t = easeInOutCubic((u - 0.81) / 0.19);
  return {
    bodyOffset: THREE.MathUtils.lerp(0.02, 0, t),
    runeCharge: 0,
    runeConvergence: 1 - t,
    moteBoost: 0.72 * (1 - t),
    grandCircle: 0.82 * (1 - t),
    meteorRelease: 1,
    meteorDrop: 1,
    impactPulse: 0,
    impactDominance: 0,
    deformation: {
      squash: 0.22 * (1 - t),
      stretch: 0,
      lean: 0.05 * (1 - t),
      wobble: 0.055 * Math.sin(t * Math.PI * 2) * (1 - t),
      jump: 0,
    },
    equipment: equipment(0.35 * (1 - t), 0, 0.14 * (1 - t)),
  };
}

/**
 * Frost Mage is deliberately rigid at the payoff: staff plant -> cold lock ->
 * sharp ice lance -> expanding freeze field with spike eruption -> thawed recovery.
 */
export function getFrostMageAttackMotion(uInput: number): FrostMageAttackMotionPose {
  const u = stableUnit(uInput);

  if (u < 0.26) {
    const t = easeInOutCubic(u / 0.26);
    return {
      bodyOffset: -0.012 * t,
      staffPlant: t,
      frostCharge: 0.58 * t,
      coldStillness: 0.20 * t,
      boltRelease: 0,
      iceLance: 0,
      freezeField: 0,
      spikeBurst: 0,
      deformation: {
        squash: 0.42 * t,
        stretch: 0,
        lean: -0.075 * t,
        wobble: 0.028 * Math.sin(t * Math.PI * 2),
        jump: 0,
      },
      equipment: equipment(-0.72 * t, -0.052 * t, -0.08 * t),
    };
  }

  if (u < 0.48) {
    const t = easeOutCubic((u - 0.26) / 0.22);
    return {
      bodyOffset: -0.012,
      staffPlant: 1,
      frostCharge: 0.58 + 0.42 * t,
      coldStillness: 0.20 + 0.80 * t,
      boltRelease: 0,
      iceLance: 0,
      freezeField: 0,
      spikeBurst: 0,
      deformation: {
        squash: THREE.MathUtils.lerp(0.42, 0.30, t),
        stretch: 0.05 * t,
        lean: THREE.MathUtils.lerp(-0.075, 0, t),
        wobble: 0,
        jump: 0,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-0.72, -0.90, t),
        THREE.MathUtils.lerp(-0.052, -0.070, t),
        THREE.MathUtils.lerp(-0.08, -0.12, t),
      ),
    };
  }

  if (u < 0.64) {
    const t = easeOutCubic((u - 0.48) / 0.16);
    const releasePulse = Math.sin(t * Math.PI);
    return {
      bodyOffset: THREE.MathUtils.lerp(-0.012, 0.035, t),
      staffPlant: 1 - 0.18 * t,
      frostCharge: 1 - 0.28 * t,
      coldStillness: 1 - 0.34 * t,
      boltRelease: t,
      iceLance: t,
      freezeField: 0,
      spikeBurst: 0,
      deformation: {
        squash: 0.30 * (1 - t),
        stretch: 0.38 * releasePulse,
        lean: 0.18 * releasePulse,
        wobble: 0.02 * releasePulse,
        jump: 0,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(-0.90, 0.54, t),
        THREE.MathUtils.lerp(-0.070, 0.028, t),
        THREE.MathUtils.lerp(-0.12, 0.18, t),
      ),
    };
  }

  if (u < 0.86) {
    const t = clamp01((u - 0.64) / 0.22);
    const fieldRamp = easeOutCubic(Math.min(1, t / 0.32));
    const spikeRamp = easeOutCubic(Math.min(1, t / 0.24));
    return {
      bodyOffset: THREE.MathUtils.lerp(0.035, 0.01, t),
      staffPlant: THREE.MathUtils.lerp(0.82, 0.72, t),
      frostCharge: THREE.MathUtils.lerp(0.72, 0.42, t),
      coldStillness: 1,
      boltRelease: 1,
      iceLance: 1,
      freezeField: fieldRamp,
      spikeBurst: spikeRamp,
      deformation: {
        squash: 0.14 + 0.04 * (1 - t),
        stretch: 0,
        lean: 0,
        wobble: 0,
        jump: 0,
      },
      equipment: equipment(
        THREE.MathUtils.lerp(0.54, -0.10, t),
        THREE.MathUtils.lerp(0.028, -0.025, t),
        THREE.MathUtils.lerp(0.18, -0.02, t),
      ),
    };
  }

  const t = easeInOutCubic((u - 0.86) / 0.14);
  return {
    bodyOffset: THREE.MathUtils.lerp(0.01, 0, t),
    staffPlant: 0.72 * (1 - t),
    frostCharge: 0.42 * (1 - t),
    coldStillness: 1 - t,
    boltRelease: 1,
    iceLance: 1,
    freezeField: 1 - t,
    spikeBurst: 1 - t,
    deformation: {
      squash: 0.14 * (1 - t),
      stretch: 0,
      lean: 0,
      wobble: 0,
      jump: 0,
    },
    equipment: equipment(-0.10 * (1 - t), -0.025 * (1 - t), -0.02 * (1 - t)),
  };
}

const makeBasicMaterial = (
  color: THREE.ColorRepresentation,
  opacity = 0,
  options: Partial<THREE.MeshBasicMaterialParameters> = {},
): THREE.MeshBasicMaterial => new THREE.MeshBasicMaterial({
  color,
  transparent: true,
  opacity,
  depthWrite: false,
  depthTest: false,
  ...options,
});

const createArchmageGrandCircle = (): THREE.Group => {
  const circle = new THREE.Group();
  circle.name = TIER3_MAGIC_VFX_NODES.archmage.grandCircle;

  const outer = new THREE.Mesh(
    new THREE.RingGeometry(0.52, 0.575, 64),
    makeBasicMaterial('#8b7cff', 0, { side: THREE.DoubleSide }),
  );
  outer.name = 'ArchmageGrandCircleOuter';
  outer.rotation.x = -Math.PI / 2;
  circle.add(outer);

  const inner = new THREE.Mesh(
    new THREE.RingGeometry(0.31, 0.345, 64),
    makeBasicMaterial('#ffd36e', 0, { side: THREE.DoubleSide }),
  );
  inner.name = 'ArchmageGrandCircleInner';
  inner.rotation.x = -Math.PI / 2;
  circle.add(inner);

  for (let i = 0; i < 6; i += 1) {
    const spoke = new THREE.Mesh(
      new THREE.PlaneGeometry(0.035, 0.74),
      makeBasicMaterial(i % 2 === 0 ? '#a89cff' : '#ffd36e', 0, { side: THREE.DoubleSide }),
    );
    spoke.name = `ArchmageGrandCircleSpoke${i}`;
    spoke.rotation.x = -Math.PI / 2;
    spoke.rotation.z = (i / 6) * Math.PI;
    circle.add(spoke);
  }

  return circle;
};

const createConvergingRune = (index: number): THREE.Group => {
  const rune = new THREE.Group();
  rune.name = `ArchmageConvergingRune${index}`;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.105, 0.132, 36),
    makeBasicMaterial(index % 2 === 0 ? '#998cff' : '#ffd36e', 0, { side: THREE.DoubleSide }),
  );
  ring.name = `ArchmageConvergingRuneRing${index}`;
  rune.add(ring);
  const core = new THREE.Mesh(
    new THREE.RingGeometry(0.038, 0.050, 24),
    makeBasicMaterial('#ffffff', 0, { side: THREE.DoubleSide }),
  );
  core.name = `ArchmageConvergingRuneCore${index}`;
  rune.add(core);
  return rune;
};

export function createArchmageSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ArchmageSignatureVfx';
  group.visible = false;

  for (let i = 0; i < 4; i += 1) group.add(createConvergingRune(i));
  group.add(createArchmageGrandCircle());

  const meteorRig = new THREE.Group();
  meteorRig.name = TIER3_MAGIC_VFX_NODES.archmage.meteorRig;
  meteorRig.visible = false;
  const meteor = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 24, 18),
    makeBasicMaterial('#c864ff'),
  );
  meteor.name = 'ArchmageMeteorCore';
  meteorRig.add(meteor);
  const meteorHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 20, 14),
    makeBasicMaterial('#ffb85f', 0, { side: THREE.DoubleSide }),
  );
  meteorHalo.name = 'ArchmageMeteorHalo';
  meteorRig.add(meteorHalo);
  const trail = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.92, 16, 1, true),
    makeBasicMaterial('#9a54ff', 0, { side: THREE.DoubleSide }),
  );
  trail.name = 'ArchmageMeteorTrail';
  trail.position.y = 0.52;
  meteorRig.add(trail);
  group.add(meteorRig);

  const impactFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 24, 18),
    makeBasicMaterial('#fff2bd', 0, { side: THREE.DoubleSide }),
  );
  impactFlash.name = TIER3_MAGIC_VFX_NODES.archmage.impactFlash;
  group.add(impactFlash);

  const impactWave = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.40, 64),
    makeBasicMaterial('#d78cff', 0, { side: THREE.DoubleSide }),
  );
  impactWave.name = TIER3_MAGIC_VFX_NODES.archmage.impactWave;
  impactWave.rotation.x = -Math.PI / 2;
  group.add(impactWave);

  const impactHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.30, 0.52, 64),
    makeBasicMaterial('#ffd36e', 0, { side: THREE.DoubleSide }),
  );
  impactHalo.name = 'ArchmageImpactHalo';
  group.add(impactHalo);

  return group;
}

export function applyArchmageSignatureVfx(
  group: THREE.Group | null,
  pose: ArchmageAttackMotionPose,
  cameraQuaternion: THREE.Quaternion,
  caster: THREE.Vector3,
  target: THREE.Vector3,
): void {
  if (!group) return;

  const active = pose.runeCharge > 0.015
    || pose.grandCircle > 0.015
    || pose.meteorRelease > 0.015
    || pose.impactDominance > 0.015;
  group.visible = active;
  if (!active) return;

  group.position.set(0, 0, 0);

  for (let i = 0; i < 4; i += 1) {
    const rune = group.getObjectByName(`ArchmageConvergingRune${i}`) as THREE.Group | undefined;
    if (!rune) continue;
    const angle = (i / 4) * Math.PI * 2 + pose.runeCharge * (i % 2 === 0 ? 0.75 : -0.75);
    const radius = THREE.MathUtils.lerp(0.64, 0.13, pose.runeConvergence);
    rune.visible = pose.runeCharge > 0.02 && pose.impactDominance < 0.45;
    rune.position.copy(caster).add(new THREE.Vector3(
      Math.cos(angle) * radius,
      0.34 + Math.sin(angle * 2) * 0.12,
      Math.sin(angle) * radius * 0.58,
    ));
    rune.quaternion.copy(cameraQuaternion);
    rune.rotation.z += angle + pose.runeConvergence * (i % 2 === 0 ? 1.2 : -1.2);
    rune.scale.setScalar(THREE.MathUtils.lerp(1.05, 0.64, pose.runeConvergence));
    materialOpacity(rune, pose.runeCharge * (1 - 0.48 * pose.runeConvergence));
  }

  const circle = group.getObjectByName(TIER3_MAGIC_VFX_NODES.archmage.grandCircle) as THREE.Group | undefined;
  if (circle) {
    circle.visible = pose.grandCircle > 0.02;
    circle.position.copy(target);
    circle.position.y = 0.018;
    circle.rotation.y = pose.runeCharge * 0.70;
    circle.scale.setScalar(0.72 + pose.grandCircle * 1.72);
    materialOpacity(circle, Math.min(0.92, pose.grandCircle * 0.78 + pose.impactPulse * 0.18));
  }

  const meteorRig = group.getObjectByName(TIER3_MAGIC_VFX_NODES.archmage.meteorRig) as THREE.Group | undefined;
  if (meteorRig) {
    const drop = clamp01(pose.meteorDrop);
    meteorRig.visible = pose.meteorRelease > 0.02 && drop < 0.995 && pose.impactDominance < 0.30;
    meteorRig.position.copy(target);
    meteorRig.position.y += THREE.MathUtils.lerp(2.55, 0.22, drop * drop);
    const meteorScale = 0.86 + drop * 0.72;
    meteorRig.scale.setScalar(meteorScale);
    const core = meteorRig.getObjectByName('ArchmageMeteorCore') as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | undefined;
    const halo = meteorRig.getObjectByName('ArchmageMeteorHalo') as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | undefined;
    const meteorTrail = meteorRig.getObjectByName('ArchmageMeteorTrail') as THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial> | undefined;
    if (core) core.material.opacity = Math.min(1, pose.meteorRelease * 1.35);
    if (halo) halo.material.opacity = Math.min(0.72, pose.meteorRelease * 0.86);
    if (meteorTrail) {
      meteorTrail.material.opacity = Math.min(0.68, pose.meteorRelease * 0.80);
      meteorTrail.scale.y = 0.85 + drop * 1.45;
    }
  }

  const impactFlash = group.getObjectByName(TIER3_MAGIC_VFX_NODES.archmage.impactFlash) as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> | undefined;
  if (impactFlash) {
    impactFlash.visible = pose.impactDominance > 0.02;
    impactFlash.position.copy(target);
    impactFlash.position.y += 0.26;
    impactFlash.scale.setScalar(0.75 + pose.impactDominance * 3.25);
    impactFlash.material.opacity = pose.impactDominance * 0.76;
  }

  const impactWave = group.getObjectByName(TIER3_MAGIC_VFX_NODES.archmage.impactWave) as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | undefined;
  if (impactWave) {
    impactWave.visible = pose.impactPulse > 0.02;
    impactWave.position.copy(target);
    impactWave.position.y = 0.022;
    impactWave.scale.setScalar(0.85 + pose.impactPulse * 4.10);
    impactWave.material.opacity = pose.impactPulse * 0.92;
  }

  const impactHalo = group.getObjectByName('ArchmageImpactHalo') as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | undefined;
  if (impactHalo) {
    impactHalo.visible = pose.impactDominance > 0.02;
    impactHalo.position.copy(target);
    impactHalo.position.y += 0.30;
    impactHalo.quaternion.copy(cameraQuaternion);
    impactHalo.scale.setScalar(0.95 + pose.impactDominance * 3.50);
    impactHalo.material.opacity = pose.impactDominance * 0.90;
  }
}

const createFrostChargeShard = (index: number): THREE.Mesh => {
  const shard = new THREE.Mesh(
    new THREE.ConeGeometry(0.034, 0.18, 5),
    makeBasicMaterial(index % 2 === 0 ? '#d9fbff' : '#73dcff'),
  );
  shard.name = `FrostChargeShard${index}`;
  return shard;
};

export function createFrostMageSignatureVfx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'FrostMageSignatureVfx';
  group.visible = false;

  for (let i = 0; i < 6; i += 1) group.add(createFrostChargeShard(i));

  const lanceRig = new THREE.Group();
  lanceRig.name = TIER3_MAGIC_VFX_NODES.frostMage.lanceRig;
  lanceRig.visible = false;
  const lance = new THREE.Mesh(
    new THREE.ConeGeometry(0.105, 0.72, 7),
    makeBasicMaterial('#d9fbff'),
  );
  lance.name = 'FrostIceBolt';
  lance.position.y = 0.16;
  lanceRig.add(lance);
  const lanceCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.055, 0.58, 7),
    makeBasicMaterial('#67d8ff'),
  );
  lanceCore.name = 'FrostIceLanceCore';
  lanceCore.position.y = -0.24;
  lanceRig.add(lanceCore);
  const lanceHalo = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.86, 7, 1, true),
    makeBasicMaterial('#84e8ff', 0, { side: THREE.DoubleSide }),
  );
  lanceHalo.name = 'FrostIceLanceHalo';
  lanceRig.add(lanceHalo);
  group.add(lanceRig);

  const field = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.34, 64),
    makeBasicMaterial('#59d7ff', 0, { side: THREE.DoubleSide }),
  );
  field.name = TIER3_MAGIC_VFX_NODES.frostMage.freezeField;
  field.rotation.x = -Math.PI / 2;
  group.add(field);

  const fieldInner = new THREE.Mesh(
    new THREE.CircleGeometry(0.27, 64),
    makeBasicMaterial('#8cecff', 0, { side: THREE.DoubleSide }),
  );
  fieldInner.name = 'FrostFreezeFieldInner';
  fieldInner.rotation.x = -Math.PI / 2;
  group.add(fieldInner);

  const freezeFlash = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.31, 64),
    makeBasicMaterial('#efffff', 0, { side: THREE.DoubleSide }),
  );
  freezeFlash.name = TIER3_MAGIC_VFX_NODES.frostMage.freezeFlash;
  freezeFlash.rotation.x = -Math.PI / 2;
  group.add(freezeFlash);

  for (let i = 0; i < 10; i += 1) {
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.045 + (i % 3) * 0.010, 0.28 + (i % 2) * 0.10, 5),
      makeBasicMaterial(i % 2 === 0 ? '#dffcff' : '#78dfff'),
    );
    spike.name = `FrostSpike${i}`;
    group.add(spike);
  }

  return group;
}

export function applyFrostMageSignatureVfx(
  group: THREE.Group | null,
  pose: FrostMageAttackMotionPose,
  start: THREE.Vector3,
  target: THREE.Vector3,
): void {
  if (!group) return;

  const active = pose.frostCharge > 0.02
    || pose.boltRelease > 0.02
    || pose.freezeField > 0.02
    || pose.spikeBurst > 0.02;
  group.visible = active;
  if (!active) return;

  group.position.set(0, 0, 0);

  for (let i = 0; i < 6; i += 1) {
    const shard = group.getObjectByName(`FrostChargeShard${i}`) as THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial> | undefined;
    if (!shard) continue;
    const angle = (i / 6) * Math.PI * 2 + pose.frostCharge * 0.30;
    const radius = THREE.MathUtils.lerp(0.34, 0.075, pose.frostCharge);
    shard.visible = pose.frostCharge > 0.04 && pose.boltRelease < 0.60;
    shard.position.copy(start).add(new THREE.Vector3(
      Math.cos(angle) * radius,
      0.03 + Math.sin(angle * 2) * 0.08,
      Math.sin(angle) * radius * 0.62,
    ));
    shard.rotation.y = angle;
    shard.rotation.z = Math.PI + angle * 0.18;
    shard.scale.setScalar(0.65 + pose.frostCharge * 0.52);
    shard.material.opacity = Math.min(0.88, pose.frostCharge * 0.92);
  }

  const lanceRig = group.getObjectByName(TIER3_MAGIC_VFX_NODES.frostMage.lanceRig) as THREE.Group | undefined;
  if (lanceRig) {
    const flight = clamp01(pose.iceLance);
    lanceRig.visible = pose.boltRelease > 0.015 && flight < 0.985;
    lanceRig.position.copy(start).lerp(target, flight);
    const direction = target.clone().sub(start);
    if (direction.lengthSq() > 0.000001) {
      direction.normalize();
      lanceRig.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    }
    lanceRig.scale.setScalar(0.90 + flight * 0.46);
    materialOpacity(lanceRig, Math.min(1, 0.62 + pose.boltRelease * 0.38));
  }

  const field = group.getObjectByName(TIER3_MAGIC_VFX_NODES.frostMage.freezeField) as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | undefined;
  if (field) {
    field.visible = pose.freezeField > 0.015;
    field.position.copy(target);
    field.position.y = 0.018;
    field.scale.setScalar(0.68 + pose.freezeField * 3.05);
    field.material.opacity = pose.freezeField * 0.78;
  }

  const fieldInner = group.getObjectByName('FrostFreezeFieldInner') as THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial> | undefined;
  if (fieldInner) {
    fieldInner.visible = pose.freezeField > 0.02;
    fieldInner.position.copy(target);
    fieldInner.position.y = 0.014;
    fieldInner.scale.setScalar(0.68 + pose.freezeField * 2.95);
    fieldInner.material.opacity = pose.freezeField * 0.22;
  }

  const freezeFlash = group.getObjectByName(TIER3_MAGIC_VFX_NODES.frostMage.freezeFlash) as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | undefined;
  if (freezeFlash) {
    freezeFlash.visible = pose.spikeBurst > 0.02;
    freezeFlash.position.copy(target);
    freezeFlash.position.y = 0.024;
    const flashPulse = Math.sin(clamp01(pose.spikeBurst) * Math.PI * 0.82);
    freezeFlash.scale.setScalar(0.70 + pose.spikeBurst * 3.65);
    freezeFlash.material.opacity = Math.max(0.20 * pose.freezeField, flashPulse * 0.90);
  }

  for (let i = 0; i < 10; i += 1) {
    const spike = group.getObjectByName(`FrostSpike${i}`) as THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial> | undefined;
    if (!spike) continue;
    const angle = (i / 10) * Math.PI * 2 + (i % 2) * 0.16;
    const radius = 0.19 + pose.spikeBurst * (0.48 + (i % 3) * 0.08);
    spike.visible = pose.spikeBurst > 0.035;
    spike.position.copy(target).add(new THREE.Vector3(
      Math.cos(angle) * radius,
      0.045 + pose.spikeBurst * (0.08 + (i % 2) * 0.035),
      Math.sin(angle) * radius,
    ));
    spike.rotation.y = -angle;
    spike.rotation.z = (i % 2 === 0 ? 1 : -1) * (0.12 + pose.spikeBurst * 0.20);
    const scale = 0.46 + pose.spikeBurst * (0.84 + (i % 3) * 0.12);
    spike.scale.setScalar(scale);
    spike.material.opacity = Math.min(0.90, pose.spikeBurst * 0.86);
  }
}
