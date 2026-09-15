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
camera.lookAt(0, 0.72, -1.05);

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

const runtime = {
  slime: null,
  body: null,
  faceRoot: null,
  highlightRoot: null,
  shadow: null,
  action: 'idle',
  actionStartedAt: 0,
  nextAutoHopAt: 3.1,
  settleToIdle: false,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

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
    const edge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 19),
      roadEdgeMaterial,
    );
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

    const canopy = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.85 * size, 2),
      canopyMaterial,
    );
    canopy.scale.set(1.1, 0.92, 1.0);
    canopy.position.set(x, 1.55 * size, z);
    canopy.castShadow = true;
    scene.add(canopy);
  }
}

function createLighting() {
  const hemisphere = new THREE.HemisphereLight('#eaf9ff', '#709d4e', 2.0);
  scene.add(hemisphere);

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
    opacity: 0.23,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.78, 40), material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.012, 0.02);
  shadow.scale.set(1.3, 0.72, 1);
  scene.add(shadow);
  runtime.shadow = shadow;
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
  body.morphTargetInfluences[index] = THREE.MathUtils.clamp(value, 0, 1);
}

function clearMorphs() {
  if (!runtime.body?.morphTargetInfluences) {
    return;
  }
  runtime.body.morphTargetInfluences.fill(0);
}

function applySecondaryMotion({ squash = 0, stretch = 0, jump = 0, lean = 0 }) {
  const { faceRoot, highlightRoot, shadow } = runtime;
  const faceX = 1 + squash * 0.045 - stretch * 0.02;
  const faceY = 1 - squash * 0.055 + stretch * 0.04;

  if (faceRoot) {
    faceRoot.scale.set(faceX, faceY, 1);
    faceRoot.rotation.z = lean * 0.025;
  }

  if (highlightRoot) {
    highlightRoot.scale.set(
      1 + squash * 0.08 - stretch * 0.035,
      1 - squash * 0.1 + stretch * 0.07,
      1,
    );
    highlightRoot.rotation.z = lean * 0.04;
  }

  if (shadow) {
    const airborne = THREE.MathUtils.clamp(jump / 0.72, 0, 1);
    const scale = THREE.MathUtils.lerp(1, 0.66, airborne);
    shadow.scale.set(1.3 * scale, 0.72 * scale, 1);
    shadow.material.opacity = THREE.MathUtils.lerp(0.23, 0.1, airborne);
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
  runtime.settleToIdle = action !== 'idle';
  setActiveControl(action);
  hintElement?.classList.add('is-hidden');
}

function finishAction(now) {
  runtime.action = 'idle';
  runtime.actionStartedAt = now;
  runtime.settleToIdle = false;
  runtime.nextAutoHopAt = now + 3.15;
  setActiveControl('idle');
}

function animateIdle(now) {
  if (!runtime.slime) {
    return;
  }
  const wave = Math.sin(now * 2.7);
  const breathe = 0.5 + 0.5 * wave;
  const leanWave = Math.sin(now * 1.35);
  const squash = 0.055 * breathe;
  const stretch = 0.045 * (1 - breathe);

  setMorph('Squash', squash);
  setMorph('Stretch', stretch);
  if (leanWave < 0) {
    setMorph('LeanLeft', Math.abs(leanWave) * 0.09);
  } else {
    setMorph('LeanRight', leanWave * 0.09);
  }

  runtime.slime.position.y = 0.03 + Math.max(0, wave) * 0.018;
  runtime.slime.rotation.z = leanWave * 0.009;
  applySecondaryMotion({ squash, stretch, jump: 0, lean: leanWave });
}

function animateHop(now) {
  if (!runtime.slime) {
    return;
  }
  const duration = runtime.reducedMotion ? 0.75 : 1.08;
  const u = (now - runtime.actionStartedAt) / duration;
  if (u >= 1) {
    runtime.slime.position.y = 0.03;
    runtime.slime.rotation.z = 0;
    finishAction(now);
    return;
  }

  let squash = 0;
  let stretch = 0;
  let jump = 0;
  let lean = 0;

  if (u < 0.17) {
    const p = u / 0.17;
    squash = Math.sin(p * Math.PI * 0.5) * 0.9;
    lean = -0.2 * p;
  } else if (u < 0.38) {
    const p = (u - 0.17) / 0.21;
    stretch = Math.sin(p * Math.PI) * 0.82;
    jump = THREE.MathUtils.lerp(0.02, 0.57, Math.sin(p * Math.PI * 0.5));
    lean = THREE.MathUtils.lerp(-0.2, 0.2, p);
  } else if (u < 0.68) {
    const p = (u - 0.38) / 0.3;
    jump = 0.57 + Math.sin(p * Math.PI) * 0.13;
    stretch = 0.2 * (1 - p);
    lean = 0.2 * (1 - p);
  } else if (u < 0.82) {
    const p = (u - 0.68) / 0.14;
    jump = THREE.MathUtils.lerp(0.57, 0.0, p * p);
    squash = Math.sin(p * Math.PI * 0.5);
    lean = 0.12;
  } else {
    const p = (u - 0.82) / 0.18;
    const spring = Math.sin(p * Math.PI * 3.2) * Math.exp(-3.2 * p);
    if (spring >= 0) {
      stretch = spring * 0.42;
    } else {
      squash = -spring * 0.34;
    }
    lean = -spring * 0.16;
  }

  setMorph('Squash', squash);
  setMorph('Stretch', stretch);
  if (lean < 0) {
    setMorph('LeanLeft', Math.abs(lean));
  } else {
    setMorph('LeanRight', lean);
  }

  runtime.slime.position.y = 0.03 + jump;
  runtime.slime.rotation.z = lean * 0.045;
  applySecondaryMotion({ squash, stretch, jump, lean });
}

function animateHit(now) {
  if (!runtime.slime) {
    return;
  }
  const duration = runtime.reducedMotion ? 0.45 : 0.68;
  const u = (now - runtime.actionStartedAt) / duration;
  if (u >= 1) {
    runtime.slime.position.y = 0.03;
    runtime.slime.rotation.z = 0;
    finishAction(now);
    return;
  }

  const primary = Math.sin(Math.min(1, u / 0.5) * Math.PI) * (1 - u * 0.28);
  const rebound = u > 0.5
    ? Math.sin(((u - 0.5) / 0.5) * Math.PI) * (1 - u) * 0.48
    : 0;
  const squash = Math.sin(u * Math.PI) * 0.24;

  setMorph('HitRight', primary);
  setMorph('HitLeft', rebound);
  setMorph('Squash', squash);
  runtime.slime.rotation.z = -primary * 0.08 + rebound * 0.05;
  runtime.slime.position.y = 0.03 + Math.sin(u * Math.PI) * 0.03;
  applySecondaryMotion({ squash, stretch: 0, jump: 0, lean: primary - rebound });
}

function updateAnimation(now) {
  if (!runtime.slime) {
    return;
  }
  clearMorphs();

  if (runtime.action === 'hop') {
    animateHop(now);
  } else if (runtime.action === 'hit') {
    animateHit(now);
  } else {
    animateIdle(now);
    if (!runtime.reducedMotion && now >= runtime.nextAutoHopAt) {
      triggerAction('hop');
    }
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

  const hits = raycaster.intersectObject(runtime.slime, true);
  if (hits.length > 0) {
    triggerAction('hop');
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
  const modelUrl = `${import.meta.env.BASE_URL}assets/plain-slime.glb`;
  const gltf = await loader.loadAsync(modelUrl);
  const slime = gltf.scene;
  slime.name = 'PlainSlimeRuntime';
  slime.scale.setScalar(0.72);
  slime.position.set(0, 0.03, 0.2);
  slime.rotation.y = THREE.MathUtils.degToRad(2);

  slime.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = object.name !== 'BodyHighlight';
      object.receiveShadow = true;
    }
  });

  runtime.slime = slime;
  runtime.body = slime.getObjectByName('Body');
  runtime.faceRoot = slime.getObjectByName('FaceRoot');
  runtime.highlightRoot = slime.getObjectByName('HighlightRoot');

  if (!runtime.body?.morphTargetDictionary) {
    throw new Error('Plain Slime GLB is missing expected morph targets.');
  }

  scene.add(slime);
  loadingElement?.classList.add('is-hidden');
  runtime.actionStartedAt = clock.elapsedTime;
  runtime.nextAutoHopAt = clock.elapsedTime + 2.8;
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

loadSlime().catch((error) => {
  console.error(error);
  if (loadingElement) {
    loadingElement.textContent = 'Slime model failed to load.';
  }
});

function render() {
  requestAnimationFrame(render);
  resizeRenderer();
  const now = clock.getElapsedTime();
  updateAnimation(now);
  renderer.render(scene, camera);
}

render();
