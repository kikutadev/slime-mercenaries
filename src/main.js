import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const canvas = document.querySelector('#game-canvas');
const loadingElement = document.querySelector('#loading');
const battleStateElement = document.querySelector('#battle-state');
const enemyHpFill = document.querySelector('#enemy-hp-fill');
const enemyHpLabel = document.querySelector('#enemy-hp-label');

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Game canvas was not found.');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b7e8fa');
scene.fog = new THREE.Fog('#ccecca', 9, 22);

const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 50);
camera.position.set(2.8, 5.35, 8.9);
camera.lookAt(0, 0.38, -1.05);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const clock = new THREE.Clock();
const loader = new GLTFLoader();
const tempQuaternion = new THREE.Quaternion();
const tempVector = new THREE.Vector3();
const tempVector2 = new THREE.Vector3();
const localZAxis = new THREE.Vector3(0, 0, 1);

const SCALE = 0.19;
const SWORD_HOME = new THREE.Vector3(-0.24, 0.02, 1.20);
const ARCHER_HOME = new THREE.Vector3(0.30, 0.02, 1.38);
const TARGET_HOME = new THREE.Vector3(0.12, 0.0, -1.42);
const SWORD_ATTACK_POS = new THREE.Vector3(-0.02, 0.02, -0.66);
const ENEMY_MAX_HP = 6;

const runtime = {
  sword: null,
  archer: null,
  enemy: null,
  slashArc: null,
  arrows: [],
  impacts: [],
  battle: {
    state: 'loading',
    stateStartedAt: 0,
    enemyHp: ENEMY_MAX_HP,
    enemyAlive: true,
    swordAttackStartedAt: -Infinity,
    swordHitApplied: false,
    archerShotStartedAt: -Infinity,
    nextSwordAttackAt: 0,
    nextArcherShotAt: 0,
    cycle: 0,
  },
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

function clamp01(value) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function easeOutCubic(value) {
  const t = clamp01(value);
  return 1 - ((1 - t) ** 3);
}

function easeInCubic(value) {
  const t = clamp01(value);
  return t ** 3;
}

function easeInOutCubic(value) {
  const t = clamp01(value);
  return t < 0.5
    ? 4 * t * t * t
    : 1 - ((-2 * t + 2) ** 3) / 2;
}

function createMaterial(color, roughness = 0.8) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function createEnvironment() {
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(16, 22), createMaterial('#8bd266', 0.94));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.045, -3.2);
  grass.receiveShadow = true;
  scene.add(grass);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 20), createMaterial('#e7cd92', 0.98));
  road.rotation.x = -Math.PI / 2;
  road.rotation.z = THREE.MathUtils.degToRad(-4);
  road.position.set(0.08, -0.032, -3.75);
  road.receiveShadow = true;
  scene.add(road);

  const roadEdgeMaterial = createMaterial('#c3ae75', 1);
  for (const side of [-1, 1]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 20), roadEdgeMaterial);
    edge.rotation.x = -Math.PI / 2;
    edge.rotation.z = THREE.MathUtils.degToRad(-4);
    edge.position.set(side * 2.38 + 0.08, -0.02, -3.75);
    scene.add(edge);
  }

  const fenceMaterial = createMaterial('#9c6b43', 0.93);
  const railMaterial = createMaterial('#b98558', 0.9);
  const postGeometry = new THREE.BoxGeometry(0.12, 0.64, 0.12);
  const railGeometry = new THREE.BoxGeometry(0.08, 0.095, 1.9);

  for (const side of [-1, 1]) {
    const x = side * 3.2;
    for (let z = -9; z <= 3; z += 1.9) {
      const post = new THREE.Mesh(postGeometry, fenceMaterial);
      post.position.set(x, 0.31, z);
      post.castShadow = true;
      scene.add(post);
      if (z < 3) {
        for (const y of [0.24, 0.43]) {
          const rail = new THREE.Mesh(railGeometry, railMaterial);
          rail.position.set(x, y, z + 0.92);
          rail.castShadow = true;
          scene.add(rail);
        }
      }
    }
  }

  const flowerColors = ['#fff6a8', '#ffffff', '#f6a3bd', '#b89cff'];
  const flowerMaterials = flowerColors.map((color) => createMaterial(color, 0.72));
  const stemMaterial = createMaterial('#4e9f52', 0.95);
  const stemGeometry = new THREE.CylinderGeometry(0.012, 0.016, 0.18, 6);
  const bloomGeometry = new THREE.SphereGeometry(0.052, 8, 6);
  const flowerSeeds = [
    [-3.7, 1.3, 0], [-3.45, 0.5, 2], [-3.8, -1.2, 1], [3.55, 1.6, 3],
    [3.7, -0.2, 1], [3.4, -2.1, 2], [-3.55, -3.2, 3], [3.6, -4.2, 0],
  ];

  for (const [x, z, colorIndex] of flowerSeeds) {
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(x, 0.09, z);
    scene.add(stem);
    const bloom = new THREE.Mesh(bloomGeometry, flowerMaterials[colorIndex]);
    bloom.scale.set(1.0, 0.55, 1.0);
    bloom.position.set(x, 0.21, z);
    scene.add(bloom);
  }

  const trunkMaterial = createMaterial('#8b6547', 0.95);
  const canopyMaterial = createMaterial('#5ebc60', 0.88);
  for (const [x, z, size] of [[-4.8, -4.2, 1.0], [4.65, -6.4, 1.25], [-4.4, -8, 1.35]]) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14 * size, 0.18 * size, 1.2 * size, 7),
      trunkMaterial,
    );
    trunk.position.set(x, 0.6 * size, z);
    trunk.castShadow = true;
    scene.add(trunk);

    const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85 * size, 2), canopyMaterial);
    canopy.scale.set(1.1, 0.92, 1.0);
    canopy.position.set(x, 1.55 * size, z);
    canopy.castShadow = true;
    scene.add(canopy);
  }
}

function createLighting() {
  scene.add(new THREE.HemisphereLight('#eaf9ff', '#709d4e', 2.0));
  const sun = new THREE.DirectionalLight('#fff5d7', 4.0);
  sun.position.set(-4.5, 7.5, 5.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 18;
  sun.shadow.camera.left = -5;
  sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5;
  sun.shadow.camera.bottom = -5;
  scene.add(sun);
}

function makeShadow(radius = 0.3) {
  const material = new THREE.MeshBasicMaterial({
    color: '#25462e',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(radius, 32), material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.35, 0.68, 1);
  shadow.position.y = 0.011;
  scene.add(shadow);
  return shadow;
}

function createTarget() {
  const target = new THREE.Group();
  target.name = 'ForestMushroom';
  target.position.copy(TARGET_HOME);

  const stem = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.17, 0.22, 5, 10),
    createMaterial('#f4e7c2', 0.76),
  );
  stem.position.y = 0.23;
  stem.castShadow = true;
  target.add(stem);

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.40, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    createMaterial('#ea765d', 0.56),
  );
  cap.scale.set(1.08, 0.60, 1.0);
  cap.position.y = 0.47;
  cap.castShadow = true;
  target.add(cap);

  const eyeMaterial = createMaterial('#2a2026', 0.95);
  for (const x of [-0.095, 0.095]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.027, 8, 6), eyeMaterial);
    eye.scale.set(1, 1, 0.55);
    eye.position.set(x, 0.37, 0.19);
    target.add(eye);
  }

  target.scale.setScalar(0.50);
  const shadow = makeShadow(0.34);
  shadow.position.set(TARGET_HOME.x, 0.011, TARGET_HOME.z);

  runtime.enemy = {
    root: target,
    shadow,
    baseScale: 0.50,
  };
  scene.add(target);
}

function createSlashArc() {
  const material = new THREE.MeshBasicMaterial({
    color: '#fff0a6',
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.018, 8, 32, Math.PI * 0.62),
    material,
  );
  arc.rotation.x = -0.08;
  arc.visible = false;
  scene.add(arc);
  runtime.slashArc = arc;
}

function createArrowMesh() {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#8a5a2d', roughness: 0.85 });
  const steel = new THREE.MeshStandardMaterial({ color: '#bcc8d0', roughness: 0.35, metalness: 0.6 });
  const feather = new THREE.MeshStandardMaterial({ color: '#6faa67', roughness: 0.72 });

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.30, 6), wood);
  shaft.position.y = 0.0;
  group.add(shaft);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 6), steel);
  tip.position.y = 0.185;
  group.add(tip);

  const fletching = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.012), feather);
  fletching.position.y = -0.15;
  fletching.rotation.y = Math.PI / 4;
  group.add(fletching);

  group.scale.setScalar(0.95);
  return group;
}

function createImpactFlash(position, color = '#fff1a5', size = 0.11) {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(size * 0.35, size, 20), material);
  mesh.position.copy(position);
  mesh.rotation.x = -0.18;
  scene.add(mesh);
  runtime.impacts.push({ mesh, startedAt: clock.elapsedTime });
}

function setMorph(unit, name, value) {
  if (!unit?.body?.morphTargetDictionary || !unit.body.morphTargetInfluences) {
    return;
  }
  const index = unit.body.morphTargetDictionary[name];
  if (index === undefined) {
    return;
  }
  unit.body.morphTargetInfluences[index] = clamp01(value);
}

function clearMorphs(unit) {
  unit?.body?.morphTargetInfluences?.fill(0);
}

function facePoint(unit, point) {
  if (!unit?.root) {
    return;
  }
  const dx = point.x - unit.root.position.x;
  const dz = point.z - unit.root.position.z;

  // The exported GLB was verified directly: the eyes sit on local +Z.
  // Point that actual forward axis at the requested world-space point.
  unit.root.rotation.y = Math.atan2(dx, dz);
}

function applyUnitDeformation(unit, { squash = 0, stretch = 0, lean = 0, wobble = 0, jump = 0, impact = 0 }) {
  clearMorphs(unit);
  setMorph(unit, 'Squash', squash);
  setMorph(unit, 'Stretch', stretch);
  if (lean < 0) {
    setMorph(unit, 'LeanLeft', Math.abs(lean));
  } else {
    setMorph(unit, 'LeanRight', lean);
  }
  if (wobble < 0) {
    setMorph(unit, 'WobbleLeft', Math.abs(wobble));
  } else {
    setMorph(unit, 'WobbleRight', wobble);
  }

  if (unit.faceRoot) {
    unit.faceRoot.scale.set(
      1 + squash * 0.045 - stretch * 0.015,
      1 - squash * 0.040 + stretch * 0.028,
      1,
    );
    unit.faceRoot.rotation.z = lean * 0.018 + wobble * 0.012;
  }

  if (unit.shadow) {
    const airborne = clamp01(jump / 0.16);
    const airScale = THREE.MathUtils.lerp(1, 0.66, airborne);
    unit.shadow.position.x = unit.root.position.x;
    unit.shadow.position.z = unit.root.position.z + 0.01;
    unit.shadow.scale.set(1.35 * airScale * (1 + impact * 0.18), 0.68 * airScale, 1);
    unit.shadow.material.opacity = THREE.MathUtils.lerp(0.22, 0.08, airborne) + impact * 0.04;
  }
}

function setEquipmentSwing(unit, angle, lift = 0) {
  if (!unit?.equipmentAnchor) {
    return;
  }
  tempQuaternion.setFromAxisAngle(localZAxis, angle);
  unit.equipmentAnchor.quaternion.copy(unit.equipmentBaseQuaternion).multiply(tempQuaternion);
  unit.equipmentAnchor.position.y = unit.equipmentBasePosition.y + lift;
}

function updateIdle(unit, now, phaseOffset = 0) {
  const wave = Math.sin(now * 2.2 + phaseOffset);
  const breathe = 0.5 + 0.5 * wave;
  const lean = Math.sin(now * 1.25 + phaseOffset) * 0.05;
  const wobble = Math.sin(now * 2.05 + phaseOffset * 1.7) * 0.055;
  applyUnitDeformation(unit, {
    squash: 0.040 * breathe,
    stretch: 0.020 * (1 - breathe),
    lean,
    wobble,
    jump: 0,
    impact: 0,
  });
  setEquipmentSwing(unit, lean * 0.18, 0);
}

function updateHopTravel(unit, now, startTime, start, end, duration, faceTravelDirection = true) {
  const u = clamp01((now - startTime) / duration);
  const eased = easeInOutCubic(u);
  unit.root.position.lerpVectors(start, end, eased);

  const cycleCount = 3.0;
  const cycle = (u * cycleCount) % 1;
  const jump = 4 * 0.115 * cycle * (1 - cycle);
  unit.root.position.y = THREE.MathUtils.lerp(start.y, end.y, eased) + jump;

  const landing = cycle < 0.12 ? (1 - cycle / 0.12) : 0;
  const takeoff = cycle > 0.70 ? ((cycle - 0.70) / 0.30) : 0;
  const stretch = Math.max(0, Math.sin(cycle * Math.PI)) * 0.22;
  const squash = landing * 0.58 + takeoff * 0.30;
  const lean = Math.sin(u * Math.PI) * 0.08;
  const wobble = Math.sin(cycle * Math.PI * 2.0) * (0.10 + landing * 0.20);

  applyUnitDeformation(unit, { squash, stretch, lean, wobble, jump, impact: landing * 0.34 });
  setEquipmentSwing(unit, lean * 0.22, jump * 0.03);
  if (faceTravelDirection) {
    facePoint(unit, end);
  }
  return u >= 1;
}

function updateSwordAttack(now) {
  const unit = runtime.sword;
  const battle = runtime.battle;
  const elapsed = now - battle.swordAttackStartedAt;
  const duration = runtime.reducedMotion ? 0.52 : 0.78;
  const u = clamp01(elapsed / duration);

  let squash = 0;
  let stretch = 0;
  let lean = 0;
  let weaponAngle = 0;

  if (u < 0.24) {
    const p = u / 0.24;
    squash = easeOutCubic(p) * 0.22;
    lean = -0.18 * p;
    weaponAngle = THREE.MathUtils.lerp(0, -1.05, easeInOutCubic(p));
  } else if (u < 0.52) {
    const p = (u - 0.24) / 0.28;
    stretch = Math.sin(p * Math.PI) * 0.16;
    lean = THREE.MathUtils.lerp(-0.18, 0.30, p);
    weaponAngle = THREE.MathUtils.lerp(-1.05, 0.92, easeOutCubic(p));

    if (!battle.swordHitApplied && p >= 0.58 && battle.enemyAlive) {
      battle.swordHitApplied = true;
      applyDamage(2, 'sword');
    }
  } else {
    const p = (u - 0.52) / 0.48;
    weaponAngle = THREE.MathUtils.lerp(0.92, 0, easeInOutCubic(p));
    const spring = Math.sin(p * Math.PI * 2.0) * Math.exp(-4.0 * p);
    squash = Math.max(0, -spring) * 0.24;
    stretch = Math.max(0, spring) * 0.18;
    lean = spring * 0.10;
  }

  const strikeForward = u < 0.52
    ? Math.sin((u / 0.52) * Math.PI) * 0.07
    : (1 - clamp01((u - 0.52) / 0.48)) * 0.025;
  tempVector.copy(runtime.enemy.root.position).sub(SWORD_ATTACK_POS).setY(0).normalize();
  unit.root.position.copy(SWORD_ATTACK_POS).addScaledVector(tempVector, strikeForward);
  applyUnitDeformation(unit, { squash, stretch, lean, jump: 0, impact: 0 });
  setEquipmentSwing(unit, weaponAngle, 0);
  facePoint(unit, runtime.enemy.root.position);

  if (elapsed >= duration) {
    battle.swordAttackStartedAt = -Infinity;
    battle.swordHitApplied = false;
    setEquipmentSwing(unit, 0, 0);
    if (runtime.slashArc) {
      runtime.slashArc.visible = false;
      runtime.slashArc.material.opacity = 0;
    }
  }
}

function updateArcherAttack(now) {
  const unit = runtime.archer;
  const elapsed = now - runtime.battle.archerShotStartedAt;
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > 0.46) {
    updateIdle(unit, now, 1.2);
    return;
  }

  const u = elapsed / 0.46;
  const draw = u < 0.52 ? easeInOutCubic(u / 0.52) : 1 - easeOutCubic((u - 0.52) / 0.48);
  applyUnitDeformation(unit, {
    squash: draw * 0.10,
    stretch: 0.02 * (1 - draw),
    lean: -draw * 0.08,
    jump: 0,
    impact: 0,
  });
  setEquipmentSwing(unit, -draw * 0.12, 0);
  facePoint(unit, runtime.enemy.root.position);
}

function fireArrow(now) {
  const unit = runtime.archer;
  if (!unit || !runtime.battle.enemyAlive) {
    return;
  }

  runtime.battle.archerShotStartedAt = now;
  const arrow = createArrowMesh();
  const start = new THREE.Vector3();
  unit.root.updateMatrixWorld(true);
  unit.equipmentAnchor.getWorldPosition(start);
  start.y += 0.02;
  const end = runtime.enemy.root.position.clone();
  end.y += 0.24;

  arrow.position.copy(start);
  scene.add(arrow);
  runtime.arrows.push({
    mesh: arrow,
    startedAt: now,
    duration: 0.62,
    start,
    end,
    applied: false,
  });
}

function updateArrows(now) {
  for (let i = runtime.arrows.length - 1; i >= 0; i -= 1) {
    const arrow = runtime.arrows[i];
    const u = clamp01((now - arrow.startedAt) / arrow.duration);
    arrow.mesh.position.lerpVectors(arrow.start, arrow.end, u);
    arrow.mesh.position.y += Math.sin(u * Math.PI) * 0.13;

    const futureU = Math.min(1, u + 0.02);
    tempVector.lerpVectors(arrow.start, arrow.end, futureU);
    tempVector.y += Math.sin(futureU * Math.PI) * 0.13;
    tempVector2.copy(tempVector).sub(arrow.mesh.position).normalize();
    arrow.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tempVector2);

    if (!arrow.applied && u >= 0.96) {
      arrow.applied = true;
      if (runtime.battle.enemyAlive) {
        applyDamage(1, 'arrow');
      }
    }

    if (u >= 1) {
      scene.remove(arrow.mesh);
      runtime.arrows.splice(i, 1);
    }
  }
}

function updateImpacts(now) {
  for (let i = runtime.impacts.length - 1; i >= 0; i -= 1) {
    const impact = runtime.impacts[i];
    const u = clamp01((now - impact.startedAt) / 0.28);
    impact.mesh.scale.setScalar(1 + u * 1.6);
    impact.mesh.material.opacity = (1 - u) * 0.85;
    if (u >= 1) {
      scene.remove(impact.mesh);
      runtime.impacts.splice(i, 1);
    }
  }
}

function applyDamage(amount, source) {
  const battle = runtime.battle;
  if (!battle.enemyAlive) {
    return;
  }

  battle.enemyHp = Math.max(0, battle.enemyHp - amount);
  updateEnemyHud();

  const impactPosition = runtime.enemy.root.position.clone();
  impactPosition.y += 0.30;
  impactPosition.x += source === 'arrow' ? 0.05 : -0.04;
  createImpactFlash(impactPosition, source === 'arrow' ? '#d9ffd0' : '#fff1a5', source === 'arrow' ? 0.085 : 0.12);

  runtime.enemy.root.rotation.z = source === 'arrow' ? -0.07 : -0.15;
  runtime.enemy.root.scale.set(
    runtime.enemy.baseScale * 1.06,
    runtime.enemy.baseScale * 0.84,
    runtime.enemy.baseScale,
  );

  if (battle.enemyHp <= 0) {
    battle.enemyAlive = false;
    battle.swordAttackStartedAt = -Infinity;
    battle.swordHitApplied = false;
    setEquipmentSwing(runtime.sword, 0, 0);
    if (runtime.slashArc) {
      runtime.slashArc.visible = false;
      runtime.slashArc.material.opacity = 0;
    }
    battle.state = 'defeat';
    battle.stateStartedAt = clock.elapsedTime;
    battleStateElement.textContent = '撃破';
  }
}

function updateEnemyHud() {
  const ratio = runtime.battle.enemyHp / ENEMY_MAX_HP;
  if (enemyHpFill) {
    enemyHpFill.style.transform = `scaleX(${ratio})`;
  }
  if (enemyHpLabel) {
    enemyHpLabel.textContent = `${runtime.battle.enemyHp} / ${ENEMY_MAX_HP}`;
  }
}

function resetEnemy() {
  const enemy = runtime.enemy;
  enemy.root.visible = true;
  enemy.shadow.visible = true;
  enemy.root.position.copy(TARGET_HOME);
  enemy.root.rotation.set(0, 0, 0);
  enemy.root.scale.setScalar(enemy.baseScale);
  enemy.shadow.position.set(TARGET_HOME.x, 0.011, TARGET_HOME.z);
  enemy.shadow.scale.set(1.35, 0.68, 1);
  enemy.shadow.material.opacity = 0.22;
  runtime.battle.enemyHp = ENEMY_MAX_HP;
  runtime.battle.enemyAlive = true;
  updateEnemyHud();
}

function startBattle(now) {
  runtime.battle.state = 'approach';
  runtime.battle.stateStartedAt = now;
  runtime.battle.nextSwordAttackAt = now + 1.7;
  runtime.battle.nextArcherShotAt = now + 0.65;
  battleStateElement.textContent = '接敵中';
  facePoint(runtime.sword, runtime.enemy.root.position);
  facePoint(runtime.archer, runtime.enemy.root.position);
}

function updateApproach(now) {
  const elapsed = now - runtime.battle.stateStartedAt;
  const duration = 1.55;
  const arrived = updateHopTravel(runtime.sword, now, runtime.battle.stateStartedAt, SWORD_HOME, SWORD_ATTACK_POS, duration);
  updateArcherAttack(now);

  if (runtime.battle.enemyAlive && now >= runtime.battle.nextArcherShotAt) {
    fireArrow(now);
    runtime.battle.nextArcherShotAt = now + 1.35;
  }

  if (arrived || elapsed >= duration) {
    runtime.sword.root.position.copy(SWORD_ATTACK_POS);
    runtime.battle.state = 'combat';
    runtime.battle.stateStartedAt = now;
    runtime.battle.nextSwordAttackAt = now + 0.12;
    battleStateElement.textContent = '交戦中';
  }
}

function updateCombat(now) {
  const battle = runtime.battle;
  const sword = runtime.sword;

  sword.root.position.copy(SWORD_ATTACK_POS);
  facePoint(sword, runtime.enemy.root.position);
  facePoint(runtime.archer, runtime.enemy.root.position);

  if (battle.swordAttackStartedAt === -Infinity) {
    updateIdle(sword, now, 0.2);
  } else {
    updateSwordAttack(now);
  }
  updateArcherAttack(now);

  if (battle.enemyAlive && now >= battle.nextSwordAttackAt && battle.swordAttackStartedAt === -Infinity) {
    battle.swordAttackStartedAt = now;
    battle.swordHitApplied = false;
    battle.nextSwordAttackAt = now + 1.08;
  }

  if (battle.enemyAlive && now >= battle.nextArcherShotAt) {
    fireArrow(now);
    battle.nextArcherShotAt = now + 1.38;
  }
}

function updateDefeat(now) {
  const battle = runtime.battle;
  const enemy = runtime.enemy;
  const u = clamp01((now - battle.stateStartedAt) / 0.58);
  const squash = Math.sin(Math.min(1, u * 1.5) * Math.PI * 0.5);
  const vanish = u > 0.42 ? easeInCubic((u - 0.42) / 0.58) : 0;

  enemy.root.rotation.z = -0.22 * squash;
  enemy.root.position.y = -0.05 * vanish;
  enemy.root.scale.set(
    enemy.baseScale * (1 + squash * 0.12) * (1 - vanish),
    enemy.baseScale * (1 - squash * 0.34) * (1 - vanish),
    enemy.baseScale * (1 - vanish),
  );
  enemy.shadow.material.opacity = 0.22 * (1 - vanish);

  updateIdle(runtime.sword, now, 0.2);
  updateIdle(runtime.archer, now, 1.2);

  if (u >= 1) {
    enemy.root.visible = false;
    enemy.shadow.visible = false;
    battle.swordAttackStartedAt = -Infinity;
    battle.swordHitApplied = false;
    battle.state = 'return';
    battle.stateStartedAt = now;
    battleStateElement.textContent = '帰還中';
  }
}

function updateReturn(now) {
  const duration = 1.45;
  // Return normally: the slime's face points in the same direction it travels.
  // Since the unit is moving back toward its home position/camera, its face is
  // visible naturally rather than being forced toward the camera independently.
  const arrived = updateHopTravel(runtime.sword, now, runtime.battle.stateStartedAt, SWORD_ATTACK_POS, SWORD_HOME, duration, true);
  updateIdle(runtime.archer, now, 1.2);

  if (arrived) {
    runtime.sword.root.position.copy(SWORD_HOME);
    facePoint(runtime.sword, TARGET_HOME);
    runtime.battle.state = 'respawn';
    runtime.battle.stateStartedAt = now;
    battleStateElement.textContent = '次の敵を待機';
  }
}

function updateRespawn(now) {
  updateIdle(runtime.sword, now, 0.2);
  updateIdle(runtime.archer, now, 1.2);
  const elapsed = now - runtime.battle.stateStartedAt;

  if (elapsed >= 0.75 && !runtime.enemy.root.visible) {
    resetEnemy();
    runtime.enemy.root.scale.setScalar(0.02);
  }

  if (runtime.enemy.root.visible) {
    const p = clamp01((elapsed - 0.75) / 0.28);
    runtime.enemy.root.scale.setScalar(runtime.enemy.baseScale * (0.2 + easeOutCubic(p) * 0.8));
    runtime.enemy.shadow.material.opacity = 0.22 * p;
  }

  if (elapsed >= 1.12) {
    runtime.battle.cycle += 1;
    startBattle(now);
  }
}

function updateEnemyRecovery(now) {
  if (!runtime.enemy || !runtime.battle.enemyAlive || runtime.battle.state === 'defeat') {
    return;
  }
  const wobble = Math.sin(now * 8.5) * 0.008;
  runtime.enemy.root.rotation.z = THREE.MathUtils.lerp(runtime.enemy.root.rotation.z, wobble, 0.12);
  runtime.enemy.root.scale.x = THREE.MathUtils.lerp(runtime.enemy.root.scale.x, runtime.enemy.baseScale, 0.14);
  runtime.enemy.root.scale.y = THREE.MathUtils.lerp(runtime.enemy.root.scale.y, runtime.enemy.baseScale, 0.14);
  runtime.enemy.root.scale.z = THREE.MathUtils.lerp(runtime.enemy.root.scale.z, runtime.enemy.baseScale, 0.14);
}

function updateBattle(now) {
  if (!runtime.sword || !runtime.archer || !runtime.enemy) {
    return;
  }

  if (runtime.battle.state === 'approach') {
    updateApproach(now);
  } else if (runtime.battle.state === 'combat') {
    updateCombat(now);
  } else if (runtime.battle.state === 'defeat') {
    updateDefeat(now);
  } else if (runtime.battle.state === 'return') {
    updateReturn(now);
  } else if (runtime.battle.state === 'respawn') {
    updateRespawn(now);
  }

  updateArrows(now);
  updateImpacts(now);
  updateEnemyRecovery(now);
}

function resizeRenderer() {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const targetWidth = Math.floor(width * pixelRatio);
  const targetHeight = Math.floor(height * pixelRatio);
  const drawingBufferSize = new THREE.Vector2();
  renderer.getDrawingBufferSize(drawingBufferSize);

  if (drawingBufferSize.x !== targetWidth || drawingBufferSize.y !== targetHeight) {
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

async function loadUnit(url, kind, home, equipmentName) {
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  root.name = `${kind}SlimeRuntime`;
  root.scale.setScalar(SCALE);
  root.position.copy(home);

  root.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  const body = root.getObjectByName('Body');
  const faceRoot = root.getObjectByName('FaceRoot');
  const equipmentAnchor = root.getObjectByName(equipmentName);
  if (!body?.morphTargetDictionary) {
    throw new Error(`${kind} slime is missing morph targets.`);
  }
  if (!equipmentAnchor) {
    throw new Error(`${kind} slime is missing ${equipmentName}.`);
  }

  const shadow = makeShadow(0.24);
  shadow.position.set(home.x, 0.011, home.z);
  const unit = {
    kind,
    root,
    body,
    faceRoot,
    equipmentAnchor,
    equipmentBaseQuaternion: equipmentAnchor.quaternion.clone(),
    equipmentBasePosition: equipmentAnchor.position.clone(),
    shadow,
  };
  scene.add(root);
  return unit;
}

async function initialize() {
  createEnvironment();
  createLighting();
  createTarget();

  const baseUrl = import.meta.env.BASE_URL;
  const [sword, archer] = await Promise.all([
    loadUnit(`${baseUrl}assets/sword-slime.glb`, 'Sword', SWORD_HOME, 'WeaponAnchor'),
    loadUnit(`${baseUrl}assets/archer-slime.glb`, 'Bow', ARCHER_HOME, 'BowAnchor'),
  ]);

  runtime.sword = sword;
  runtime.archer = archer;
  facePoint(sword, TARGET_HOME);
  facePoint(archer, TARGET_HOME);
  updateEnemyHud();
  loadingElement?.classList.add('is-hidden');

  const qaMode = new URLSearchParams(window.location.search).get('qa');
  if (qaMode === 'return') {
    sword.root.position.copy(SWORD_ATTACK_POS);
    runtime.enemy.root.visible = false;
    runtime.enemy.shadow.visible = false;
    runtime.battle.enemyAlive = false;
    runtime.battle.enemyHp = 0;
    updateEnemyHud();
    runtime.battle.state = 'return';
    runtime.battle.stateStartedAt = clock.elapsedTime;
    battleStateElement.textContent = '帰還中';
  } else {
    startBattle(clock.elapsedTime + 0.15);
  }
}

initialize().catch((error) => {
  console.error(error);
  if (loadingElement) {
    loadingElement.textContent = 'Squad failed to deploy.';
  }
});

function render() {
  requestAnimationFrame(render);
  resizeRenderer();
  updateBattle(clock.getElapsedTime());
  renderer.render(scene, camera);
}

render();
