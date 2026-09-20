export type EnvironmentLayer = 'near' | 'mid' | 'far';

export type EnvironmentPlacement = Readonly<{
  node: string;
  x: number;
  z: number;
  scale: number;
  rotationY: number;
  layer: EnvironmentLayer;
}>;

export type StageEnvironmentDefinition = Readonly<{
  areaId: EnvironmentAreaId;
  areaSlug: string;
  areaName: string;
  stageNumber: number;
  stageName: string;
  asset: string;
  groundMode: 'grass' | 'forest' | 'rock' | 'water' | 'snow' | 'charcoal' | 'stone';
  skyColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  groundColor: string;
  roadColor: string;
  roadEdgeColor: string;
  roadWidth: number;
  roadRotationDeg: number;
  hemisphereSkyColor: string;
  hemisphereGroundColor: string;
  hemisphereIntensity: number;
  sunColor: string;
  sunIntensity: number;
  placements: readonly EnvironmentPlacement[];
}>;

export const ENVIRONMENT_AREA_IDS = [
  'area.clover-road',
  'area.mushroom-forest',
  'area.amber-mine',
  'area.sunken-marsh',
  'area.frost-ruins',
  'area.ember-canyon',
  'area.moonlit-castle',
  'area.dragon-crater',
] as const;

export type EnvironmentAreaId = typeof ENVIRONMENT_AREA_IDS[number];

type AreaPalette = Readonly<{
  sky: readonly [string, string, string, string, string];
  fog: readonly [string, string, string, string, string];
  ground: readonly [string, string, string, string, string];
  road: readonly [string, string, string, string, string];
  roadEdge: string;
  hemiSky: string;
  hemiGround: string;
  sun: string;
}>;

type AreaEnvironmentSpec = Readonly<{
  id: EnvironmentAreaId;
  slug: string;
  name: string;
  groundMode: StageEnvironmentDefinition['groundMode'];
  asset: string;
  stageNames: readonly [string, string, string, string, string];
  palette: AreaPalette;
  stageNodes: readonly [
    readonly string[],
    readonly string[],
    readonly string[],
    readonly string[],
    readonly string[],
  ];
  landmark: string;
  baseRoadWidth: number;
  roadNarrowing: number;
  roadRotationDeg: number;
  fogNear: readonly [number, number];
  fogFar: readonly [number, number];
  hemiIntensity: readonly [number, number];
  sunIntensity: readonly [number, number];
}>;

const SLOTS: readonly Readonly<{
  x: number;
  z: number;
  layer: EnvironmentLayer;
  rotationY: number;
  scale: number;
}>[] = [
  { x: -3.18, z: 1.35, layer: 'near', rotationY: 0.12, scale: 0.94 },
  { x: 3.26, z: 0.05, layer: 'near', rotationY: -0.22, scale: 0.92 },
  { x: -3.34, z: -2.95, layer: 'mid', rotationY: 0.34, scale: 0.98 },
  { x: 3.38, z: -4.35, layer: 'mid', rotationY: -0.36, scale: 0.92 },
  { x: -4.25, z: -6.10, layer: 'far', rotationY: 0.14, scale: 1.28 },
  { x: 4.34, z: -7.35, layer: 'far', rotationY: -0.16, scale: 1.34 },
] as const;

const SCALE_BY_NODE: Readonly<Record<string, number>> = {
  Prop_CloverPatch: 0.95,
  Prop_FlowerCluster: 0.90,
  Prop_FenceSection: 1.02,
  Prop_RoadSign: 0.94,
  Prop_FallenLog: 1.02,
  Prop_RoundTree: 1.16,
  Prop_StonePatch: 0.96,
  Prop_MushroomCluster: 0.94,
  Prop_BroadCap: 0.94,
  Prop_Fern: 0.92,
  Prop_RootArch: 0.96,
  Prop_Stump: 0.94,
  Prop_GlowMushroom: 0.90,
  Prop_DeepTree: 1.18,
  Prop_AmberCrystal: 0.92,
  Prop_MineTimber: 1.02,
  Prop_MineCart: 0.88,
  Prop_RailSection: 0.94,
  Prop_Lantern: 0.96,
  Prop_Rubble: 0.96,
  Prop_RockPillar: 1.12,
  Prop_LilyPad: 0.98,
  Prop_Reeds: 0.96,
  Prop_BubbleVent: 0.90,
  Prop_SunkenColumn: 1.06,
  Prop_BridgeChunk: 1.00,
  Prop_MossRock: 0.98,
  Prop_DeadTree: 1.12,
  Prop_SnowDrift: 1.04,
  Prop_IceCrystal: 0.94,
  Prop_RuinColumn: 1.04,
  Prop_FrozenLantern: 0.98,
  Prop_TornBanner: 0.98,
  Prop_IcicleCluster: 0.94,
  Prop_SnowRock: 0.96,
  Prop_BasaltColumn: 1.08,
  Prop_LavaCrack: 0.96,
  Prop_CharcoalRock: 0.96,
  Prop_SteamVent: 0.90,
  Prop_BurntStake: 0.98,
  Prop_CraterStone: 0.92,
  Prop_EmberShrub: 0.90,
  Prop_WallFragment: 1.05,
  Prop_MoonLamp: 0.96,
  Prop_Banner: 0.96,
  Prop_KnightStatue: 1.02,
  Prop_WindowArch: 1.06,
  Prop_GatePost: 1.02,
  Prop_CobblePile: 0.96,
  Prop_Obsidian: 0.96,
  Prop_StarCrystal: 0.94,
  Prop_LavaVent: 0.92,
  Prop_EggShell: 0.94,
  Prop_ClawMark: 0.96,
  Prop_RockSpire: 1.08,
  Prop_AncientScaleStone: 1.00,
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function buildPlacements(spec: AreaEnvironmentSpec, stageIndex: number): readonly EnvironmentPlacement[] {
  const nodes = spec.stageNodes[stageIndex]!;
  const placements = nodes.map((node, index) => {
    const slot = SLOTS[index % SLOTS.length]!;
    return {
      node,
      x: slot.x,
      z: slot.z,
      scale: slot.scale * (SCALE_BY_NODE[node] ?? 1),
      rotationY: slot.rotationY,
      layer: slot.layer,
    } satisfies EnvironmentPlacement;
  });

  if (stageIndex === 4) {
    placements.push({
      node: spec.landmark,
      x: 0.30,
      z: -8.85,
      scale: spec.id === 'area.dragon-crater' ? 1.36 : 1.42,
      rotationY: spec.id === 'area.moonlit-castle' ? 0.04 : -0.05,
      layer: 'far',
    });
  }
  return placements;
}

const AREA_SPECS: Readonly<Record<EnvironmentAreaId, AreaEnvironmentSpec>> = {
  'area.clover-road': {
    id: 'area.clover-road',
    slug: 'clover-road',
    name: 'クローバー街道',
    groundMode: 'grass',
    asset: 'assets/environments/clover-road-kit.glb',
    stageNames: ['春の入口', 'そよ風の小径', '花咲く道', '木立の奥', 'クローバー門'],
    palette: {
      sky: ['#b7e8fa', '#b9ebdc', '#c9ebef', '#a9d8c5', '#8fbfb3'],
      fog: ['#ccecca', '#c7e9c7', '#d6ebcf', '#b8d5ad', '#99bda1'],
      ground: ['#8bd266', '#76c65d', '#83ca6c', '#5fa85b', '#4f9155'],
      road: ['#e7cd92', '#d9c985', '#e4c895', '#c8ad78', '#b59a70'],
      roadEdge: '#9b8458',
      hemiSky: '#eaf9ff',
      hemiGround: '#557744',
      sun: '#fff1cf',
    },
    stageNodes: [
      ['Prop_CloverPatch', 'Prop_FenceSection', 'Prop_FlowerCluster', 'Prop_RoundTree', 'Prop_CloverPatch', 'Prop_RoundTree'],
      ['Prop_FenceSection', 'Prop_CloverPatch', 'Prop_RoadSign', 'Prop_FlowerCluster', 'Prop_RoundTree', 'Prop_RoundTree'],
      ['Prop_FlowerCluster', 'Prop_CloverPatch', 'Prop_FenceSection', 'Prop_FlowerCluster', 'Prop_RoundTree', 'Prop_RoundTree'],
      ['Prop_FallenLog', 'Prop_StonePatch', 'Prop_CloverPatch', 'Prop_RoadSign', 'Prop_RoundTree', 'Prop_RoundTree'],
      ['Prop_CloverPatch', 'Prop_StonePatch', 'Prop_FallenLog', 'Prop_FlowerCluster', 'Prop_RoundTree', 'Prop_RoundTree'],
    ],
    landmark: 'Landmark_CloverGate',
    baseRoadWidth: 4.80,
    roadNarrowing: 0.45,
    roadRotationDeg: -2.2,
    fogNear: [9.0, 8.0],
    fogFar: [22.0, 19.5],
    hemiIntensity: [2.00, 1.82],
    sunIntensity: [4.00, 3.60],
  },
  'area.mushroom-forest': {
    id: 'area.mushroom-forest',
    slug: 'mushroom-forest',
    name: 'キノコの森',
    groundMode: 'forest',
    asset: 'assets/environments/mushroom-forest-kit.glb',
    stageNames: ['森の入口', '菌糸の小径', '根の木立', '光る窪地', '大キノコの空洞'],
    palette: {
      sky: ['#9ad6cf', '#90cec6', '#80bdb8', '#6ca5a5', '#5b9196'],
      fog: ['#afcfbb', '#a3c4b2', '#91b2a6', '#799b96', '#678a8a'],
      ground: ['#4f8f66', '#46845e', '#3d7657', '#34674f', '#2c5a48'],
      road: ['#c9b985', '#c1ae7e', '#b49f78', '#a89373', '#99856d'],
      roadEdge: '#73685b',
      hemiSky: '#d8f2ee',
      hemiGround: '#334f43',
      sun: '#f4e6c4',
    },
    stageNodes: [
      ['Prop_MushroomCluster', 'Prop_Fern', 'Prop_MushroomCluster', 'Prop_DeepTree', 'Prop_DeepTree', 'Prop_DeepTree'],
      ['Prop_MushroomCluster', 'Prop_BroadCap', 'Prop_MushroomCluster', 'Prop_BroadCap', 'Prop_DeepTree', 'Prop_DeepTree'],
      ['Prop_RootArch', 'Prop_Stump', 'Prop_FallenLog', 'Prop_RootArch', 'Prop_DeepTree', 'Prop_DeepTree'],
      ['Prop_GlowMushroom', 'Prop_RootArch', 'Prop_GlowMushroom', 'Prop_Stump', 'Prop_DeepTree', 'Prop_DeepTree'],
      ['Prop_GlowMushroom', 'Prop_BroadCap', 'Prop_Stump', 'Prop_GlowMushroom', 'Prop_DeepTree', 'Prop_DeepTree'],
    ],
    landmark: 'Landmark_HollowTree',
    baseRoadWidth: 4.55,
    roadNarrowing: 0.30,
    roadRotationDeg: -1.5,
    fogNear: [7.6, 6.8],
    fogFar: [20.5, 18.5],
    hemiIntensity: [1.90, 1.78],
    sunIntensity: [3.55, 3.30],
  },
  'area.amber-mine': {
    id: 'area.amber-mine',
    slug: 'amber-mine',
    name: '琥珀鉱山',
    groundMode: 'rock',
    asset: 'assets/environments/amber-mine-kit.glb',
    stageNames: ['坑口', '鉱車道', '支柱坑', '深部鉱床', '巨大琥珀脈'],
    palette: {
      sky: ['#758492', '#667888', '#586c7e', '#4c6074', '#3f5268'],
      fog: ['#8a876f', '#797863', '#686a5a', '#585d53', '#4c5350'],
      ground: ['#7b6548', '#705b42', '#64513d', '#594737', '#4e3e33'],
      road: ['#9a8059', '#8e744f', '#816849', '#745d42', '#67513b'],
      roadEdge: '#4c4238',
      hemiSky: '#b8c8d5',
      hemiGround: '#40372f',
      sun: '#ffd39a',
    },
    stageNodes: [
      ['Prop_AmberCrystal', 'Prop_MineTimber', 'Prop_Rubble', 'Prop_RockPillar', 'Prop_RockPillar', 'Prop_MineTimber'],
      ['Prop_RailSection', 'Prop_MineCart', 'Prop_AmberCrystal', 'Prop_Rubble', 'Prop_MineTimber', 'Prop_RockPillar'],
      ['Prop_MineTimber', 'Prop_Lantern', 'Prop_RailSection', 'Prop_AmberCrystal', 'Prop_RockPillar', 'Prop_MineTimber'],
      ['Prop_AmberCrystal', 'Prop_RockPillar', 'Prop_Lantern', 'Prop_Rubble', 'Prop_AmberCrystal', 'Prop_RockPillar'],
      ['Prop_Lantern', 'Prop_AmberCrystal', 'Prop_RailSection', 'Prop_Rubble', 'Prop_RockPillar', 'Prop_MineTimber'],
    ],
    landmark: 'Landmark_AmberVein',
    baseRoadWidth: 4.35,
    roadNarrowing: 0.35,
    roadRotationDeg: 1.0,
    fogNear: [7.2, 6.4],
    fogFar: [18.5, 16.8],
    hemiIntensity: [1.70, 1.50],
    sunIntensity: [3.10, 2.75],
  },
  'area.sunken-marsh': {
    id: 'area.sunken-marsh',
    slug: 'sunken-marsh',
    name: '沈み沼',
    groundMode: 'water',
    asset: 'assets/environments/sunken-marsh-kit.glb',
    stageNames: ['沼の縁', 'ハスの浅瀬', '沈んだ橋', '深い湿地', '水没遺跡門'],
    palette: {
      sky: ['#9ac9c0', '#8fc0b9', '#80b3ae', '#70a4a1', '#609493'],
      fog: ['#a5c0ad', '#98b5a4', '#89a99b', '#789b90', '#698b83'],
      ground: ['#4f8f87', '#47857f', '#3f7975', '#376d6a', '#30615f'],
      road: ['#7f8f82', '#77877c', '#6e7d74', '#65736b', '#5c6963'],
      roadEdge: '#46564f',
      hemiSky: '#d0ece6',
      hemiGround: '#3b5c4c',
      sun: '#e7e0bb',
    },
    stageNodes: [
      ['Prop_LilyPad', 'Prop_Reeds', 'Prop_MossRock', 'Prop_DeadTree', 'Prop_DeadTree', 'Prop_Reeds'],
      ['Prop_LilyPad', 'Prop_Reeds', 'Prop_BubbleVent', 'Prop_MossRock', 'Prop_DeadTree', 'Prop_DeadTree'],
      ['Prop_BridgeChunk', 'Prop_SunkenColumn', 'Prop_LilyPad', 'Prop_Reeds', 'Prop_DeadTree', 'Prop_SunkenColumn'],
      ['Prop_BubbleVent', 'Prop_MossRock', 'Prop_SunkenColumn', 'Prop_DeadTree', 'Prop_DeadTree', 'Prop_Reeds'],
      ['Prop_SunkenColumn', 'Prop_BubbleVent', 'Prop_BridgeChunk', 'Prop_MossRock', 'Prop_DeadTree', 'Prop_DeadTree'],
    ],
    landmark: 'Landmark_SunkenGate',
    baseRoadWidth: 4.40,
    roadNarrowing: 0.30,
    roadRotationDeg: 0.5,
    fogNear: [7.5, 6.6],
    fogFar: [19.5, 17.5],
    hemiIntensity: [1.82, 1.62],
    sunIntensity: [3.15, 2.82],
  },
  'area.frost-ruins': {
    id: 'area.frost-ruins',
    slug: 'frost-ruins',
    name: '氷雪遺跡',
    groundMode: 'snow',
    asset: 'assets/environments/frost-ruins-kit.glb',
    stageNames: ['雪原入口', '氷晶の道', '崩れた回廊', '凍てつく聖域', '凍結神殿門'],
    palette: {
      sky: ['#c3e6ed', '#b6dce7', '#a7d0dd', '#96c1d2', '#84afc3'],
      fog: ['#d7e9e9', '#ccdfe2', '#bfd3d8', '#b0c5cd', '#9fb5c0'],
      ground: ['#e8f0ef', '#dfe9e9', '#d5e1e3', '#cbd9dc', '#c0d0d5'],
      road: ['#9baab4', '#929faa', '#8995a1', '#808b98', '#77818f'],
      roadEdge: '#697784',
      hemiSky: '#effcff',
      hemiGround: '#647684',
      sun: '#f5f1dc',
    },
    stageNodes: [
      ['Prop_SnowDrift', 'Prop_IceCrystal', 'Prop_SnowRock', 'Prop_RuinColumn', 'Prop_RuinColumn', 'Prop_SnowDrift'],
      ['Prop_IceCrystal', 'Prop_SnowDrift', 'Prop_FrozenLantern', 'Prop_SnowRock', 'Prop_RuinColumn', 'Prop_IceCrystal'],
      ['Prop_RuinColumn', 'Prop_TornBanner', 'Prop_SnowDrift', 'Prop_IcicleCluster', 'Prop_RuinColumn', 'Prop_RuinColumn'],
      ['Prop_IcicleCluster', 'Prop_FrozenLantern', 'Prop_IceCrystal', 'Prop_SnowRock', 'Prop_RuinColumn', 'Prop_IceCrystal'],
      ['Prop_FrozenLantern', 'Prop_IceCrystal', 'Prop_TornBanner', 'Prop_SnowRock', 'Prop_RuinColumn', 'Prop_IcicleCluster'],
    ],
    landmark: 'Landmark_FrozenTempleGate',
    baseRoadWidth: 4.50,
    roadNarrowing: 0.25,
    roadRotationDeg: -0.8,
    fogNear: [8.4, 7.4],
    fogFar: [21.5, 19.0],
    hemiIntensity: [2.05, 1.85],
    sunIntensity: [3.80, 3.35],
  },
  'area.ember-canyon': {
    id: 'area.ember-canyon',
    slug: 'ember-canyon',
    name: '灼熱峡谷',
    groundMode: 'charcoal',
    asset: 'assets/environments/ember-canyon-kit.glb',
    stageNames: ['焦げた入口', '溶岩割れ道', '噴気峡', '炉心斜面', '溶岩滝'],
    palette: {
      sky: ['#8e7183', '#846779', '#795d70', '#6e5368', '#62485f'],
      fog: ['#8b6d6a', '#7f625f', '#735856', '#664e4e', '#5a4548'],
      ground: ['#6a4032', '#60382f', '#56312c', '#4c2b29', '#422526'],
      road: ['#795443', '#6e493d', '#634039', '#583835', '#4d3031'],
      roadEdge: '#372a2c',
      hemiSky: '#c7a5b4',
      hemiGround: '#4b2d28',
      sun: '#ffb56e',
    },
    stageNodes: [
      ['Prop_BasaltColumn', 'Prop_CharcoalRock', 'Prop_BurntStake', 'Prop_EmberShrub', 'Prop_BasaltColumn', 'Prop_CharcoalRock'],
      ['Prop_LavaCrack', 'Prop_BasaltColumn', 'Prop_CharcoalRock', 'Prop_CraterStone', 'Prop_BasaltColumn', 'Prop_BasaltColumn'],
      ['Prop_SteamVent', 'Prop_BurntStake', 'Prop_LavaCrack', 'Prop_BasaltColumn', 'Prop_BasaltColumn', 'Prop_CharcoalRock'],
      ['Prop_CraterStone', 'Prop_LavaCrack', 'Prop_SteamVent', 'Prop_CharcoalRock', 'Prop_BasaltColumn', 'Prop_BasaltColumn'],
      ['Prop_LavaCrack', 'Prop_CraterStone', 'Prop_CharcoalRock', 'Prop_SteamVent', 'Prop_BasaltColumn', 'Prop_BasaltColumn'],
    ],
    landmark: 'Landmark_LavaFall',
    baseRoadWidth: 4.30,
    roadNarrowing: 0.28,
    roadRotationDeg: 1.2,
    fogNear: [7.5, 6.6],
    fogFar: [19.0, 17.0],
    hemiIntensity: [1.72, 1.52],
    sunIntensity: [3.55, 3.20],
  },
  'area.moonlit-castle': {
    id: 'area.moonlit-castle',
    slug: 'moonlit-castle',
    name: '月夜の城',
    groundMode: 'stone',
    asset: 'assets/environments/moonlit-castle-kit.glb',
    stageNames: ['外壁前', '月灯の道', '兵舎跡', '王城回廊', '月冠門'],
    palette: {
      sky: ['#303b63', '#2a345b', '#252e52', '#202849', '#1b2241'],
      fog: ['#535d78', '#4c566f', '#454f67', '#3e485f', '#374157'],
      ground: ['#4b5264', '#454c5e', '#3f4658', '#394052', '#343a4c'],
      road: ['#777f8e', '#707887', '#69717f', '#626a78', '#5b6371'],
      roadEdge: '#464d5a',
      hemiSky: '#9faad0',
      hemiGround: '#2d3140',
      sun: '#d7dcff',
    },
    stageNodes: [
      ['Prop_WallFragment', 'Prop_MoonLamp', 'Prop_CobblePile', 'Prop_GatePost', 'Prop_WallFragment', 'Prop_WallFragment'],
      ['Prop_MoonLamp', 'Prop_Banner', 'Prop_WallFragment', 'Prop_WindowArch', 'Prop_GatePost', 'Prop_WallFragment'],
      ['Prop_KnightStatue', 'Prop_Banner', 'Prop_CobblePile', 'Prop_WindowArch', 'Prop_WallFragment', 'Prop_GatePost'],
      ['Prop_WindowArch', 'Prop_KnightStatue', 'Prop_MoonLamp', 'Prop_Banner', 'Prop_GatePost', 'Prop_WallFragment'],
      ['Prop_KnightStatue', 'Prop_MoonLamp', 'Prop_Banner', 'Prop_WindowArch', 'Prop_GatePost', 'Prop_WallFragment'],
    ],
    landmark: 'Landmark_MoonCrownGate',
    baseRoadWidth: 4.45,
    roadNarrowing: 0.20,
    roadRotationDeg: 0.0,
    fogNear: [8.0, 7.2],
    fogFar: [20.0, 18.0],
    hemiIntensity: [1.62, 1.48],
    sunIntensity: [2.75, 2.45],
  },
  'area.dragon-crater': {
    id: 'area.dragon-crater',
    slug: 'dragon-crater',
    name: '竜の火口',
    groundMode: 'charcoal',
    asset: 'assets/environments/dragon-crater-kit.glb',
    stageNames: ['黒岩の入口', '星晶地帯', '孵化跡', '火口縁', '星の祭壇'],
    palette: {
      sky: ['#47345f', '#403057', '#392b50', '#322648', '#2b2141'],
      fog: ['#5f4d67', '#57465f', '#4f3f58', '#473950', '#403349'],
      ground: ['#302831', '#2b242d', '#272029', '#221c25', '#1e1922'],
      road: ['#51404b', '#493944', '#41333e', '#392d38', '#322832'],
      roadEdge: '#241f29',
      hemiSky: '#8672ad',
      hemiGround: '#211b25',
      sun: '#cfa7ff',
    },
    stageNodes: [
      ['Prop_Obsidian', 'Prop_RockSpire', 'Prop_AncientScaleStone', 'Prop_ClawMark', 'Prop_RockSpire', 'Prop_Obsidian'],
      ['Prop_StarCrystal', 'Prop_Obsidian', 'Prop_RockSpire', 'Prop_LavaVent', 'Prop_RockSpire', 'Prop_StarCrystal'],
      ['Prop_EggShell', 'Prop_StarCrystal', 'Prop_ClawMark', 'Prop_AncientScaleStone', 'Prop_RockSpire', 'Prop_Obsidian'],
      ['Prop_LavaVent', 'Prop_RockSpire', 'Prop_StarCrystal', 'Prop_ClawMark', 'Prop_RockSpire', 'Prop_Obsidian'],
      ['Prop_StarCrystal', 'Prop_LavaVent', 'Prop_AncientScaleStone', 'Prop_Obsidian', 'Prop_RockSpire', 'Prop_RockSpire'],
    ],
    landmark: 'Landmark_StarAltar',
    baseRoadWidth: 4.20,
    roadNarrowing: 0.20,
    roadRotationDeg: -0.5,
    fogNear: [7.4, 6.5],
    fogFar: [18.5, 16.5],
    hemiIntensity: [1.58, 1.42],
    sunIntensity: [2.85, 2.50],
  },
};

export function isEnvironmentAreaId(value: string): value is EnvironmentAreaId {
  return (ENVIRONMENT_AREA_IDS as readonly string[]).includes(value);
}

export function getEnvironmentAreaMetadata(areaId: string): Readonly<{
  id: EnvironmentAreaId;
  slug: string;
  name: string;
  stageNames: readonly [string, string, string, string, string];
}> | null {
  if (!isEnvironmentAreaId(areaId)) return null;
  const spec = AREA_SPECS[areaId];
  return { id: spec.id, slug: spec.slug, name: spec.name, stageNames: spec.stageNames };
}

export function getStageEnvironmentDefinition(areaId: string, stageNumber: number): StageEnvironmentDefinition | null {
  if (!isEnvironmentAreaId(areaId)) return null;
  const spec = AREA_SPECS[areaId];
  const index = Math.min(4, Math.max(0, Number.isFinite(stageNumber) ? Math.floor(stageNumber) - 1 : 0));
  const progress = index / 4;

  return {
    areaId: spec.id,
    areaSlug: spec.slug,
    areaName: spec.name,
    stageNumber: index + 1,
    stageName: spec.stageNames[index]!,
    asset: spec.asset,
    groundMode: spec.groundMode,
    skyColor: spec.palette.sky[index]!,
    fogColor: spec.palette.fog[index]!,
    fogNear: lerp(spec.fogNear[0], spec.fogNear[1], progress),
    fogFar: lerp(spec.fogFar[0], spec.fogFar[1], progress),
    groundColor: spec.palette.ground[index]!,
    roadColor: spec.palette.road[index]!,
    roadEdgeColor: spec.palette.roadEdge,
    roadWidth: spec.baseRoadWidth - spec.roadNarrowing * progress,
    roadRotationDeg: spec.roadRotationDeg,
    hemisphereSkyColor: spec.palette.hemiSky,
    hemisphereGroundColor: spec.palette.hemiGround,
    hemisphereIntensity: lerp(spec.hemiIntensity[0], spec.hemiIntensity[1], progress),
    sunColor: spec.palette.sun,
    sunIntensity: lerp(spec.sunIntensity[0], spec.sunIntensity[1], progress),
    placements: buildPlacements(spec, index),
  };
}

export function placementIntrudesCombatClearZone(placement: EnvironmentPlacement): boolean {
  if (placement.layer === 'far') return false;
  return placement.z > -4.8 && placement.z < 2.8 && Math.abs(placement.x) < 2.65;
}
