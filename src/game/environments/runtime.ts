import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import {
  getStageEnvironmentDefinition,
  placementIntrudesCombatClearZone,
  type EnvironmentLayer,
  type StageEnvironmentDefinition,
} from './catalog';

export type StageEnvironmentRuntime = Readonly<{
  areaId: string;
  stageNumber: number;
  root: THREE.Group;
  sceneryRoot: THREE.Group;
  activate: () => void;
  setTravelDistance: (distance: number) => void;
  setWaveIndex: (waveIndex: number) => void;
  dispose: () => void;
}>;

function disposeObjectResources(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const entries = Array.isArray(object.material) ? object.material : [object.material];
    entries.forEach((entry) => materials.add(entry));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function wrapZ(value: number, min: number, max: number): number {
  const span = max - min;
  let wrapped = value;
  while (wrapped > max) wrapped -= span;
  while (wrapped < min) wrapped += span;
  return wrapped;
}

function groundMaterial(definition: StageEnvironmentDefinition): THREE.MeshStandardMaterial {
  const roughness =
    definition.groundMode === 'water' ? 0.82
      : definition.groundMode === 'snow' ? 0.90
        : definition.groundMode === 'stone' ? 0.93
          : 0.97;
  return new THREE.MeshStandardMaterial({
    color: definition.groundColor,
    roughness,
    metalness: 0,
  });
}

function makeGround(definition: StageEnvironmentDefinition): THREE.Group {
  const group = new THREE.Group();
  group.name = 'StageGround';

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 22), groundMaterial(definition));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.045, -3.2);
  ground.receiveShadow = true;
  group.add(ground);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(definition.roadWidth, 20),
    new THREE.MeshStandardMaterial({
      color: definition.roadColor,
      roughness: definition.groundMode === 'water' ? 0.92 : 0.99,
      metalness: 0,
    }),
  );
  road.rotation.x = -Math.PI / 2;
  road.rotation.z = THREE.MathUtils.degToRad(definition.roadRotationDeg);
  road.position.set(0.06, -0.032, -3.75);
  road.receiveShadow = true;
  group.add(road);

  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: definition.roadEdgeColor,
    roughness: 1,
    metalness: 0,
  });
  for (const side of [-1, 1]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 20), edgeMaterial);
    edge.rotation.x = -Math.PI / 2;
    edge.rotation.z = road.rotation.z;
    edge.position.set(side * (definition.roadWidth / 2 - 0.02) + 0.06, -0.02, -3.75);
    group.add(edge);
  }

  // Small low-contrast flecks keep the corridor from reading as one flat rectangle.
  const fleckGeometry = new THREE.CircleGeometry(0.045, 7);
  const fleckMaterial = new THREE.MeshStandardMaterial({
    color: definition.roadEdgeColor,
    roughness: 1,
    metalness: 0,
  });
  const seeds: readonly [number, number, number][] = [
    [-1.25, 1.55, 0.70], [0.72, 0.75, 0.52], [-0.30, -0.35, 0.60],
    [1.32, -1.10, 0.48], [-0.92, -2.05, 0.55], [0.38, -3.10, 0.68],
    [1.15, -4.30, 0.50], [-1.42, -5.40, 0.56], [0.76, -6.65, 0.62],
    [-0.68, -7.80, 0.48],
  ];
  for (const [x, z, scale] of seeds) {
    const fleck = new THREE.Mesh(fleckGeometry, fleckMaterial);
    fleck.rotation.x = -Math.PI / 2;
    fleck.scale.set(1.65 * scale, 0.72 * scale, 1);
    fleck.position.set(x, -0.008, z);
    group.add(fleck);
  }

  return group;
}

function layerTravelFactor(layer: EnvironmentLayer): number {
  if (layer === 'near') return 1;
  if (layer === 'mid') return 0.62;
  return 0.18;
}

export function resolveStageSceneryZ(
  baseZ: number,
  layer: EnvironmentLayer,
  waveIndex: number,
  travelDistance: number,
): number {
  const factor = layerTravelFactor(layer);
  const min = layer === 'far' ? -14.5 : -10.8;
  const max = layer === 'far' ? 5.5 : 4.8;
  return wrapZ(
    baseZ + Math.max(0, Math.floor(waveIndex)) * 0.72 * factor + Math.max(0, travelDistance) * factor,
    min,
    max,
  );
}

export async function createStageEnvironment(
  scene: THREE.Scene,
  baseUrl: string,
  areaId: string,
  stageNumber: number,
  waveIndex: number,
): Promise<StageEnvironmentRuntime> {
  const definition = getStageEnvironmentDefinition(areaId, stageNumber);
  if (definition === null) throw new Error(`No stage environment authored for ${areaId}`);

  const intrusions = definition.placements.filter(placementIntrudesCombatClearZone);
  if (intrusions.length > 0) {
    const first = intrusions[0]!;
    throw new Error(`Environment prop intrudes combat clear zone: ${first.node}@${first.x},${first.z}`);
  }

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(`${baseUrl}${definition.asset}`);
  const kitRoot = gltf.scene.getObjectByName('EnvironmentKitRoot');
  if (kitRoot === undefined) {
    disposeObjectResources(gltf.scene);
    throw new Error(`${definition.areaName} environment kit has no EnvironmentKitRoot`);
  }

  const templates = new Map<string, THREE.Object3D>();
  for (const child of kitRoot.children) templates.set(child.name, child);

  const requiredNodes = new Set(definition.placements.map((placement) => placement.node));
  for (const node of requiredNodes) {
    if (templates.has(node)) continue;
    disposeObjectResources(gltf.scene);
    throw new Error(`${definition.areaName} environment kit missing ${node}`);
  }

  const environmentRoot = new THREE.Group();
  environmentRoot.name = `StageEnvironment:${definition.areaSlug}:${definition.stageNumber}`;
  environmentRoot.add(makeGround(definition));

  const sceneryRoot = new THREE.Group();
  sceneryRoot.name = `BattleScenery:${definition.areaSlug}`;
  environmentRoot.add(sceneryRoot);

  const layerRoots: Record<EnvironmentLayer, THREE.Group> = {
    near: new THREE.Group(),
    mid: new THREE.Group(),
    far: new THREE.Group(),
  };
  layerRoots.near.name = 'SceneryNear';
  layerRoots.mid.name = 'SceneryMid';
  layerRoots.far.name = 'SceneryFar';
  sceneryRoot.add(layerRoots.far, layerRoots.mid, layerRoots.near);

  const entries: Array<{
    root: THREE.Object3D;
    baseZ: number;
    layer: EnvironmentLayer;
  }> = [];

  for (const placement of definition.placements) {
    const source = templates.get(placement.node)!;
    const clone = source.clone(true);
    clone.position.set(placement.x, 0, placement.z);
    clone.rotation.y = placement.rotationY;
    clone.scale.setScalar(placement.scale);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    layerRoots[placement.layer].add(clone);
    entries.push({ root: clone, baseZ: placement.z, layer: placement.layer });
  }

  environmentRoot.add(new THREE.HemisphereLight(
    definition.hemisphereSkyColor,
    definition.hemisphereGroundColor,
    definition.hemisphereIntensity,
  ));
  const sun = new THREE.DirectionalLight(definition.sunColor, definition.sunIntensity);
  sun.position.set(-4.2, 7.2, 5.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 18;
  sun.shadow.camera.left = -5;
  sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5;
  sun.shadow.camera.bottom = -5;
  environmentRoot.add(sun);

  let currentWaveIndex = Math.max(0, Math.floor(waveIndex));
  let travelDistance = 0;
  let active = false;
  let disposed = false;

  const applySceneryPositions = () => {
    for (const entry of entries) {
      entry.root.position.z = resolveStageSceneryZ(
        entry.baseZ,
        entry.layer,
        currentWaveIndex,
        travelDistance,
      );
    }
  };
  applySceneryPositions();

  const activate = () => {
    if (disposed || active) return;
    active = true;
    scene.background = new THREE.Color(definition.skyColor);
    scene.fog = new THREE.Fog(definition.fogColor, definition.fogNear, definition.fogFar);
    scene.add(environmentRoot);
  };

  const setTravelDistance = (distance: number) => {
    if (disposed) return;
    travelDistance = Math.max(0, distance);
    applySceneryPositions();
  };

  const setWaveIndex = (index: number) => {
    if (disposed) return;
    currentWaveIndex = Math.max(0, Math.floor(index));
    applySceneryPositions();
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (active) scene.remove(environmentRoot);
    disposeObjectResources(environmentRoot);
  };

  return {
    areaId: definition.areaId,
    stageNumber: definition.stageNumber,
    root: environmentRoot,
    sceneryRoot,
    activate,
    setTravelDistance,
    setWaveIndex,
    dispose,
  };
}
