import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const canvas = document.querySelector('#game-canvas');
const loadingElement = document.querySelector('#loading');
const battleStateElement = document.querySelector('#battle-state');
const enemyHpFill = document.querySelector('#enemy-hp-fill');
const enemyHpLabel = document.querySelector('#enemy-hp-label');
const swordHpLabel = document.querySelector('#sword-hp-label');
const archerHpLabel = document.querySelector('#archer-hp-label');
const swordCard = document.querySelector('#sword-card');
const archerCard = document.querySelector('#archer-card');

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Game canvas was not found.');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b7e8fa');
scene.fog = new THREE.Fog('#ccecca', 9, 22);

const CAMERA_BASE_POSITION = new THREE.Vector3(2.8, 5.35, 8.9);
const CAMERA_LOOK_AT = new THREE.Vector3(0, 0.38, -1.05);
const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 50);
camera.position.copy(CAMERA_BASE_POSITION);
camera.lookAt(CAMERA_LOOK_AT);

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
const tempQuaternion2 = new THREE.Quaternion();
const tempVector = new THREE.Vector3();
const tempVector2 = new THREE.Vector3();
const tempVector3 = new THREE.Vector3();
const localXAxis = new THREE.Vector3(1, 0, 0);
const localYAxis = new THREE.Vector3(0, 1, 0);
const localZAxis = new THREE.Vector3(0, 0, 1);

const SCALE = 0.19;
const SWORD_HOME = new THREE.Vector3(-0.24, 0.02, 1.20);
const ARCHER_HOME = new THREE.Vector3(0.30, 0.02, 1.38);
const SWORD_ATTACK_POS = new THREE.Vector3(-0.02, 0.02, -0.80);
const ENEMY_SPAWNS = [
  new THREE.Vector3(-0.30, 0, -1.38),
  new THREE.Vector3(0.12, 0, -1.55),
  new THREE.Vector3(0.44, 0, -1.30),
];
const TARGET_HOME = ENEMY_SPAWNS[1];
const ENEMY_MAX_HP = 4;
const SWORD_MAX_HP = 6;
const ARCHER_MAX_HP = 4;
const ENEMY_ATTACK_RANGE = 0.72;
const ENEMY_MOVE_SPEED = 0.74;
const RESULT_HOLD_SECONDS = 1.85;

const runtime = {
  sword: null,
  archer: null,
  allies: [],
  enemies: [],
  slashArc: null,
  arrows: [],
  impacts: [],
  simulationNow: 0,
  pausedDuration: 0,
  hitStopStartedAt: -Infinity,
  hitStopEndsAt: -Infinity,
  cameraShakeStartedAt: -Infinity,
  cameraShakeEndsAt: -Infinity,
  cameraShakeAmplitude: 0,
  battle: {
    state: 'loading',
    stateStartedAt: 0,
    result: null,
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

function startHitStop(durationSeconds) {
  if (runtime.reducedMotion || durationSeconds <= 0) {
    return;
  }
  const rawNow = clock.elapsedTime;
  if (rawNow < runtime.hitStopEndsAt) {
    runtime.hitStopEndsAt = Math.max(runtime.hitStopEndsAt, rawNow + durationSeconds);
    return;
  }
  runtime.hitStopStartedAt = rawNow;
  runtime.hitStopEndsAt = rawNow + durationSeconds;
}

function getSimulationTime(rawNow) {
  if (runtime.hitStopEndsAt > runtime.hitStopStartedAt) {
    if (rawNow < runtime.hitStopEndsAt) {
      return runtime.hitStopStartedAt - runtime.pausedDuration;
    }
    runtime.pausedDuration += runtime.hitStopEndsAt - runtime.hitStopStartedAt;
    runtime.hitStopStartedAt = -Infinity;
    runtime.hitStopEndsAt = -Infinity;
  }
  return rawNow - runtime.pausedDuration;
}

function startCameraShake(durationSeconds, amplitude) {
  if (runtime.reducedMotion || durationSeconds <= 0 || amplitude <= 0) {
    return;
  }
  const rawNow = clock.elapsedTime;
  runtime.cameraShakeStartedAt = rawNow;
  runtime.cameraShakeEndsAt = Math.max(runtime.cameraShakeEndsAt, rawNow + durationSeconds);
  runtime.cameraShakeAmplitude = Math.max(runtime.cameraShakeAmplitude, amplitude);
}

function updateCameraTransform(rawNow) {
  camera.position.copy(CAMERA_BASE_POSITION);
  if (rawNow < runtime.cameraShakeEndsAt) {
    const duration = Math.max(0.001, runtime.cameraShakeEndsAt - runtime.cameraShakeStartedAt);
    const u = clamp01((rawNow - runtime.cameraShakeStartedAt) / duration);
    const envelope = (1 - u) * runtime.cameraShakeAmplitude;
    camera.position.x += Math.sin(rawNow * 97) * envelope;
    camera.position.y += Math.sin(rawNow * 131 + 0.7) * envelope * 0.55;
  } else {
    runtime.cameraShakeAmplitude = 0;
  }
  camera.lookAt(CAMERA_LOOK_AT);
}

function disposeObject3D(root) {
  root.traverse((object) => {
    if (!object.isMesh) {
      return;
    }
    object.geometry?.dispose?.();
    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material?.dispose?.());
    } else {
      object.material?.dispose?.();
    }
  });
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

function createEnemy(home, index) {
  const target = new THREE.Group();
  target.name = `ForestMushroom${index + 1}`;
  target.position.copy(home);

  const stem = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.17, 0.22, 5, 10),
    createMaterial('#f4e7c2', 0.76),
  );
  stem.position.y = 0.23;
  stem.castShadow = true;
  target.add(stem);

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.40, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    createMaterial(index === 1 ? '#df6657' : '#ea765d', 0.56),
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

  const baseScale = 0.50;
  target.scale.setScalar(baseScale);
  const shadow = makeShadow(0.34);
  shadow.position.set(home.x, 0.011, home.z);
  scene.add(target);

  const enemy = {
    id: `enemy-mushroom-${index + 1}`,
    side: 'enemy',
    kind: 'Mushroom',
    index,
    root: target,
    shadow,
    home: home.clone(),
    baseScale,
    maxHp: ENEMY_MAX_HP,
    hp: ENEMY_MAX_HP,
    alive: true,
    state: 'idle',
    defeatStartedAt: -Infinity,
    hitStartedAt: -Infinity,
    attackStartedAt: -Infinity,
    attackOrigin: home.clone(),
    attackTarget: null,
    attackHitApplied: false,
    nextAttackAt: 0,
    lastUpdateAt: 0,
  };
  runtime.enemies.push(enemy);
  return enemy;
}

function createEnemies() {
  for (let index = 0; index < ENEMY_SPAWNS.length; index += 1) {
    createEnemy(ENEMY_SPAWNS[index], index);
  }
}

function createSlashArc() {
  const material = new THREE.MeshBasicMaterial({
    color: '#ffd85e',
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.024, 8, 36, Math.PI * 0.62),
    material,
  );
  arc.visible = false;
  arc.renderOrder = 5;
  scene.add(arc);
  runtime.slashArc = arc;
}

function createArrowMesh() {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#8a5a2d', roughness: 0.85 });
  const steel = new THREE.MeshStandardMaterial({ color: '#d1dce3', roughness: 0.28, metalness: 0.65 });
  const feather = new THREE.MeshStandardMaterial({ color: '#72bf68', roughness: 0.68 });

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.38, 6), wood);
  group.add(shaft);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.09, 6), steel);
  tip.position.y = 0.235;
  group.add(tip);

  const fletching = new THREE.Mesh(new THREE.BoxGeometry(0.070, 0.065, 0.014), feather);
  fletching.position.y = -0.195;
  fletching.rotation.y = Math.PI / 4;
  group.add(fletching);

  const trailMaterial = new THREE.MeshBasicMaterial({
    color: '#e9ffd9',
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const trail = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.016, 0.28, 6), trailMaterial);
  trail.name = 'ArrowTrail';
  trail.position.y = -0.31;
  trail.visible = false;
  group.add(trail);

  return group;
}

function createImpactFlash(position, color = '#fff1a5', size = 0.11, duration = 0.28, sparkCount = 7) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.quaternion.copy(camera.quaternion);

  const materials = [];
  const ringMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  materials.push(ringMaterial);
  const ring = new THREE.Mesh(new THREE.RingGeometry(size * 0.52, size, 24), ringMaterial);
  group.add(ring);

  for (let i = 0; i < sparkCount; i += 1) {
    const angle = (i / sparkCount) * Math.PI * 2 + 0.22;
    const sparkMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    materials.push(sparkMaterial);
    const spark = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 0.12, size * 0.78),
      sparkMaterial,
    );
    spark.position.set(
      Math.cos(angle) * size * 0.62,
      Math.sin(angle) * size * 0.62,
      0.002,
    );
    spark.rotation.z = angle - Math.PI / 2;
    group.add(spark);
  }

  scene.add(group);
  runtime.impacts.push({
    group,
    materials,
    startedAt: runtime.simulationNow,
    duration,
  });
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

  // The exported slime GLBs and the procedural mushroom both face local +Z.
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

function setEquipmentSwing(unit, angle, lift = 0, sweep = 0) {
  if (!unit?.equipmentAnchor) {
    return;
  }

  const primaryAxis = unit.kind === 'Sword' ? localXAxis : localZAxis;
  tempQuaternion.setFromAxisAngle(primaryAxis, angle);
  unit.equipmentAnchor.quaternion.copy(unit.equipmentBaseQuaternion).multiply(tempQuaternion);
  if (unit.kind === 'Sword' && Math.abs(sweep) > 0.0001) {
    tempQuaternion2.setFromAxisAngle(localZAxis, sweep);
    unit.equipmentAnchor.quaternion.multiply(tempQuaternion2);
  }
  unit.equipmentAnchor.position.y = unit.equipmentBasePosition.y + lift;
}

function updateIdle(unit, now, phaseOffset = 0) {
  if (!unit?.alive) {
    return;
  }
  if (unit.body) {
    unit.body.scale.copy(unit.bodyBaseScale);
  }
  if (unit.faceRoot) {
    unit.faceRoot.position.copy(unit.faceBasePosition);
  }
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

function getLivingEnemies() {
  return runtime.enemies.filter((enemy) => enemy.alive);
}

function getLivingAllies() {
  return runtime.allies.filter((ally) => ally.alive);
}

function findNearestLivingTarget(sourceUnit, candidates) {
  if (!sourceUnit?.root) {
    return null;
  }
  let nearest = null;
  let nearestDistanceSq = Infinity;
  for (const candidate of candidates) {
    if (!candidate?.alive || !candidate.root?.visible) {
      continue;
    }
    const dx = candidate.root.position.x - sourceUnit.root.position.x;
    const dz = candidate.root.position.z - sourceUnit.root.position.z;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq < nearestDistanceSq) {
      nearestDistanceSq = distanceSq;
      nearest = candidate;
    }
  }
  return nearest;
}

function createDefeatEyes(unit) {
  const normalEyes = ['Eye_L', 'Eye_R']
    .map((name) => unit.root.getObjectByName(name))
    .filter(Boolean);
  if (normalEyes.length !== 2) {
    return { normalEyes, xEyes: [] };
  }

  const xMaterial = new THREE.MeshBasicMaterial({ color: '#201925' });
  const barGeometry = new THREE.BoxGeometry(0.28, 0.052, 0.034);
  const xEyes = [];

  for (const eye of normalEyes) {
    const group = new THREE.Group();
    group.name = `${eye.name}_DefeatX`;
    group.position.copy(eye.position);
    group.position.z += 0.068;
    for (const rotation of [-Math.PI / 4, Math.PI / 4]) {
      const bar = new THREE.Mesh(barGeometry, xMaterial);
      bar.rotation.z = rotation;
      group.add(bar);
    }
    group.visible = false;
    eye.parent.add(group);
    xEyes.push(group);
  }
  return { normalEyes, xEyes };
}

function setDefeatEyes(unit, defeated) {
  for (const eye of unit.normalEyes ?? []) {
    eye.visible = !defeated;
  }
  for (const xEye of unit.xEyes ?? []) {
    xEye.visible = defeated;
  }
}

function updateHud() {
  const totalMaxHp = runtime.enemies.reduce((sum, enemy) => sum + enemy.maxHp, 0);
  const totalHp = runtime.enemies.reduce((sum, enemy) => sum + enemy.hp, 0);
  const aliveEnemies = getLivingEnemies().length;
  const ratio = totalMaxHp > 0 ? totalHp / totalMaxHp : 0;

  if (enemyHpFill) {
    enemyHpFill.style.transform = `scaleX(${ratio})`;
  }
  if (enemyHpLabel) {
    enemyHpLabel.textContent = `${aliveEnemies}体 · ${totalHp} / ${totalMaxHp}`;
  }
  if (swordHpLabel && runtime.sword) {
    swordHpLabel.textContent = `HP ${runtime.sword.hp} / ${runtime.sword.maxHp}`;
  }
  if (archerHpLabel && runtime.archer) {
    archerHpLabel.textContent = `HP ${runtime.archer.hp} / ${runtime.archer.maxHp}`;
  }
  swordCard?.classList.toggle('is-defeated', Boolean(runtime.sword && !runtime.sword.alive));
  archerCard?.classList.toggle('is-defeated', Boolean(runtime.archer && !runtime.archer.alive));
}

function resetSlashArc() {
  if (!runtime.slashArc) {
    return;
  }
  runtime.slashArc.visible = false;
  runtime.slashArc.material.opacity = 0;
}

function beginAllyDefeat(unit, now) {
  if (!unit.alive) {
    return;
  }
  unit.alive = false;
  unit.state = 'defeat';
  unit.defeatStartedAt = now;
  unit.defeatStartRotationY = unit.root.rotation.y;
  unit.root.position.y = Math.max(0.02, unit.root.position.y);
  setDefeatEyes(unit, false);
  if (unit.kind === 'Sword') {
    runtime.battle.swordAttackStartedAt = -Infinity;
    runtime.battle.swordHitApplied = false;
    resetSlashArc();
  }
}

function beginEnemyDefeat(enemy, now) {
  if (!enemy.alive) {
    return;
  }
  enemy.alive = false;
  enemy.state = 'defeat';
  enemy.defeatStartedAt = now;
  enemy.attackStartedAt = -Infinity;
  enemy.attackTarget = null;
}

function enterBattleResult(result, now) {
  if (runtime.battle.state === 'result') {
    return;
  }
  runtime.battle.state = 'result';
  runtime.battle.stateStartedAt = now;
  runtime.battle.result = result;
  runtime.battle.swordAttackStartedAt = -Infinity;
  runtime.battle.swordHitApplied = false;
  runtime.battle.archerShotStartedAt = -Infinity;
  resetSlashArc();
  for (const enemy of runtime.enemies) {
    enemy.attackStartedAt = -Infinity;
    enemy.attackTarget = null;
  }
  battleStateElement.textContent = result === 'victory' ? '勝利！' : '全滅…';
}

function evaluateBattleOutcome(now) {
  if (runtime.battle.state === 'result' || runtime.battle.state === 'loading') {
    return;
  }
  if (getLivingAllies().length === 0) {
    enterBattleResult('defeat', now);
    return;
  }
  if (getLivingEnemies().length === 0) {
    enterBattleResult('victory', now);
  }
}

function applyDamage(targetUnit, amount, source, contactPosition = null, sourcePosition = null) {
  if (!targetUnit?.alive || amount <= 0) {
    return;
  }

  targetUnit.hp = Math.max(0, targetUnit.hp - amount);
  const now = runtime.simulationNow;
  const isArrow = source === 'arrow';
  const isEnemyAttack = source === 'enemy';
  const impactPosition = contactPosition
    ? contactPosition.clone()
    : targetUnit.root.position.clone();
  if (!contactPosition) {
    impactPosition.y += targetUnit.side === 'ally' ? 0.24 : (isArrow ? 0.31 : 0.33);
  }

  createImpactFlash(
    impactPosition,
    isEnemyAttack ? '#ffb7a5' : (isArrow ? '#dcffd1' : '#ffe98c'),
    isEnemyAttack ? 0.095 : (isArrow ? 0.085 : 0.125),
    isEnemyAttack ? 0.22 : (isArrow ? 0.20 : 0.26),
    isEnemyAttack ? 6 : (isArrow ? 5 : 7),
  );

  if (!isArrow) {
    createImpactFlash(impactPosition, '#ffffff', 0.038, 0.12, 4);
    startHitStop(isEnemyAttack ? 0.028 : 0.038);
    startCameraShake(isEnemyAttack ? 0.08 : 0.12, isEnemyAttack ? 0.012 : 0.020);
  }

  if (targetUnit.side === 'enemy') {
    targetUnit.hitStartedAt = now;
    if (sourcePosition) {
      tempVector.copy(targetUnit.root.position).sub(sourcePosition).setY(0);
      if (tempVector.lengthSq() > 0.0001) {
        tempVector.normalize();
        targetUnit.root.position.addScaledVector(tempVector, isArrow ? 0.026 : 0.066);
      }
    }
    if (enemyHpFill?.animate) {
      enemyHpFill.animate(
        [
          { filter: 'brightness(1.75) saturate(1.15)' },
          { filter: 'brightness(1) saturate(1)' },
        ],
        { duration: runtime.reducedMotion ? 1 : 150, easing: 'ease-out' },
      );
    }
    if (targetUnit.hp <= 0) {
      beginEnemyDefeat(targetUnit, now);
    }
  } else {
    targetUnit.hitStartedAt = now;
    if (targetUnit.hp <= 0) {
      beginAllyDefeat(targetUnit, now);
    }
  }

  updateHud();
  evaluateBattleOutcome(now);
}

function updateSwordAttack(now) {
  const unit = runtime.sword;
  const battle = runtime.battle;
  const target = unit.attackTarget;
  const elapsed = now - battle.swordAttackStartedAt;
  const duration = runtime.reducedMotion ? 0.58 : 0.88;
  const u = clamp01(elapsed / duration);

  if (!target?.root) {
    battle.swordAttackStartedAt = -Infinity;
    battle.swordHitApplied = false;
    resetSlashArc();
    return;
  }

  let squash = 0;
  let stretch = 0;
  let lean = 0;
  let weaponAngle = 0;
  let weaponSweep = 0;
  let weaponLift = 0;
  let bodyOffset = 0;
  let releaseProgress = -1;

  if (u < 0.32) {
    const p = easeInOutCubic(u / 0.32);
    squash = p * 0.32;
    lean = -p * 0.20;
    weaponAngle = THREE.MathUtils.lerp(0, -0.72, p);
    weaponSweep = THREE.MathUtils.lerp(0, -0.22, p);
    weaponLift = p * 0.018;
    bodyOffset = -p * 0.045;
  } else if (u < 0.62) {
    const p = (u - 0.32) / 0.30;
    const release = easeOutCubic(p);
    releaseProgress = p;
    squash = Math.max(0, 0.10 * (1 - p));
    stretch = Math.sin(p * Math.PI) * 0.24;
    lean = THREE.MathUtils.lerp(-0.20, 0.34, release);
    weaponAngle = THREE.MathUtils.lerp(-0.72, 1.34, release);
    weaponSweep = THREE.MathUtils.lerp(-0.22, 0.18, release);
    weaponLift = Math.sin(p * Math.PI) * 0.026;
    bodyOffset = THREE.MathUtils.lerp(-0.045, 0.32, release);
  } else {
    const p = (u - 0.62) / 0.38;
    const recovery = easeInOutCubic(p);
    const spring = Math.sin(p * Math.PI * 2.0) * Math.exp(-4.2 * p);
    weaponAngle = THREE.MathUtils.lerp(1.34, 0, recovery);
    weaponSweep = THREE.MathUtils.lerp(0.18, 0, recovery);
    bodyOffset = THREE.MathUtils.lerp(0.32, 0, recovery);
    squash = Math.max(0, -spring) * 0.20;
    stretch = Math.max(0, spring) * 0.15;
    lean = spring * 0.09;
  }

  tempVector.copy(target.root.position).sub(SWORD_ATTACK_POS).setY(0);
  if (tempVector.lengthSq() > 0.0001) {
    tempVector.normalize();
  }
  unit.root.position.copy(SWORD_ATTACK_POS).addScaledVector(tempVector, bodyOffset);
  facePoint(unit, target.root.position);
  applyUnitDeformation(unit, { squash, stretch, lean, jump: 0, impact: 0 });
  setEquipmentSwing(unit, weaponAngle, weaponLift, weaponSweep);
  unit.root.updateMatrixWorld(true);

  if (releaseProgress >= 0 && unit.weaponTip) {
    unit.weaponTip.getWorldPosition(tempVector3);
    const arcU = clamp01((releaseProgress - 0.08) / 0.82);
    const arcPulse = Math.sin(arcU * Math.PI);
    runtime.slashArc.visible = arcPulse > 0.01;
    runtime.slashArc.position.copy(tempVector3);
    runtime.slashArc.position.y += 0.012;
    runtime.slashArc.quaternion.copy(camera.quaternion);
    runtime.slashArc.rotateZ(-0.95 + arcU * 1.15);
    runtime.slashArc.scale.set(0.90 + arcU * 0.52, 0.68 + arcU * 0.16, 1);
    runtime.slashArc.material.opacity = arcPulse * 0.88;

    tempVector2.copy(target.root.position);
    tempVector2.y += 0.30;
    const tipDistance = tempVector3.distanceTo(tempVector2);
    const bodyDistance = Math.hypot(
      target.root.position.x - unit.root.position.x,
      target.root.position.z - unit.root.position.z,
    );
    const crossedContact = releaseProgress >= 0.43 && tipDistance <= 0.39;
    const lateContact = releaseProgress >= 0.70 && tipDistance <= 0.46;
    const committedReach = releaseProgress >= 0.56 && bodyDistance <= 0.90;
    if (!battle.swordHitApplied && target.alive && (crossedContact || lateContact || committedReach)) {
      battle.swordHitApplied = true;
      applyDamage(target, 2, 'sword', tempVector3, unit.root.position);
    }
  } else {
    resetSlashArc();
  }

  if (elapsed >= duration) {
    battle.swordAttackStartedAt = -Infinity;
    battle.swordHitApplied = false;
    unit.attackTarget = null;
    setEquipmentSwing(unit, 0, 0);
    resetSlashArc();
  }
}

function updateArcherAttack(now) {
  const unit = runtime.archer;
  if (!unit.alive) {
    return;
  }
  const elapsed = now - runtime.battle.archerShotStartedAt;
  const target = unit.attackTarget?.alive ? unit.attackTarget : findNearestLivingTarget(unit, getLivingEnemies());
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > 0.62 || !target) {
    unit.root.position.copy(ARCHER_HOME);
    updateIdle(unit, now, 1.2);
    return;
  }

  const u = elapsed / 0.62;
  let squash = 0;
  let stretch = 0;
  let lean = 0;
  let weaponAngle = 0;
  let bodyOffset = 0;

  if (u < 0.50) {
    const p = easeInOutCubic(u / 0.50);
    squash = p * 0.17;
    lean = -p * 0.14;
    weaponAngle = -p * 0.27;
    bodyOffset = -p * 0.045;
  } else {
    const p = (u - 0.50) / 0.50;
    const recoil = Math.sin(p * Math.PI) * Math.exp(-2.2 * p);
    squash = Math.max(0, recoil) * 0.09;
    stretch = Math.max(0, 1 - p) * 0.10;
    lean = recoil * 0.11;
    weaponAngle = THREE.MathUtils.lerp(0.11, 0, easeOutCubic(p)) + recoil * 0.05;
    bodyOffset = recoil * 0.038;
  }

  tempVector.copy(target.root.position).sub(ARCHER_HOME).setY(0);
  if (tempVector.lengthSq() > 0.0001) {
    tempVector.normalize();
  }
  unit.root.position.copy(ARCHER_HOME).addScaledVector(tempVector, bodyOffset);
  applyUnitDeformation(unit, { squash, stretch, lean, jump: 0, impact: 0 });
  setEquipmentSwing(unit, weaponAngle, 0);
  facePoint(unit, target.root.position);
}

function fireArrow(now) {
  const unit = runtime.archer;
  if (!unit?.alive) {
    return;
  }
  const target = findNearestLivingTarget(unit, getLivingEnemies());
  if (!target) {
    return;
  }

  unit.attackTarget = target;
  runtime.battle.archerShotStartedAt = now;
  const arrow = createArrowMesh();
  arrow.visible = true;
  scene.add(arrow);
  runtime.arrows.push({
    mesh: arrow,
    trail: arrow.getObjectByName('ArrowTrail'),
    target,
    launchAt: now + 0.30,
    startedAt: now + 0.30,
    duration: 0.48,
    start: new THREE.Vector3(),
    end: new THREE.Vector3(),
    launched: false,
    applied: false,
  });
}

function updateArrows(now) {
  for (let i = runtime.arrows.length - 1; i >= 0; i -= 1) {
    const arrow = runtime.arrows[i];
    if (!arrow.target?.alive && !arrow.launched) {
      arrow.target = findNearestLivingTarget(runtime.archer, getLivingEnemies());
      if (!arrow.target) {
        scene.remove(arrow.mesh);
        disposeObject3D(arrow.mesh);
        runtime.arrows.splice(i, 1);
        continue;
      }
    }

    if (now < arrow.launchAt) {
      if (!runtime.archer.alive || !arrow.target) {
        scene.remove(arrow.mesh);
        disposeObject3D(arrow.mesh);
        runtime.arrows.splice(i, 1);
        continue;
      }
      const drawU = clamp01((now - runtime.battle.archerShotStartedAt) / 0.30);
      runtime.archer.root.updateMatrixWorld(true);
      runtime.archer.equipmentAnchor.getWorldPosition(tempVector3);
      tempVector3.y += 0.028;
      tempVector2.copy(arrow.target.root.position);
      tempVector2.y += 0.27;
      tempVector2.sub(tempVector3);
      if (tempVector2.lengthSq() > 0.0001) {
        tempVector2.normalize();
      }
      arrow.mesh.position.copy(tempVector3).addScaledVector(
        tempVector2,
        THREE.MathUtils.lerp(0.055, 0.018, easeInOutCubic(drawU)),
      );
      arrow.mesh.quaternion.setFromUnitVectors(localYAxis, tempVector2);
      continue;
    }

    if (!arrow.launched) {
      arrow.launched = true;
      runtime.archer.root.updateMatrixWorld(true);
      runtime.archer.equipmentAnchor.getWorldPosition(arrow.start);
      arrow.start.y += 0.028;
      tempVector.copy(arrow.target.root.position).sub(arrow.start).setY(0);
      if (tempVector.lengthSq() > 0.0001) {
        tempVector.normalize();
        arrow.start.addScaledVector(tempVector, 0.055);
      }

      arrow.end.copy(arrow.target.root.position);
      arrow.end.y += 0.27;
      arrow.mesh.position.copy(arrow.start);
      arrow.mesh.visible = true;
      if (arrow.trail) {
        arrow.trail.visible = true;
      }
      createImpactFlash(arrow.start, '#eaffd9', 0.032, 0.11, 3);
    }

    const u = clamp01((now - arrow.startedAt) / arrow.duration);
    arrow.mesh.position.lerpVectors(arrow.start, arrow.end, u);
    arrow.mesh.position.y += Math.sin(u * Math.PI) * 0.11;

    const futureU = Math.min(1, u + 0.025);
    tempVector.lerpVectors(arrow.start, arrow.end, futureU);
    tempVector.y += Math.sin(futureU * Math.PI) * 0.11;
    tempVector2.copy(tempVector).sub(arrow.mesh.position).normalize();
    arrow.mesh.quaternion.setFromUnitVectors(localYAxis, tempVector2);

    if (!arrow.applied && u >= 0.94) {
      arrow.applied = true;
      if (arrow.target?.alive) {
        applyDamage(arrow.target, 1, 'arrow', null, runtime.archer.root.position);
      }
    }

    if (u >= 1) {
      scene.remove(arrow.mesh);
      disposeObject3D(arrow.mesh);
      runtime.arrows.splice(i, 1);
    }
  }
}

function updateImpacts(now) {
  for (let i = runtime.impacts.length - 1; i >= 0; i -= 1) {
    const impact = runtime.impacts[i];
    const u = clamp01((now - impact.startedAt) / impact.duration);
    const burst = easeOutCubic(u);
    impact.group.scale.setScalar(0.86 + burst * 1.85);
    impact.group.rotation.z = u * 0.16;
    for (const material of impact.materials) {
      material.opacity = (1 - u) * 0.92;
    }
    if (u >= 1) {
      scene.remove(impact.group);
      disposeObject3D(impact.group);
      runtime.impacts.splice(i, 1);
    }
  }
}

function updateAllyDefeat(unit, now) {
  if (unit.state !== 'defeat') {
    return;
  }
  const duration = runtime.reducedMotion ? 0.30 : 0.72;
  const u = clamp01((now - unit.defeatStartedAt) / duration);

  clearMorphs(unit);
  setMorph(unit, 'Squash', Math.min(1, u * 1.7));
  setDefeatEyes(unit, u >= 0.22);

  // Turn the defeated slime toward the fixed camera while it collapses so
  // the X-eye expression stays readable at normal gameplay size.
  const cameraFacingYaw = Math.atan2(
    camera.position.x - unit.root.position.x,
    camera.position.z - unit.root.position.z,
  );
  unit.root.rotation.y = THREE.MathUtils.lerp(
    unit.defeatStartRotationY ?? unit.root.rotation.y,
    cameraFacingYaw,
    easeOutCubic(u),
  );

  if (u < 0.18) {
    const p = Math.sin((u / 0.18) * Math.PI);
    unit.body.scale.set(
      unit.bodyBaseScale.x * (1 - p * 0.08),
      unit.bodyBaseScale.y * (1 + p * 0.16),
      unit.bodyBaseScale.z * (1 - p * 0.05),
    );
    unit.root.position.y = unit.home.y + p * 0.055;
  } else {
    const p = easeOutCubic((u - 0.18) / 0.82);
    unit.body.scale.set(
      unit.bodyBaseScale.x * THREE.MathUtils.lerp(1, 1.34, p),
      unit.bodyBaseScale.y * THREE.MathUtils.lerp(1, 0.40, p),
      unit.bodyBaseScale.z * THREE.MathUtils.lerp(1, 1.22, p),
    );
    unit.root.position.y = THREE.MathUtils.lerp(unit.home.y + 0.02, 0.006, p);
    if (unit.faceRoot) {
      unit.faceRoot.position.copy(unit.faceBasePosition);
      unit.faceRoot.position.y -= p * 0.12;
      unit.faceRoot.scale.set(1.12, THREE.MathUtils.lerp(1, 0.72, p), 1);
    }
    setEquipmentSwing(unit, (unit.kind === 'Sword' ? 1 : -1) * p * 0.72, -p * 0.025, p * 0.16);
  }

  if (unit.shadow) {
    unit.shadow.position.x = unit.root.position.x;
    unit.shadow.position.z = unit.root.position.z;
    unit.shadow.scale.set(THREE.MathUtils.lerp(1.35, 1.78, u), THREE.MathUtils.lerp(0.68, 0.86, u), 1);
    unit.shadow.material.opacity = THREE.MathUtils.lerp(0.22, 0.16, u);
  }
}

function updateEnemyDefeat(enemy, now) {
  const u = clamp01((now - enemy.defeatStartedAt) / 0.64);
  const squash = Math.sin(Math.min(1, u * 1.45) * Math.PI * 0.5);
  const vanish = u > 0.48 ? easeInCubic((u - 0.48) / 0.52) : 0;

  enemy.root.rotation.z = -0.28 * squash;
  enemy.root.position.y = -0.045 * vanish;
  enemy.root.scale.set(
    enemy.baseScale * (1 + squash * 0.18) * (1 - vanish),
    enemy.baseScale * (1 - squash * 0.48) * (1 - vanish),
    enemy.baseScale * (1 + squash * 0.05) * (1 - vanish),
  );
  enemy.shadow.material.opacity = 0.22 * (1 - vanish);
  if (u >= 1) {
    enemy.root.visible = false;
    enemy.shadow.visible = false;
    enemy.state = 'dead';
  }
}

function updateEnemyAttack(enemy, now) {
  const target = enemy.attackTarget;
  const duration = runtime.reducedMotion ? 0.44 : 0.70;
  const u = clamp01((now - enemy.attackStartedAt) / duration);
  if (!target?.root || !target.alive) {
    enemy.attackStartedAt = -Infinity;
    enemy.attackTarget = null;
    enemy.root.position.copy(enemy.attackOrigin);
    return;
  }

  tempVector.copy(target.root.position).sub(enemy.attackOrigin).setY(0);
  const distance = tempVector.length();
  if (distance > 0.0001) {
    tempVector.normalize();
  }
  const lungeDistance = Math.min(0.30, Math.max(0.12, distance - 0.40));

  let travel = 0;
  let squash = 0;
  let jump = 0;
  if (u < 0.34) {
    const p = easeInOutCubic(u / 0.34);
    travel = -0.05 * p;
    squash = 0.18 * p;
  } else if (u < 0.66) {
    const p = easeOutCubic((u - 0.34) / 0.32);
    travel = THREE.MathUtils.lerp(-0.05, lungeDistance, p);
    jump = Math.sin(p * Math.PI) * 0.10;
    squash = Math.max(0, 0.12 * (1 - p));
  } else {
    const p = easeInOutCubic((u - 0.66) / 0.34);
    travel = THREE.MathUtils.lerp(lungeDistance, 0, p);
    squash = Math.sin(p * Math.PI) * 0.10;
  }

  enemy.root.position.copy(enemy.attackOrigin).addScaledVector(tempVector, travel);
  enemy.root.position.y = jump;
  enemy.root.scale.set(
    enemy.baseScale * (1 + squash * 0.30),
    enemy.baseScale * (1 - squash * 0.48 + jump * 0.35),
    enemy.baseScale * (1 + squash * 0.12),
  );
  facePoint(enemy, target.root.position);

  if (!enemy.attackHitApplied && u >= 0.57) {
    enemy.attackHitApplied = true;
    tempVector2.copy(target.root.position);
    tempVector2.y += 0.22;
    applyDamage(target, 1, 'enemy', tempVector2, enemy.root.position);
  }

  if (u >= 1) {
    enemy.attackStartedAt = -Infinity;
    enemy.attackTarget = null;
    enemy.attackHitApplied = false;
    enemy.root.position.copy(enemy.attackOrigin);
    enemy.root.position.y = 0;
  }
}

function updateEnemyUnit(enemy, now) {
  if (enemy.state === 'defeat' || enemy.state === 'dead') {
    if (enemy.state === 'defeat') {
      updateEnemyDefeat(enemy, now);
    }
    return;
  }

  const dt = enemy.lastUpdateAt > 0 ? Math.min(0.05, Math.max(0, now - enemy.lastUpdateAt)) : 0;
  enemy.lastUpdateAt = now;

  if (runtime.battle.state !== 'combat') {
    const idlePulse = Math.sin(now * 3.0 + enemy.index * 1.7) * 0.025;
    enemy.root.scale.set(
      enemy.baseScale * (1 + idlePulse),
      enemy.baseScale * (1 - idlePulse * 0.75),
      enemy.baseScale,
    );
    enemy.shadow.position.x = enemy.root.position.x;
    enemy.shadow.position.z = enemy.root.position.z;
    return;
  }

  if (enemy.attackStartedAt !== -Infinity) {
    updateEnemyAttack(enemy, now);
  } else {
    const target = findNearestLivingTarget(enemy, getLivingAllies());
    if (!target) {
      return;
    }
    facePoint(enemy, target.root.position);
    tempVector.copy(target.root.position).sub(enemy.root.position).setY(0);
    const distance = tempVector.length();
    if (distance > ENEMY_ATTACK_RANGE) {
      tempVector.normalize();
      const step = Math.min(distance - ENEMY_ATTACK_RANGE, ENEMY_MOVE_SPEED * dt);
      enemy.root.position.addScaledVector(tempVector, step);
      const hop = Math.abs(Math.sin(now * 8.0 + enemy.index * 1.2)) * 0.045;
      enemy.root.position.y = hop;
      enemy.root.scale.set(
        enemy.baseScale * (1 - hop * 0.30),
        enemy.baseScale * (1 + hop * 0.55),
        enemy.baseScale,
      );
    } else {
      enemy.root.position.y = 0;
      const hitU = clamp01((now - enemy.hitStartedAt) / 0.18);
      const hitPulse = enemy.hitStartedAt > 0 && hitU < 1 ? Math.sin(hitU * Math.PI) : 0;
      const idlePulse = Math.sin(now * 5.0 + enemy.index) * 0.018;
      enemy.root.scale.set(
        enemy.baseScale * (1 + idlePulse + hitPulse * 0.10),
        enemy.baseScale * (1 - idlePulse * 0.70 - hitPulse * 0.20),
        enemy.baseScale,
      );
      if (now >= enemy.nextAttackAt) {
        enemy.attackStartedAt = now;
        enemy.attackOrigin.copy(enemy.root.position);
        enemy.attackTarget = target;
        enemy.attackHitApplied = false;
        enemy.nextAttackAt = now + 1.52 + enemy.index * 0.10;
      }
    }
  }

  enemy.shadow.position.x = enemy.root.position.x;
  enemy.shadow.position.z = enemy.root.position.z;
  enemy.shadow.scale.set(1.35, 0.68, 1);
  enemy.shadow.material.opacity = 0.22;
}

function updateEnemies(now) {
  for (const enemy of runtime.enemies) {
    updateEnemyUnit(enemy, now);
  }
}

function startBattle(now) {
  runtime.battle.state = 'approach';
  runtime.battle.stateStartedAt = now;
  runtime.battle.result = null;
  runtime.battle.nextSwordAttackAt = now + 1.7;
  runtime.battle.nextArcherShotAt = now + 0.65;
  battleStateElement.textContent = '接敵中';

  const firstEnemy = findNearestLivingTarget(runtime.sword, getLivingEnemies());
  if (firstEnemy) {
    facePoint(runtime.sword, firstEnemy.root.position);
    facePoint(runtime.archer, firstEnemy.root.position);
  }
  runtime.enemies.forEach((enemy, index) => {
    enemy.nextAttackAt = now + 0.82 + index * 0.20;
    enemy.lastUpdateAt = now;
  });
}

function updateApproach(now) {
  const elapsed = now - runtime.battle.stateStartedAt;
  const duration = 1.55;
  const target = findNearestLivingTarget(runtime.sword, getLivingEnemies());
  if (!target) {
    evaluateBattleOutcome(now);
    return;
  }

  const arrived = runtime.sword.alive
    ? updateHopTravel(runtime.sword, now, runtime.battle.stateStartedAt, SWORD_HOME, SWORD_ATTACK_POS, duration)
    : true;
  updateArcherAttack(now);

  if (runtime.archer.alive && now >= runtime.battle.nextArcherShotAt) {
    fireArrow(now);
    runtime.battle.nextArcherShotAt = now + 1.35;
  }

  if (arrived || elapsed >= duration) {
    if (runtime.sword.alive) {
      runtime.sword.root.position.copy(SWORD_ATTACK_POS);
    }
    runtime.battle.state = 'combat';
    runtime.battle.stateStartedAt = now;
    runtime.battle.nextSwordAttackAt = now + 0.12;
    battleStateElement.textContent = '交戦中';
  }
}

function updateCombat(now) {
  const battle = runtime.battle;
  const sword = runtime.sword;

  if (sword.alive) {
    sword.root.position.y = SWORD_ATTACK_POS.y;
    const target = sword.attackTarget?.alive
      ? sword.attackTarget
      : findNearestLivingTarget(sword, getLivingEnemies());
    if (target) {
      facePoint(sword, target.root.position);
    }

    if (battle.swordAttackStartedAt === -Infinity) {
      updateIdle(sword, now, 0.2);
    } else {
      updateSwordAttack(now);
    }

    if (target && now >= battle.nextSwordAttackAt && battle.swordAttackStartedAt === -Infinity) {
      sword.attackTarget = target;
      battle.swordAttackStartedAt = now;
      battle.swordHitApplied = false;
      battle.nextSwordAttackAt = now + 1.08;
    }
  }

  if (runtime.archer.alive) {
    updateArcherAttack(now);
    if (now >= battle.nextArcherShotAt) {
      fireArrow(now);
      battle.nextArcherShotAt = now + 1.38;
    }
  }
}

function updateResult(now) {
  for (const ally of runtime.allies) {
    if (ally.alive) {
      updateIdle(ally, now, ally.kind === 'Sword' ? 0.2 : 1.2);
    }
  }

  if ((now - runtime.battle.stateStartedAt) >= RESULT_HOLD_SECONDS) {
    resetWave(now);
  }
}

function clearProjectiles() {
  for (const arrow of runtime.arrows) {
    scene.remove(arrow.mesh);
    disposeObject3D(arrow.mesh);
  }
  runtime.arrows.length = 0;
}

function resetAlly(unit) {
  unit.hp = unit.maxHp;
  unit.alive = true;
  unit.state = 'idle';
  unit.defeatStartedAt = -Infinity;
  unit.hitStartedAt = -Infinity;
  unit.attackTarget = null;
  unit.root.visible = true;
  unit.root.scale.setScalar(SCALE);
  unit.root.rotation.set(0, 0, 0);
  unit.root.position.copy(unit.home);
  unit.body.scale.copy(unit.bodyBaseScale);
  clearMorphs(unit);
  if (unit.faceRoot) {
    unit.faceRoot.position.copy(unit.faceBasePosition);
    unit.faceRoot.scale.copy(unit.faceBaseScale);
  }
  setDefeatEyes(unit, false);
  setEquipmentSwing(unit, 0, 0);
  unit.shadow.visible = true;
  unit.shadow.position.set(unit.home.x, 0.011, unit.home.z);
  unit.shadow.scale.set(1.35, 0.68, 1);
  unit.shadow.material.opacity = 0.22;
}

function resetEnemy(enemy, now) {
  enemy.hp = enemy.maxHp;
  enemy.alive = true;
  enemy.state = 'idle';
  enemy.defeatStartedAt = -Infinity;
  enemy.hitStartedAt = -Infinity;
  enemy.attackStartedAt = -Infinity;
  enemy.attackTarget = null;
  enemy.attackHitApplied = false;
  enemy.nextAttackAt = now + 0.8 + enemy.index * 0.2;
  enemy.lastUpdateAt = now;
  enemy.root.visible = true;
  enemy.root.position.copy(enemy.home);
  enemy.root.rotation.set(0, 0, 0);
  enemy.root.scale.setScalar(enemy.baseScale);
  enemy.shadow.visible = true;
  enemy.shadow.position.set(enemy.home.x, 0.011, enemy.home.z);
  enemy.shadow.scale.set(1.35, 0.68, 1);
  enemy.shadow.material.opacity = 0.22;
}

function resetWave(now) {
  clearProjectiles();
  resetSlashArc();
  runtime.battle.cycle += 1;
  runtime.battle.swordAttackStartedAt = -Infinity;
  runtime.battle.swordHitApplied = false;
  runtime.battle.archerShotStartedAt = -Infinity;
  resetAlly(runtime.sword);
  resetAlly(runtime.archer);
  for (const enemy of runtime.enemies) {
    resetEnemy(enemy, now);
  }
  updateHud();
  startBattle(now + 0.12);
}

function updateBattle(now) {
  if (!runtime.sword || !runtime.archer || runtime.enemies.length === 0) {
    return;
  }

  if (runtime.battle.state === 'approach') {
    updateApproach(now);
  } else if (runtime.battle.state === 'combat') {
    updateCombat(now);
  } else if (runtime.battle.state === 'result') {
    updateResult(now);
  }

  updateEnemies(now);
  updateAllyDefeat(runtime.sword, now);
  updateAllyDefeat(runtime.archer, now);
  updateArrows(now);
  updateImpacts(now);
  evaluateBattleOutcome(now);
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
  const weaponTip = kind === 'Sword' ? root.getObjectByName('Sword_Tip') : null;
  if (!body?.morphTargetDictionary) {
    throw new Error(`${kind} slime is missing morph targets.`);
  }
  if (!equipmentAnchor) {
    throw new Error(`${kind} slime is missing ${equipmentName}.`);
  }
  if (kind === 'Sword' && !weaponTip) {
    throw new Error('Sword slime is missing Sword_Tip contact marker.');
  }

  const shadow = makeShadow(0.24);
  shadow.position.set(home.x, 0.011, home.z);
  const unit = {
    id: kind === 'Sword' ? 'ally-sword-1' : 'ally-bow-1',
    side: 'ally',
    kind,
    root,
    body,
    faceRoot,
    equipmentAnchor,
    weaponTip,
    equipmentBaseQuaternion: equipmentAnchor.quaternion.clone(),
    equipmentBasePosition: equipmentAnchor.position.clone(),
    bodyBaseScale: body.scale.clone(),
    faceBaseScale: faceRoot?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
    faceBasePosition: faceRoot?.position.clone() ?? new THREE.Vector3(),
    shadow,
    home: home.clone(),
    maxHp: kind === 'Sword' ? SWORD_MAX_HP : ARCHER_MAX_HP,
    hp: kind === 'Sword' ? SWORD_MAX_HP : ARCHER_MAX_HP,
    alive: true,
    state: 'idle',
    defeatStartedAt: -Infinity,
    hitStartedAt: -Infinity,
    attackTarget: null,
    normalEyes: [],
    xEyes: [],
  };
  const defeatEyes = createDefeatEyes(unit);
  unit.normalEyes = defeatEyes.normalEyes;
  unit.xEyes = defeatEyes.xEyes;
  scene.add(root);
  return unit;
}

async function initialize() {
  createEnvironment();
  createLighting();
  createEnemies();
  createSlashArc();

  const baseUrl = import.meta.env.BASE_URL;
  const [sword, archer] = await Promise.all([
    loadUnit(`${baseUrl}assets/sword-slime.glb`, 'Sword', SWORD_HOME, 'WeaponAnchor'),
    loadUnit(`${baseUrl}assets/archer-slime.glb`, 'Bow', ARCHER_HOME, 'BowAnchor'),
  ]);

  runtime.sword = sword;
  runtime.archer = archer;
  runtime.allies = [sword, archer];
  facePoint(sword, TARGET_HOME);
  facePoint(archer, TARGET_HOME);
  updateHud();
  loadingElement?.classList.add('is-hidden');

  const qaMode = new URLSearchParams(window.location.search).get('qa');
  if (qaMode === 'defeat') {
    runtime.battle.state = 'result';
    runtime.battle.stateStartedAt = clock.elapsedTime;
    runtime.battle.result = 'defeat';
    sword.hp = 0;
    beginAllyDefeat(sword, clock.elapsedTime);
    battleStateElement.textContent = '敗北モーション確認';
    updateHud();
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
  const rawNow = clock.getElapsedTime();
  const hitStopActive = rawNow < runtime.hitStopEndsAt;
  const simulationNow = getSimulationTime(rawNow);
  runtime.simulationNow = simulationNow;
  if (!hitStopActive) {
    updateBattle(simulationNow);
  }
  updateCameraTransform(rawNow);
  renderer.render(scene, camera);
}

render();
