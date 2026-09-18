import * as THREE from 'three';

export type BattleEnvironmentId =
  | 'clover-road'
  | 'leaf-windway'
  | 'bloom-verge'
  | 'critter-grove'
  | 'deep-clover-hollow';

export type BattleEnvironmentFeature = 'clover' | 'leaf' | 'bloom' | 'grove' | 'hollow';
export type FenceMode = 'full' | 'broken' | 'none';

export interface BattleEnvironmentTheme {
  id: BattleEnvironmentId;
  stageNumber: number;
  feature: BattleEnvironmentFeature;
  skyColor: string;
  fogColor: string;
  groundColor: string;
  roadColor: string;
  roadEdgeColor: string;
  roadWidth: number;
  roadRotationDeg: number;
  fence: FenceMode;
  trunkColor: string;
  canopyColors: readonly [string, string];
  accentColors: readonly [string, string, string];
  hemisphereSkyColor: string;
  hemisphereGroundColor: string;
  hemisphereIntensity: number;
  sunColor: string;
  sunIntensity: number;
}

const THEMES: readonly BattleEnvironmentTheme[] = [
  {
    id: 'clover-road',
    stageNumber: 1,
    feature: 'clover',
    skyColor: '#b7e8fa',
    fogColor: '#ccecca',
    groundColor: '#8bd266',
    roadColor: '#e7cd92',
    roadEdgeColor: '#c3ae75',
    roadWidth: 4.8,
    roadRotationDeg: -4,
    fence: 'full',
    trunkColor: '#8b6547',
    canopyColors: ['#5ebc60', '#76c968'],
    accentColors: ['#fff6a8', '#f6a3bd', '#b89cff'],
    hemisphereSkyColor: '#eaf9ff',
    hemisphereGroundColor: '#709d4e',
    hemisphereIntensity: 2,
    sunColor: '#fff5d7',
    sunIntensity: 4,
  },
  {
    id: 'leaf-windway',
    stageNumber: 2,
    feature: 'leaf',
    skyColor: '#b9ebdc',
    fogColor: '#c7e9c7',
    groundColor: '#76c65d',
    roadColor: '#d9c985',
    roadEdgeColor: '#a9a56a',
    roadWidth: 4.65,
    roadRotationDeg: -2,
    fence: 'broken',
    trunkColor: '#806246',
    canopyColors: ['#45aa58', '#7ac75d'],
    accentColors: ['#9bdb68', '#5fbd66', '#d8e878'],
    hemisphereSkyColor: '#e7fff5',
    hemisphereGroundColor: '#5e9148',
    hemisphereIntensity: 2.05,
    sunColor: '#fff3c9',
    sunIntensity: 4.05,
  },
  {
    id: 'bloom-verge',
    stageNumber: 3,
    feature: 'bloom',
    skyColor: '#c9ebef',
    fogColor: '#d6ebcf',
    groundColor: '#83ca6c',
    roadColor: '#e4c895',
    roadEdgeColor: '#c09a72',
    roadWidth: 4.55,
    roadRotationDeg: 1.5,
    fence: 'broken',
    trunkColor: '#86664d',
    canopyColors: ['#65b863', '#8cca6f'],
    accentColors: ['#ffd4df', '#fff1a6', '#c9b2ff'],
    hemisphereSkyColor: '#eefcff',
    hemisphereGroundColor: '#718e55',
    hemisphereIntensity: 2.05,
    sunColor: '#fff0d6',
    sunIntensity: 4.1,
  },
  {
    id: 'critter-grove',
    stageNumber: 4,
    feature: 'grove',
    skyColor: '#a9d8c5',
    fogColor: '#b8d5ad',
    groundColor: '#5fa85b',
    roadColor: '#c8ad78',
    roadEdgeColor: '#927650',
    roadWidth: 4.4,
    roadRotationDeg: 2.5,
    fence: 'none',
    trunkColor: '#76533e',
    canopyColors: ['#3f8f50', '#66a853'],
    accentColors: ['#d89d55', '#9b7650', '#78945e'],
    hemisphereSkyColor: '#ddf3e8',
    hemisphereGroundColor: '#4f7047',
    hemisphereIntensity: 1.95,
    sunColor: '#ffe7bd',
    sunIntensity: 3.9,
  },
  {
    id: 'deep-clover-hollow',
    stageNumber: 5,
    feature: 'hollow',
    skyColor: '#86b6ae',
    fogColor: '#89aa91',
    groundColor: '#477f50',
    roadColor: '#aa8d64',
    roadEdgeColor: '#715b45',
    roadWidth: 4.25,
    roadRotationDeg: 0,
    fence: 'none',
    trunkColor: '#604738',
    canopyColors: ['#2f6f45', '#477f4e'],
    accentColors: ['#f6cf85', '#d59ad7', '#85c6b1'],
    hemisphereSkyColor: '#cbe9e6',
    hemisphereGroundColor: '#39583f',
    hemisphereIntensity: 1.85,
    sunColor: '#ffe2ae',
    sunIntensity: 3.65,
  },
];

export interface BattleEnvironmentRuntime {
  theme: BattleEnvironmentTheme;
  sceneryRoot: THREE.Group;
}

export function getBattleEnvironmentTheme(stageNumber: number): BattleEnvironmentTheme {
  const normalizedStage = Number.isFinite(stageNumber) ? Math.floor(stageNumber) : 1;
  const index = Math.min(THEMES.length - 1, Math.max(0, normalizedStage - 1));
  return THEMES[index]!;
}

export function getBattleWaveSceneryPhase(waveIndex: number): number {
  return Math.max(0, Math.floor(waveIndex)) * 0.72;
}

function material(color: string, roughness = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function wrapRoadsideZ(z: number, wavePhase: number): number {
  let value = z + wavePhase;
  while (value > 3.2) value -= 12.4;
  while (value < -9.2) value += 12.4;
  return value;
}

function addTree(
  root: THREE.Group,
  theme: BattleEnvironmentTheme,
  x: number,
  z: number,
  size: number,
  variant: number,
): void {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13 * size, 0.19 * size, 1.15 * size, 7),
    material(theme.trunkColor, 0.98),
  );
  trunk.position.set(x, 0.56 * size, z);
  trunk.castShadow = true;
  root.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.82 * size, 1),
    material(theme.canopyColors[variant % theme.canopyColors.length]!, 0.9),
  );
  canopy.scale.set(1.1, 0.9, 1);
  canopy.position.set(x, 1.48 * size, z);
  canopy.castShadow = true;
  root.add(canopy);

  if (theme.feature === 'hollow') {
    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.62 * size, 1),
      material(theme.canopyColors[(variant + 1) % theme.canopyColors.length]!, 0.9),
    );
    crown.scale.set(1.25, 0.65, 1);
    crown.position.set(x + (x < 0 ? 0.28 : -0.28) * size, 1.92 * size, z - 0.12);
    crown.castShadow = true;
    root.add(crown);
  }
}

function addFence(root: THREE.Group, theme: BattleEnvironmentTheme, wavePhase: number): void {
  if (theme.fence === 'none') return;
  const postGeometry = new THREE.BoxGeometry(0.12, 0.64, 0.12);
  const railGeometry = new THREE.BoxGeometry(0.08, 0.095, 1.9);
  const postMaterial = material(theme.trunkColor, 0.96);
  const railMaterial = material(theme.feature === 'bloom' ? '#ae7d5f' : '#b98558', 0.92);

  for (const side of [-1, 1]) {
    const x = side * 3.2;
    let sequence = 0;
    for (let baseZ = -9; baseZ <= 3; baseZ += 1.9) {
      const z = wrapRoadsideZ(baseZ, wavePhase);
      const omitted = theme.fence === 'broken' && sequence % 3 === (side > 0 ? 1 : 2);
      sequence += 1;
      if (omitted) continue;
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(x, 0.31, z);
      post.castShadow = true;
      root.add(post);

      for (const y of [0.24, 0.43]) {
        const rail = new THREE.Mesh(railGeometry, railMaterial);
        rail.position.set(x, y, z + 0.9);
        rail.castShadow = true;
        root.add(rail);
      }
    }
  }
}

function addFlower(root: THREE.Group, theme: BattleEnvironmentTheme, x: number, z: number, colorIndex: number, size = 1): void {
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012 * size, 0.016 * size, 0.18 * size, 6),
    material('#4d9151', 0.98),
  );
  stem.position.set(x, 0.09 * size, z);
  root.add(stem);

  const bloom = new THREE.Mesh(
    new THREE.SphereGeometry(0.052 * size, 7, 5),
    material(theme.accentColors[colorIndex % theme.accentColors.length]!, 0.76),
  );
  bloom.scale.set(1.15, 0.55, 1);
  bloom.position.set(x, 0.21 * size, z);
  root.add(bloom);
}

function addLeafTuft(root: THREE.Group, theme: BattleEnvironmentTheme, x: number, z: number, size: number, direction: number): void {
  const leafMaterial = material(theme.accentColors[Math.abs(direction) % theme.accentColors.length]!, 0.88);
  for (const side of [-1, 1]) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16 * size, 7, 5), leafMaterial);
    leaf.scale.set(0.52, 1.35, 0.32);
    leaf.rotation.z = side * 0.55 + direction * 0.08;
    leaf.position.set(x + side * 0.09 * size, 0.17 * size, z);
    root.add(leaf);
  }
}

function addLog(root: THREE.Group, theme: BattleEnvironmentTheme, x: number, z: number, size: number): void {
  const log = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15 * size, 0.18 * size, 0.9 * size, 8),
    material(theme.trunkColor, 1),
  );
  log.rotation.z = Math.PI / 2;
  log.rotation.y = x < 0 ? 0.18 : -0.18;
  log.position.set(x, 0.16 * size, z);
  log.castShadow = true;
  root.add(log);
}

function addStone(root: THREE.Group, theme: BattleEnvironmentTheme, x: number, z: number, size: number): void {
  const stone = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.2 * size, 1),
    material(theme.accentColors[2], 1),
  );
  stone.scale.set(1.2, 0.62, 0.85);
  stone.position.set(x, 0.11 * size, z);
  stone.castShadow = true;
  root.add(stone);
}

function addHollowMushroom(root: THREE.Group, theme: BattleEnvironmentTheme, x: number, z: number, size: number, colorIndex: number): void {
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055 * size, 0.075 * size, 0.32 * size, 7),
    material('#ded2b6', 0.92),
  );
  stem.position.set(x, 0.16 * size, z);
  root.add(stem);

  const color = theme.accentColors[colorIndex % theme.accentColors.length]!;
  const capMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0,
    emissive: color,
    emissiveIntensity: 0.16,
  });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16 * size, 9, 6), capMaterial);
  cap.scale.set(1.35, 0.48, 1.05);
  cap.position.set(x, 0.36 * size, z);
  root.add(cap);
}

function addFeatureProps(
  root: THREE.Group,
  theme: BattleEnvironmentTheme,
  wavePhase: number,
): void {
  if (theme.feature === 'clover') {
    const seeds: Array<[number, number, number]> = [
      [-3.7, 1.3, 0], [-3.45, 0.5, 1], [-3.8, -1.2, 2], [3.55, 1.6, 1],
      [3.7, -0.2, 0], [3.4, -2.1, 2], [-3.55, -3.2, 1], [3.6, -4.2, 0],
    ];
    seeds.forEach(([x, z, color], index) => addFlower(root, theme, x, wrapRoadsideZ(z, wavePhase), color, index % 3 === 0 ? 1.15 : 1));
    return;
  }

  if (theme.feature === 'leaf') {
    const seeds: Array<[number, number, number, number]> = [
      [-3.5, 1.5, 1, -1], [3.45, 0.9, 0.95, 1], [-3.8, -0.7, 1.1, 1],
      [3.55, -1.9, 1.2, -1], [-3.5, -3.5, 1, -1], [3.75, -4.8, 1.1, 1],
      [-3.65, -6.1, 1.15, 1], [3.45, -7.5, 0.95, -1],
    ];
    seeds.forEach(([x, z, size, direction]) => addLeafTuft(root, theme, x, wrapRoadsideZ(z, wavePhase), size, direction));
    return;
  }

  if (theme.feature === 'bloom') {
    const seeds: Array<[number, number, number]> = [
      [-3.3, 1.6, 0], [-3.65, 1.1, 1], [-3.35, 0.5, 2], [3.35, 1.2, 2],
      [3.68, 0.55, 0], [3.42, -0.1, 1], [-3.5, -2.4, 1], [-3.72, -3.0, 2],
      [3.45, -3.6, 0], [3.72, -4.3, 2], [-3.4, -5.8, 0], [3.5, -7.1, 1],
    ];
    seeds.forEach(([x, z, color], index) => addFlower(root, theme, x, wrapRoadsideZ(z, wavePhase), color, index % 4 === 0 ? 1.45 : 1.2));
    return;
  }

  if (theme.feature === 'grove') {
    addLog(root, theme, -3.55, wrapRoadsideZ(-1.4, wavePhase), 1.1);
    addLog(root, theme, 3.6, wrapRoadsideZ(-5.4, wavePhase), 0.9);
    [
      [-3.2, 0.8, 1], [3.3, -0.8, 0.8], [-3.5, -3.6, 1.15], [3.25, -7.2, 0.95],
    ].forEach(([x, z, size]) => addStone(root, theme, x!, wrapRoadsideZ(z!, wavePhase), size!));
    return;
  }

  [
    [-3.45, 1.15, 1.15, 0], [3.5, 0.1, 1.05, 1], [-3.55, -2.8, 1.25, 2],
    [3.55, -5.4, 1.2, 0], [-3.4, -7.8, 1, 1],
  ].forEach(([x, z, size, color]) => addHollowMushroom(root, theme, x!, wrapRoadsideZ(z!, wavePhase), size!, color!));
  addStone(root, theme, -3.05, wrapRoadsideZ(-4.8, wavePhase), 1.25);
  addStone(root, theme, 3.15, wrapRoadsideZ(-7.0, wavePhase), 1.1);
}

function addTrees(root: THREE.Group, theme: BattleEnvironmentTheme, wavePhase: number): void {
  const treeSets: Readonly<Record<BattleEnvironmentFeature, readonly [number, number, number, number][]>> = {
    clover: [
      [-4.8, -4.2, 1, 0], [4.65, -6.4, 1.25, 1], [-4.4, -8.0, 1.35, 0],
    ],
    leaf: [
      [-4.25, 1.0, 1.0, 0], [4.2, -1.2, 1.1, 1], [-4.55, -4.1, 1.3, 1], [4.5, -7.0, 1.4, 0],
    ],
    bloom: [
      [-4.7, -2.5, 1.15, 1], [4.7, -5.8, 1.3, 0], [-4.45, -8.3, 1.4, 1],
    ],
    grove: [
      [-4.1, 1.1, 1.15, 0], [4.05, 0.0, 1.2, 1], [-4.45, -2.7, 1.45, 1],
      [4.35, -4.2, 1.35, 0], [-4.55, -6.7, 1.55, 0], [4.5, -8.6, 1.5, 1],
    ],
    hollow: [
      [-3.9, 1.0, 1.35, 0], [3.9, 0.5, 1.4, 1], [-4.15, -1.9, 1.55, 1],
      [4.05, -3.0, 1.65, 0], [-4.25, -5.0, 1.7, 0], [4.2, -6.2, 1.75, 1],
      [-4.1, -8.1, 1.85, 1], [4.05, -8.8, 1.8, 0],
    ],
  };
  for (const [x, z, size, variant] of treeSets[theme.feature]) {
    addTree(root, theme, x, wrapRoadsideZ(z, wavePhase), size, variant);
  }
}

export function createBattleEnvironment(
  scene: THREE.Scene,
  stageNumber: number,
  waveIndex: number,
): BattleEnvironmentRuntime {
  const theme = getBattleEnvironmentTheme(stageNumber);
  const wavePhase = getBattleWaveSceneryPhase(waveIndex);

  scene.background = new THREE.Color(theme.skyColor);
  scene.fog = new THREE.Fog(theme.fogColor, theme.feature === 'hollow' ? 7.8 : 9, theme.feature === 'hollow' ? 19 : 22);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 22), material(theme.groundColor, 0.96));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.045, -3.2);
  ground.receiveShadow = true;
  scene.add(ground);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(theme.roadWidth, 20), material(theme.roadColor, 0.99));
  road.rotation.x = -Math.PI / 2;
  road.rotation.z = THREE.MathUtils.degToRad(theme.roadRotationDeg);
  road.position.set(0.08, -0.032, -3.75);
  road.receiveShadow = true;
  scene.add(road);

  const edgeMaterial = material(theme.roadEdgeColor, 1);
  for (const side of [-1, 1]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 20), edgeMaterial);
    edge.rotation.x = -Math.PI / 2;
    edge.rotation.z = road.rotation.z;
    edge.position.set(side * (theme.roadWidth / 2 - 0.02) + 0.08, -0.02, -3.75);
    scene.add(edge);
  }

  const sceneryRoot = new THREE.Group();
  sceneryRoot.name = 'BattleScenery:' + theme.id;
  scene.add(sceneryRoot);
  addFence(sceneryRoot, theme, wavePhase);
  addFeatureProps(sceneryRoot, theme, wavePhase);
  addTrees(sceneryRoot, theme, wavePhase);

  scene.add(new THREE.HemisphereLight(theme.hemisphereSkyColor, theme.hemisphereGroundColor, theme.hemisphereIntensity));
  const sun = new THREE.DirectionalLight(theme.sunColor, theme.sunIntensity);
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

  return { theme, sceneryRoot };
}
