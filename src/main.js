import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const canvas = document.querySelector('#game-canvas');
const loadingElement = document.querySelector('#loading');
const hintElement = document.querySelector('#hint');
const controlButtons = [...document.querySelectorAll('[data-action]')];

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Game canvas was not found.');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b7e8fa');
scene.fog = new THREE.Fog('#ccecca', 8.5, 20);

const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 50);
camera.position.set(2.15, 4.2, 7.35);
camera.lookAt(0, 0.64, -0.95);

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
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tempQuaternion = new THREE.Quaternion();
const localZAxis = new THREE.Vector3(0, 0, 1);

const SLIME_HOME = Object.freeze({ x: 0.02, y: 0.02, z: 0.76 });
const TARGET_HOME = Object.freeze({ x: 0.46, y: 0.0, z: -0.90 });

const runtime = {
  slime: null,
  body: null,
  faceRoot: null,
  weaponAnchor: null,
  weaponBaseQuaternion: new THREE.Quaternion(),
  shadow: null,
  target: null,
  targetCap: null,
  slashArc: null,
  action: 'idle',
  actionStartedAt: 0,
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
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 22),
    createMaterial('#8bd266', 0.94),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.045, -3.2);
  grass.receiveShadow = true;
  scene.add(grass);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 19),
    createMaterial('#e7cd92', 0.98),
  );
  road.rotation.x = -Math.PI / 2;
  road.rotation.z = THREE.MathUtils.degToRad(-5);
  road.position.set(0.15, -0.032, -3.55);
  road.receiveShadow = true;
  scene.add(road);

  const roadEdgeMaterial = createMaterial('#c3ae75', 1);
  for (const side of [-1, 1]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 19), roadEdgeMaterial);
    edge.rotation.x = -Math.PI / 2;
    edge.rotation.z = THREE.MathUtils.degToRad(-5);
    edge.position.set(side * 2.23 + 0.15, -0.02, -3.55);
    edge.receiveShadow = true;
    scene.add(edge);
  }

  const fenceMaterial = createMaterial('#9c6b43', 0.93);
  const railMaterial = createMaterial('#b98558', 0.9);
  const postGeometry = new THREE.BoxGeometry(0.13, 0.7, 0.13);
  const railGeometry = new THREE.BoxGeometry(0.09, 0.11, 2.1);

  for (const side of [-1, 1]) {
    const x = side * 3.05;
    for (let z = -9; z <= 3; z += 2.05) {
      const post = new THREE.Mesh(postGeometry, fenceMaterial);
      post.position.set(x, 0.34, z);
      post.rotation.y = THREE.MathUtils.degToRad(4 * side);
      post.castShadow = true;
      scene.add(post);

      if (z < 3) {
        for (const y of [0.27, 0.48]) {
          const rail = new THREE.Mesh(railGeometry, railMaterial);
          rail.position.set(x, y, z + 1.0);
          rail.castShadow = true;
          scene.add(rail);
        }
      }
    }
  }

  const flowerColors = ['#fff6a8', '#ffffff', '#f6a3bd', '#b89cff'];
  const flowerMaterial = flowerColors.map((color) => createMaterial(color, 0.72));
  const stemMaterial = createMaterial('#4e9f52', 0.95);
  const stemGeometry = new THREE.CylinderGeometry(0.014, 0.018, 0.2, 6);
  const bloomGeometry = new THREE.SphereGeometry(0.06, 10, 8);
  const flowerSeeds = [
    [-3.7, 1.3, 0], [-3.45, 0.5, 2], [-3.8, -1.2, 1], [3.55, 1.6, 3],
    [3.7, -0.2, 1], [3.4, -2.1, 2], [-3.55, -3.2, 3], [3.6, -4.2, 0],
    [-3.8, -5.5, 1], [3.55, -6.1, 2],
  ];

  for (const [x, z, colorIndex] of flowerSeeds) {
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(x, 0.1, z);
    stem.castShadow = true;
    scene.add(stem);

    const bloom = new THREE.Mesh(bloomGeometry, flowerMaterial[colorIndex]);
    bloom.scale.set(1.0, 0.55, 1.0);
    bloom.position.set(x, 0.23, z);
    bloom.castShadow = true;
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

  const sun = new THREE.DirectionalLight('#fff5d7', 4.1);
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

function createContactShadow() {
  const material = new THREE.MeshBasicMaterial({
    color: '#25462e',
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.56, 40), material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(SLIME_HOME.x, 0.012, SLIME_HOME.z + 0.01);
  shadow.scale.set(1.26, 0.68, 1);
  scene.add(shadow);
  runtime.shadow = shadow;
}

function createTarget() {
  const target = new THREE.Group();
  target.name = 'TrainingMushroom';
  target.position.set(TARGET_HOME.x, TARGET_HOME.y, TARGET_HOME.z);

  const stem = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.18, 0.22, 5, 12),
    createMaterial('#f4e7c2', 0.75),
  );
  stem.position.y = 0.24;
  stem.castShadow = true;
  target.add(stem);

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
    createMaterial('#ea765d', 0.56),
  );
  cap.scale.set(1.1, 0.62, 1.0);
  cap.position.y = 0.49;
  cap.castShadow = true;
  target.add(cap);

  const eyeMaterial = createMaterial('#392b32', 0.72);
  for (const x of [-0.11, 0.11]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), eyeMaterial);
    eye.scale.set(1, 1, 0.55);
    eye.position.set(x, 0.38, 0.19);
    target.add(eye);
  }

  target.scale.setScalar(0.64);
  scene.add(target);
  runtime.target = target;
  runtime.targetCap = cap;
}

function createSlashArc() {
  const material = new THREE.MeshBasicMaterial({
    color: '#fff2ad',
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.042, 8, 48, Math.PI * 1.05),
    material,
  );
  arc.position.set(0.14, 0.58, -0.12);
  arc.rotation.set(0.08, 0.05, -0.42);
  arc.scale.setScalar(0.85);
  arc.visible = false;
  scene.add(arc);
  runtime.slashArc = arc;
}

function setMorph(name, value) {
  const { body } = runtime;
  if (!body?.morphTargetDictionary || !body.morphTargetInfluences) {
    return;
  }
  const index = body.morphTargetDictionary[name];
  if (index === undefined) {
    return;
  }
  body.morphTargetInfluences[index] = clamp01(value);
}

function clearMorphs() {
  runtime.body?.morphTargetInfluences?.fill(0);
}

function setWeaponSwing(angle, lift = 0) {
  if (!runtime.weaponAnchor) {
    return;
  }
  tempQuaternion.setFromAxisAngle(localZAxis, angle);
  runtime.weaponAnchor.quaternion.copy(runtime.weaponBaseQuaternion).multiply(tempQuaternion);
  runtime.weaponAnchor.position.y = lift;
}

function resetTarget() {
  if (!runtime.target) {
    return;
  }
  runtime.target.position.set(TARGET_HOME.x, TARGET_HOME.y, TARGET_HOME.z);
  runtime.target.rotation.set(0, 0, 0);
  runtime.target.scale.setScalar(0.64);
}

function applyTargetImpact(strength) {
  if (!runtime.target) {
    return;
  }
  const impact = clamp01(strength);
  runtime.target.position.z = TARGET_HOME.z - impact * 0.12;
  runtime.target.rotation.z = -impact * 0.12;
  runtime.target.scale.set(0.64 * (1 + impact * 0.08), 0.64 * (1 - impact * 0.15), 0.64);
}

function applySecondaryMotion({ squash = 0, stretch = 0, jump = 0, lean = 0, impact = 0 }) {
  const { faceRoot, shadow } = runtime;
  const faceX = 1 + squash * 0.05 - stretch * 0.018;
  const faceY = 1 - squash * 0.045 + stretch * 0.032;

  if (faceRoot) {
    faceRoot.scale.set(faceX, faceY, 1);
    faceRoot.rotation.z = lean * 0.02;
  }

  if (shadow && runtime.slime) {
    const airborne = clamp01(jump / 0.45);
    const airScale = THREE.MathUtils.lerp(1, 0.62, airborne);
    const landingBoost = 1 + impact * 0.22;
    shadow.position.x = runtime.slime.position.x;
    shadow.position.z = runtime.slime.position.z + 0.01;
    shadow.scale.set(1.26 * airScale * landingBoost, 0.68 * airScale * landingBoost, 1);
    shadow.material.opacity = THREE.MathUtils.lerp(0.24, 0.085, airborne) + impact * 0.045;
  }
}

function setActiveControl(action) {
  for (const button of controlButtons) {
    button.classList.toggle('is-active', button.dataset.action === action);
  }
}

function triggerAction(action) {
  if (!runtime.slime) {
    return;
  }
  runtime.action = action;
  runtime.actionStartedAt = clock.elapsedTime;
  resetTarget();
  setActiveControl(action);
  hintElement?.classList.add('is-hidden');
}

function finishAction(now) {
  runtime.action = 'idle';
  runtime.actionStartedAt = now;
  runtime.slime?.position.set(SLIME_HOME.x, SLIME_HOME.y, SLIME_HOME.z);
  if (runtime.slime) {
    runtime.slime.rotation.z = 0;
  }
  setWeaponSwing(0, 0);
  resetTarget();
  if (runtime.slashArc) {
    runtime.slashArc.visible = false;
    runtime.slashArc.material.opacity = 0;
  }
  setActiveControl('idle');
}

function animateIdle(now) {
  if (!runtime.slime) {
    return;
  }
  const breathe = 0.5 + 0.5 * Math.sin(now * 2.3);
  const leanWave = Math.sin(now * 1.25);
  const squash = 0.03 * breathe;
  const stretch = 0.018 * (1 - breathe);

  setMorph('Squash', squash);
  setMorph('Stretch', stretch);
  if (leanWave < 0) {
    setMorph('LeanLeft', Math.abs(leanWave) * 0.045);
  } else {
    setMorph('LeanRight', leanWave * 0.045);
  }

  runtime.slime.position.set(SLIME_HOME.x, SLIME_HOME.y, SLIME_HOME.z);
  runtime.slime.rotation.z = leanWave * 0.004;
  setWeaponSwing(leanWave * 0.018, Math.max(0, leanWave) * 0.003);
  applySecondaryMotion({ squash, stretch, jump: 0, lean: leanWave * 0.2, impact: 0 });
}

function animateHop(now) {
  if (!runtime.slime) {
    return;
  }

  const anticipation = runtime.reducedMotion ? 0.09 : 0.13;
  const launchVelocity = runtime.reducedMotion ? 2.9 : 3.6;
  const gravity = runtime.reducedMotion ? 15.5 : 15.5;
  const flight = (2 * launchVelocity) / gravity;
  const settle = runtime.reducedMotion ? 0.18 : 0.31;
  const elapsed = now - runtime.actionStartedAt;
  const duration = anticipation + flight + settle;

  if (elapsed >= duration) {
    finishAction(now);
    return;
  }

  let squash = 0;
  let stretch = 0;
  let jump = 0;
  let lean = 0;
  let impact = 0;

  if (elapsed < anticipation) {
    const p = elapsed / anticipation;
    squash = easeOutCubic(p) * 0.82;
    lean = -0.18 * p;
  } else if (elapsed < anticipation + flight) {
    const t = elapsed - anticipation;
    jump = Math.max(0, launchVelocity * t - 0.5 * gravity * t * t);
    const velocity = launchVelocity - gravity * t;
    const upward = clamp01(velocity / launchVelocity);
    stretch = 0.58 * upward + 0.14 * clamp01(-velocity / launchVelocity);
    lean = 0.12 * (1 - t / flight);
  } else {
    const p = (elapsed - anticipation - flight) / settle;
    impact = Math.exp(-7.5 * p);
    const spring = Math.sin(p * Math.PI * 4.4) * Math.exp(-4.3 * p);
    squash = impact * 0.98 + Math.max(0, -spring) * 0.24;
    stretch = Math.max(0, spring) * 0.38;
    lean = -spring * 0.12;
  }

  setMorph('Squash', squash);
  setMorph('Stretch', stretch);
  if (lean < 0) {
    setMorph('LeanLeft', Math.abs(lean));
  } else {
    setMorph('LeanRight', lean);
  }

  runtime.slime.position.set(SLIME_HOME.x, SLIME_HOME.y + jump, SLIME_HOME.z);
  runtime.slime.rotation.z = lean * 0.04;
  setWeaponSwing(lean * 0.22, jump * 0.035);
  applySecondaryMotion({ squash, stretch, jump, lean, impact });
}

function animateTackle(now) {
  if (!runtime.slime) {
    return;
  }

  const duration = runtime.reducedMotion ? 0.58 : 0.88;
  const u = (now - runtime.actionStartedAt) / duration;
  if (u >= 1) {
    finishAction(now);
    return;
  }

  const attackZ = SLIME_HOME.z - 0.72;
  const attackX = SLIME_HOME.x + 0.20;
  let z = SLIME_HOME.z;
  let squash = 0;
  let stretch = 0;
  let lean = 0;
  let impact = 0;

  if (u < 0.20) {
    const p = u / 0.20;
    squash = easeOutCubic(p) * 0.72;
    z = SLIME_HOME.z + 0.07 * easeInCubic(p);
    lean = -0.25 * p;
  } else if (u < 0.47) {
    const p = (u - 0.20) / 0.27;
    z = THREE.MathUtils.lerp(SLIME_HOME.z + 0.07, attackZ, easeOutCubic(p));
    stretch = Math.sin(p * Math.PI) * 0.48;
    lean = THREE.MathUtils.lerp(-0.25, 0.42, p);
  } else if (u < 0.61) {
    const p = (u - 0.47) / 0.14;
    z = attackZ;
    impact = Math.sin(p * Math.PI);
    squash = 0.88 * impact;
    setMorph('HitRight', 0.72 * impact);
    applyTargetImpact(impact);
  } else if (u < 0.80) {
    const p = (u - 0.61) / 0.19;
    z = THREE.MathUtils.lerp(attackZ, SLIME_HOME.z + 0.08, easeOutCubic(p));
    stretch = Math.sin(p * Math.PI) * 0.2;
    lean = 0.3 * (1 - p);
    applyTargetImpact(1 - p);
  } else {
    const p = (u - 0.80) / 0.20;
    z = THREE.MathUtils.lerp(SLIME_HOME.z + 0.08, SLIME_HOME.z, easeInOutCubic(p));
    const spring = Math.sin(p * Math.PI * 2.6) * Math.exp(-3.8 * p);
    squash = Math.max(0, -spring) * 0.28;
    stretch = Math.max(0, spring) * 0.22;
  }

  setMorph('Squash', squash);
  setMorph('Stretch', stretch);
  if (lean < 0) {
    setMorph('LeanLeft', Math.abs(lean));
  } else {
    setMorph('LeanRight', lean);
  }

  const lungeRatio = clamp01((SLIME_HOME.z - z) / (SLIME_HOME.z - attackZ));
  const x = THREE.MathUtils.lerp(SLIME_HOME.x, attackX, lungeRatio);
  runtime.slime.position.set(x, SLIME_HOME.y, z);
  runtime.slime.rotation.z = lean * 0.055;
  setWeaponSwing(lean * 0.18, 0);
  applySecondaryMotion({ squash, stretch, jump: 0, lean, impact });
}

function animateSlash(now) {
  if (!runtime.slime) {
    return;
  }

  const duration = runtime.reducedMotion ? 0.62 : 0.96;
  const u = (now - runtime.actionStartedAt) / duration;
  if (u >= 1) {
    finishAction(now);
    return;
  }

  let z = SLIME_HOME.z;
  let squash = 0;
  let stretch = 0;
  let lean = 0;
  let weaponAngle = 0;
  let targetImpact = 0;

  if (u < 0.24) {
    const p = u / 0.24;
    squash = easeOutCubic(p) * 0.34;
    lean = -0.3 * p;
    weaponAngle = THREE.MathUtils.lerp(0, -0.82, easeInOutCubic(p));
  } else if (u < 0.48) {
    const p = (u - 0.24) / 0.24;
    z = THREE.MathUtils.lerp(SLIME_HOME.z, SLIME_HOME.z - 0.22, easeOutCubic(p));
    stretch = Math.sin(p * Math.PI) * 0.22;
    lean = THREE.MathUtils.lerp(-0.3, 0.48, p);
    weaponAngle = THREE.MathUtils.lerp(-0.82, 1.22, easeOutCubic(p));

    if (runtime.slashArc) {
      runtime.slashArc.visible = true;
      runtime.slashArc.material.opacity = Math.sin(p * Math.PI) * 0.82;
      runtime.slashArc.scale.setScalar(0.76 + p * 0.34);
      runtime.slashArc.rotation.z = -0.65 + p * 1.15;
    }

    if (p > 0.56) {
      targetImpact = Math.sin(((p - 0.56) / 0.44) * Math.PI) * 0.75;
      applyTargetImpact(targetImpact);
    }
  } else if (u < 0.70) {
    const p = (u - 0.48) / 0.22;
    z = SLIME_HOME.z - 0.22;
    lean = 0.48 * (1 - p);
    weaponAngle = THREE.MathUtils.lerp(1.22, 0.78, easeInOutCubic(p));
    targetImpact = (1 - p) * 0.42;
    applyTargetImpact(targetImpact);
    if (runtime.slashArc) {
      runtime.slashArc.visible = true;
      runtime.slashArc.material.opacity = (1 - p) * 0.36;
    }
  } else {
    const p = (u - 0.70) / 0.30;
    z = THREE.MathUtils.lerp(SLIME_HOME.z - 0.22, SLIME_HOME.z, easeInOutCubic(p));
    weaponAngle = THREE.MathUtils.lerp(0.78, 0, easeInOutCubic(p));
    const spring = Math.sin(p * Math.PI * 2.4) * Math.exp(-4.0 * p);
    squash = Math.max(0, -spring) * 0.2;
    stretch = Math.max(0, spring) * 0.16;
    if (runtime.slashArc) {
      runtime.slashArc.material.opacity = 0;
      runtime.slashArc.visible = false;
    }
  }

  setMorph('Squash', squash);
  setMorph('Stretch', stretch);
  if (lean < 0) {
    setMorph('LeanLeft', Math.abs(lean));
  } else {
    setMorph('LeanRight', lean);
  }

  const slashAdvance = clamp01((SLIME_HOME.z - z) / 0.22);
  runtime.slime.position.set(SLIME_HOME.x + slashAdvance * 0.08, SLIME_HOME.y, z);
  runtime.slime.rotation.z = lean * 0.045;
  setWeaponSwing(weaponAngle, 0);
  applySecondaryMotion({ squash, stretch, jump: 0, lean, impact: targetImpact * 0.35 });
}

function updateAnimation(now) {
  if (!runtime.slime) {
    return;
  }
  clearMorphs();

  if (runtime.action === 'hop') {
    animateHop(now);
  } else if (runtime.action === 'tackle') {
    animateTackle(now);
  } else if (runtime.action === 'slash') {
    animateSlash(now);
  } else {
    animateIdle(now);
  }
}

function onPointerDown(event) {
  if (!runtime.slime) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  if (raycaster.intersectObject(runtime.slime, true).length > 0) {
    triggerAction('tackle');
  }
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

async function loadSlime() {
  const loader = new GLTFLoader();
  const modelUrl = `${import.meta.env.BASE_URL}assets/sword-slime.glb`;
  const gltf = await loader.loadAsync(modelUrl);
  const slime = gltf.scene;
  slime.name = 'SwordSlimeRuntime';
  slime.scale.setScalar(0.34);
  slime.position.set(SLIME_HOME.x, SLIME_HOME.y, SLIME_HOME.z);
  slime.rotation.y = THREE.MathUtils.degToRad(2);

  slime.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  runtime.slime = slime;
  runtime.body = slime.getObjectByName('Body');
  runtime.faceRoot = slime.getObjectByName('FaceRoot');
  runtime.weaponAnchor = slime.getObjectByName('WeaponAnchor');

  if (!runtime.body?.morphTargetDictionary) {
    throw new Error('Sword Slime GLB is missing expected morph targets.');
  }
  if (!runtime.weaponAnchor) {
    throw new Error('Sword Slime GLB is missing WeaponAnchor.');
  }

  runtime.weaponBaseQuaternion.copy(runtime.weaponAnchor.quaternion);
  scene.add(slime);
  loadingElement?.classList.add('is-hidden');
  runtime.actionStartedAt = clock.elapsedTime;

  const requestedAction = new URLSearchParams(window.location.search).get('action');
  if (['hop', 'tackle', 'slash'].includes(requestedAction)) {
    triggerAction(requestedAction);
  }
}

for (const button of controlButtons) {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action) {
      triggerAction(action);
    }
  });
}
canvas.addEventListener('pointerdown', onPointerDown, { passive: true });

createEnvironment();
createLighting();
createContactShadow();
createTarget();
createSlashArc();

loadSlime().catch((error) => {
  console.error(error);
  if (loadingElement) {
    loadingElement.textContent = 'Slime model failed to load.';
  }
});

function render() {
  requestAnimationFrame(render);
  resizeRenderer();
  updateAnimation(clock.getElapsedTime());
  renderer.render(scene, camera);
}

render();
