import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { isGreatswordRank } from './fusion';

export interface BattleSnapshot {
  phase: 'loading' | 'approach' | 'combat' | 'result';
  label: string;
  result: 'victory' | 'defeat' | null;
  enemyAlive: number;
  enemyHp: number;
  enemyMaxHp: number;
  swordHp: number;
  swordMaxHp: number;
  bowHp: number;
  bowMaxHp: number;
}

type AllyKind = 'Sword' | 'Bow';
type UnitState = 'idle' | 'defeat' | 'dead';

type MorphMesh = THREE.Mesh & {
  morphTargetDictionary?: Record<string, number>;
  morphTargetInfluences?: number[];
};

type BasicMaterial = THREE.MeshBasicMaterial;

type HealthBarGroup = THREE.Group & {
  userData: {
    fill?: THREE.Mesh;
    fillWidth?: number;
  };
};

interface AllyUnit {
  id: string;
  side: 'ally';
  kind: AllyKind;
  root: THREE.Group;
  body: MorphMesh;
  faceRoot: THREE.Object3D | null;
  equipmentAnchor: THREE.Object3D;
  weaponTip: THREE.Object3D | null;
  equipmentBaseQuaternion: THREE.Quaternion;
  equipmentBasePosition: THREE.Vector3;
  bodyBaseScale: THREE.Vector3;
  faceBasePosition: THREE.Vector3;
  shadow: THREE.Mesh<THREE.CircleGeometry, BasicMaterial>;
  healthBar: HealthBarGroup;
  home: THREE.Vector3;
  maxHp: number;
  hp: number;
  alive: boolean;
  state: UnitState;
  defeatStartedAt: number;
  hitStartedAt: number;
  normalEyes: THREE.Object3D[];
  xEyes: THREE.Object3D[];
}

interface EnemyUnit {
  id: string;
  side: 'enemy';
  kind: 'Mushroom';
  index: number;
  root: THREE.Group;
  shadow: THREE.Mesh<THREE.CircleGeometry, BasicMaterial>;
  home: THREE.Vector3;
  baseScale: number;
  maxHp: number;
  hp: number;
  alive: boolean;
  state: UnitState;
  defeatStartedAt: number;
  hitStartedAt: number;
  attackStartedAt: number;
  attackOrigin: THREE.Vector3;
  attackTarget: AllyUnit | null;
  attackHitApplied: boolean;
  nextAttackAt: number;
  lastUpdateAt: number;
}

interface ArrowRuntime {
  root: THREE.Group;
  start: THREE.Vector3;
  end: THREE.Vector3;
  target: EnemyUnit;
  startedAt: number;
  duration: number;
  hitApplied: boolean;
}

interface ImpactRuntime {
  group: THREE.Group;
  materials: THREE.MeshBasicMaterial[];
  startedAt: number;
  duration: number;
}

export interface BattleRuntimeOptions {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  baseUrl: string;
  swordAsset: string;
  onSnapshot: (snapshot: BattleSnapshot) => void;
  getSwordFusionRank: () => number;
}

const SCALE = 0.19;
const SWORD_HOME = new THREE.Vector3(-0.24, 0.02, 1.2);
const BOW_HOME = new THREE.Vector3(0.3, 0.02, 1.38);
const SWORD_ATTACK_POS = new THREE.Vector3(-0.02, 0.02, -0.8);
const ENEMY_SPAWNS = [
  new THREE.Vector3(-0.3, 0, -1.38),
  new THREE.Vector3(0.12, 0, -1.55),
  new THREE.Vector3(0.44, 0, -1.3),
];
const TARGET_HOME = ENEMY_SPAWNS[1];
const ENEMY_MAX_HP = 4;
const SWORD_MAX_HP = 6;
const BOW_MAX_HP = 4;
const ENEMY_ATTACK_RANGE = 0.72;
const ENEMY_MOVE_SPEED = 0.74;
const MELEE_BODY_GAP = 0.58;
const RESULT_HOLD_SECONDS = 1.85;
const CAMERA_BASE_POSITION = new THREE.Vector3(2.8, 5.35, 8.9);
const CAMERA_LOOK_AT = new THREE.Vector3(0, 0.38, -1.05);

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function easeOutCubic(value: number): number {
  const t = clamp01(value);
  return 1 - ((1 - t) ** 3);
}

function easeInOutCubic(value: number): number {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function createMaterial(color: string, roughness = 0.8): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

export class BattleRuntime {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly loader = new GLTFLoader();
  private readonly baseUrl: string;
  private readonly swordAsset: string;
  private readonly onSnapshot: (snapshot: BattleSnapshot) => void;
  private readonly getSwordFusionRank: () => number;
  private readonly tempQuaternion = new THREE.Quaternion();
  private readonly tempQuaternion2 = new THREE.Quaternion();
  private readonly tempVector = new THREE.Vector3();
  private readonly tempVector2 = new THREE.Vector3();
  private readonly tempVector3 = new THREE.Vector3();
  private readonly localXAxis = new THREE.Vector3(1, 0, 0);
  private readonly localZAxis = new THREE.Vector3(0, 0, 1);

  private sword: AllyUnit | null = null;
  private bow: AllyUnit | null = null;
  private readonly allies: AllyUnit[] = [];
  private readonly enemies: EnemyUnit[] = [];
  private readonly arrows: ArrowRuntime[] = [];
  private readonly impacts: ImpactRuntime[] = [];
  private slashArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null = null;
  private spinArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null = null;
  private disposed = false;
  private initialized = false;
  private rawNow = 0;
  private simulationNow = 0;
  private pausedDuration = 0;
  private hitStopStartedAt = -Infinity;
  private hitStopEndsAt = -Infinity;
  private phase: BattleSnapshot['phase'] = 'loading';
  private phaseStartedAt = 0;
  private result: BattleSnapshot['result'] = null;
  private nextSwordAttackAt = 0;
  private swordAttackStartedAt = -Infinity;
  private swordAttackTarget: EnemyUnit | null = null;
  private swordHitsApplied = 0;
  private swordAttackHitCount = 1;
  private nextBowAttackAt = 0;
  private bowAttackStartedAt = -Infinity;
  private bowAttackTarget: EnemyUnit | null = null;
  private bowShotApplied = false;
  private cameraShakeStartedAt = -Infinity;
  private cameraShakeEndsAt = -Infinity;
  private cameraShakeAmplitude = 0;
  private lastSnapshotKey = '';

  constructor(options: BattleRuntimeOptions) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.baseUrl = options.baseUrl;
    this.swordAsset = options.swordAsset;
    this.onSnapshot = options.onSnapshot;
    this.getSwordFusionRank = options.getSwordFusionRank;
  }

  async initialize(): Promise<void> {
    if (this.initialized || this.disposed) return;
    this.initialized = true;

    this.scene.background = new THREE.Color('#b7e8fa');
    this.scene.fog = new THREE.Fog('#ccecca', 9, 22);
    this.camera.position.copy(CAMERA_BASE_POSITION);
    this.camera.lookAt(CAMERA_LOOK_AT);

    this.createEnvironment();
    this.createLighting();
    this.createEnemies();
    this.createSlashArc();

    const [sword, bow] = await Promise.all([
      this.loadUnit(`${this.baseUrl}${this.swordAsset}`, 'Sword', SWORD_HOME, 'WeaponAnchor'),
      this.loadUnit(`${this.baseUrl}assets/archer-slime.glb`, 'Bow', BOW_HOME, 'BowAnchor'),
    ]);

    if (this.disposed) return;
    this.sword = sword;
    this.bow = bow;
    this.allies.push(sword, bow);
    this.facePoint(sword, TARGET_HOME);
    this.facePoint(bow, TARGET_HOME);
    this.startBattle(this.rawNow + 0.15);
    this.emitSnapshot(true);
  }

  tick(rawNow: number): void {
    if (!this.initialized || this.disposed) return;
    this.rawNow = rawNow;
    if (!this.sword || !this.bow) return;
    const hitStopActive = rawNow < this.hitStopEndsAt;
    const simulationNow = this.getSimulationTime(rawNow);
    this.simulationNow = simulationNow;

    if (!hitStopActive) {
      if (this.phase === 'approach') this.updateApproach(simulationNow);
      else if (this.phase === 'combat') this.updateCombat(simulationNow);
      else if (this.phase === 'result') this.updateResult(simulationNow);

      this.updateAllyDefeat(this.sword, simulationNow);
      this.updateAllyDefeat(this.bow, simulationNow);
      this.updateArrows(simulationNow);
      this.updateImpacts(simulationNow);
      this.evaluateBattleOutcome(simulationNow);
    }
    this.updateHealthBars();
    this.updateCamera(rawNow);
    this.emitSnapshot();
  }

  private startHitStop(durationSeconds: number): void {
    if (durationSeconds <= 0) return;
    if (this.rawNow < this.hitStopEndsAt) {
      this.hitStopEndsAt = Math.max(this.hitStopEndsAt, this.rawNow + durationSeconds);
      return;
    }
    this.hitStopStartedAt = this.rawNow;
    this.hitStopEndsAt = this.rawNow + durationSeconds;
  }

  private getSimulationTime(rawNow: number): number {
    if (this.hitStopEndsAt > this.hitStopStartedAt) {
      if (rawNow < this.hitStopEndsAt) {
        return this.hitStopStartedAt - this.pausedDuration;
      }
      this.pausedDuration += this.hitStopEndsAt - this.hitStopStartedAt;
      this.hitStopStartedAt = -Infinity;
      this.hitStopEndsAt = -Infinity;
    }
    return rawNow - this.pausedDuration;
  }

  dispose(): void {
    this.disposed = true;
  }

  private createEnvironment(): void {
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(16, 22), createMaterial('#8bd266', 0.94));
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(0, -0.045, -3.2);
    grass.receiveShadow = true;
    this.scene.add(grass);

    const road = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 20), createMaterial('#e7cd92', 0.98));
    road.rotation.x = -Math.PI / 2;
    road.rotation.z = THREE.MathUtils.degToRad(-4);
    road.position.set(0.08, -0.032, -3.75);
    road.receiveShadow = true;
    this.scene.add(road);

    const roadEdgeMaterial = createMaterial('#c3ae75', 1);
    for (const side of [-1, 1]) {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 20), roadEdgeMaterial);
      edge.rotation.x = -Math.PI / 2;
      edge.rotation.z = THREE.MathUtils.degToRad(-4);
      edge.position.set(side * 2.38 + 0.08, -0.02, -3.75);
      this.scene.add(edge);
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
        this.scene.add(post);
        if (z < 3) {
          for (const y of [0.24, 0.43]) {
            const rail = new THREE.Mesh(railGeometry, railMaterial);
            rail.position.set(x, y, z + 0.92);
            rail.castShadow = true;
            this.scene.add(rail);
          }
        }
      }
    }

    const flowerColors = ['#fff6a8', '#ffffff', '#f6a3bd', '#b89cff'];
    const flowerMaterials = flowerColors.map((color) => createMaterial(color, 0.72));
    const stemMaterial = createMaterial('#4e9f52', 0.95);
    const stemGeometry = new THREE.CylinderGeometry(0.012, 0.016, 0.18, 6);
    const bloomGeometry = new THREE.SphereGeometry(0.052, 8, 6);
    const flowerSeeds: Array<[number, number, number]> = [
      [-3.7, 1.3, 0], [-3.45, 0.5, 2], [-3.8, -1.2, 1], [3.55, 1.6, 3],
      [3.7, -0.2, 1], [3.4, -2.1, 2], [-3.55, -3.2, 3], [3.6, -4.2, 0],
    ];
    for (const [x, z, colorIndex] of flowerSeeds) {
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.set(x, 0.09, z);
      this.scene.add(stem);
      const bloom = new THREE.Mesh(bloomGeometry, flowerMaterials[colorIndex]);
      bloom.scale.set(1, 0.55, 1);
      bloom.position.set(x, 0.21, z);
      this.scene.add(bloom);
    }

    const trunkMaterial = createMaterial('#8b6547', 0.95);
    const canopyMaterial = createMaterial('#5ebc60', 0.88);
    for (const [x, z, size] of [[-4.8, -4.2, 1], [4.65, -6.4, 1.25], [-4.4, -8, 1.35]] as Array<[number, number, number]>) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * size, 0.18 * size, 1.2 * size, 7), trunkMaterial);
      trunk.position.set(x, 0.6 * size, z);
      trunk.castShadow = true;
      this.scene.add(trunk);
      const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85 * size, 2), canopyMaterial);
      canopy.scale.set(1.1, 0.92, 1);
      canopy.position.set(x, 1.55 * size, z);
      canopy.castShadow = true;
      this.scene.add(canopy);
    }
  }

  private createLighting(): void {
    this.scene.add(new THREE.HemisphereLight('#eaf9ff', '#709d4e', 2));
    const sun = new THREE.DirectionalLight('#fff5d7', 4);
    sun.position.set(-4.5, 7.5, 5.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 18;
    sun.shadow.camera.left = -5;
    sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5;
    sun.shadow.camera.bottom = -5;
    this.scene.add(sun);
  }

  private makeShadow(radius = 0.3): THREE.Mesh<THREE.CircleGeometry, BasicMaterial> {
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
    this.scene.add(shadow);
    return shadow;
  }

  private createEnemy(home: THREE.Vector3, index: number): EnemyUnit {
    const root = new THREE.Group();
    root.name = `ForestMushroom${index + 1}`;
    root.position.copy(home);

    const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.22, 5, 10), createMaterial('#f4e7c2', 0.76));
    stem.position.y = 0.23;
    stem.castShadow = true;
    root.add(stem);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
      createMaterial(index === 1 ? '#df6657' : '#ea765d', 0.56),
    );
    cap.scale.set(1.08, 0.6, 1);
    cap.position.y = 0.47;
    cap.castShadow = true;
    root.add(cap);

    const eyeMaterial = createMaterial('#2a2026', 0.95);
    for (const x of [-0.095, 0.095]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.027, 8, 6), eyeMaterial);
      eye.scale.set(1, 1, 0.55);
      eye.position.set(x, 0.37, 0.19);
      root.add(eye);
    }

    const baseScale = 0.5;
    root.scale.setScalar(baseScale);
    this.scene.add(root);
    const shadow = this.makeShadow(0.34);
    shadow.position.set(home.x, 0.011, home.z);

    const enemy: EnemyUnit = {
      id: `enemy-mushroom-${index + 1}`,
      side: 'enemy',
      kind: 'Mushroom',
      index,
      root,
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
    this.enemies.push(enemy);
    return enemy;
  }

  private createEnemies(): void {
    ENEMY_SPAWNS.forEach((spawn, index) => this.createEnemy(spawn, index));
  }

  private createSlashArc(): void {
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
    this.scene.add(arc);
    this.slashArc = arc;

    const spinMaterial = new THREE.MeshBasicMaterial({
      color: '#fff1a8',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const spinArc = new THREE.Mesh(new THREE.TorusGeometry(0.70, 0.020, 8, 64), spinMaterial);
    spinArc.visible = false;
    spinArc.rotation.x = Math.PI / 2;
    spinArc.renderOrder = 5;
    this.scene.add(spinArc);
    this.spinArc = spinArc;
  }

  private createArrowMesh(): THREE.Group {
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

  private createImpact(position: THREE.Vector3, color = '#fff1a5', size = 0.11, duration = 0.28): void {
    const group = new THREE.Group();
    group.position.copy(position);
    group.quaternion.copy(this.camera.quaternion);
    const materials: THREE.MeshBasicMaterial[] = [];
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
    group.add(new THREE.Mesh(new THREE.RingGeometry(size * 0.52, size, 24), ringMaterial));
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2 + 0.22;
      const material = ringMaterial.clone();
      materials.push(material);
      const spark = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.12, size * 0.78), material);
      spark.position.set(Math.cos(angle) * size * 0.62, Math.sin(angle) * size * 0.62, 0.002);
      spark.rotation.z = angle - Math.PI / 2;
      group.add(spark);
    }
    this.scene.add(group);
    this.impacts.push({ group, materials, startedAt: this.simulationNow, duration });
  }

  private async loadUnit(url: string, kind: AllyKind, home: THREE.Vector3, equipmentName: string): Promise<AllyUnit> {
    const gltf = await this.loader.loadAsync(url);
    const root = gltf.scene as THREE.Group;
    root.name = `${kind}SlimeRuntime`;
    root.scale.setScalar(SCALE);
    root.position.copy(home);
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    const body = root.getObjectByName('Body') as MorphMesh | null;
    const faceRoot = root.getObjectByName('FaceRoot') ?? null;
    const equipmentAnchor = root.getObjectByName(equipmentName) ?? null;
    const weaponTip = kind === 'Sword' ? (root.getObjectByName('Sword_Tip') ?? null) : null;
    if (!body?.morphTargetDictionary || !equipmentAnchor) throw new Error(`${kind} slime model is missing runtime anchors.`);

    const shadow = this.makeShadow(0.24);
    shadow.position.set(home.x, 0.011, home.z);
    const healthBar = this.createWorldHealthBar();
    const unit: AllyUnit = {
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
      faceBasePosition: faceRoot?.position.clone() ?? new THREE.Vector3(),
      shadow,
      healthBar,
      home: home.clone(),
      maxHp: kind === 'Sword' ? SWORD_MAX_HP : BOW_MAX_HP,
      hp: kind === 'Sword' ? SWORD_MAX_HP : BOW_MAX_HP,
      alive: true,
      state: 'idle',
      defeatStartedAt: -Infinity,
      hitStartedAt: -Infinity,
      normalEyes: [],
      xEyes: [],
    };
    const eyes = this.createDefeatEyes(unit);
    unit.normalEyes = eyes.normalEyes;
    unit.xEyes = eyes.xEyes;
    this.scene.add(root);
    return unit;
  }

  private setMorph(unit: AllyUnit, name: string, value: number): void {
    const index = unit.body.morphTargetDictionary?.[name];
    if (index === undefined || !unit.body.morphTargetInfluences) return;
    unit.body.morphTargetInfluences[index] = clamp01(value);
  }

  private clearMorphs(unit: AllyUnit): void {
    unit.body.morphTargetInfluences?.fill(0);
  }

  private facePoint(unit: AllyUnit | EnemyUnit, point: THREE.Vector3): void {
    const dx = point.x - unit.root.position.x;
    const dz = point.z - unit.root.position.z;
    unit.root.rotation.y = Math.atan2(dx, dz);
  }

  private applyUnitDeformation(unit: AllyUnit, squash = 0, stretch = 0, lean = 0, wobble = 0, jump = 0): void {
    this.clearMorphs(unit);
    this.setMorph(unit, 'Squash', squash);
    this.setMorph(unit, 'Stretch', stretch);
    this.setMorph(unit, lean < 0 ? 'LeanLeft' : 'LeanRight', Math.abs(lean));
    this.setMorph(unit, wobble < 0 ? 'WobbleLeft' : 'WobbleRight', Math.abs(wobble));
    if (unit.faceRoot) {
      unit.faceRoot.scale.set(1 + squash * 0.045, 1 - squash * 0.04 + stretch * 0.028, 1);
    }
    const airborne = clamp01(jump / 0.16);
    const airScale = THREE.MathUtils.lerp(1, 0.66, airborne);
    unit.shadow.position.x = unit.root.position.x;
    unit.shadow.position.z = unit.root.position.z + 0.01;
    unit.shadow.scale.set(1.35 * airScale, 0.68 * airScale, 1);
    unit.shadow.material.opacity = THREE.MathUtils.lerp(0.22, 0.08, airborne);
  }

  private setEquipmentSwing(unit: AllyUnit, angle: number, lift = 0, sweep = 0): void {
    const primaryAxis = unit.kind === 'Sword' ? this.localXAxis : this.localZAxis;
    this.tempQuaternion.setFromAxisAngle(primaryAxis, angle);
    unit.equipmentAnchor.quaternion.copy(unit.equipmentBaseQuaternion).multiply(this.tempQuaternion);
    if (unit.kind === 'Sword' && Math.abs(sweep) > 0.0001) {
      this.tempQuaternion2.setFromAxisAngle(this.localZAxis, sweep);
      unit.equipmentAnchor.quaternion.multiply(this.tempQuaternion2);
    }
    unit.equipmentAnchor.position.y = unit.equipmentBasePosition.y + lift;
  }

  private updateIdle(unit: AllyUnit, now: number, phaseOffset = 0): void {
    if (!unit.alive) return;
    unit.body.scale.copy(unit.bodyBaseScale);
    if (unit.faceRoot) unit.faceRoot.position.copy(unit.faceBasePosition);
    const wave = Math.sin(now * 2.2 + phaseOffset);
    const breathe = 0.5 + 0.5 * wave;
    const lean = Math.sin(now * 1.25 + phaseOffset) * 0.05;
    const wobble = Math.sin(now * 2.05 + phaseOffset * 1.7) * 0.055;
    this.applyUnitDeformation(unit, 0.04 * breathe, 0.02 * (1 - breathe), lean, wobble, 0);
    this.setEquipmentSwing(unit, lean * 0.18);
  }

  private updateHopTravel(unit: AllyUnit, now: number, startTime: number, start: THREE.Vector3, end: THREE.Vector3, duration: number): boolean {
    const u = clamp01((now - startTime) / duration);
    const eased = easeInOutCubic(u);
    unit.root.position.lerpVectors(start, end, eased);
    const cycle = (u * 3) % 1;
    const jump = 4 * 0.115 * cycle * (1 - cycle);
    unit.root.position.y = THREE.MathUtils.lerp(start.y, end.y, eased) + jump;
    const landing = cycle < 0.12 ? 1 - cycle / 0.12 : 0;
    const stretch = Math.max(0, Math.sin(cycle * Math.PI)) * 0.22;
    const squash = landing * 0.58 + (cycle > 0.7 ? ((cycle - 0.7) / 0.3) * 0.3 : 0);
    const lean = Math.sin(u * Math.PI) * 0.08;
    const wobble = Math.sin(cycle * Math.PI * 2) * (0.1 + landing * 0.2);
    this.applyUnitDeformation(unit, squash, stretch, lean, wobble, jump);
    this.setEquipmentSwing(unit, lean * 0.22, jump * 0.03);
    this.facePoint(unit, end);
    return u >= 1;
  }

  private getLivingEnemies(): EnemyUnit[] {
    return this.enemies.filter((enemy) => enemy.alive);
  }

  private getLivingAllies(): AllyUnit[] {
    return this.allies.filter((ally) => ally.alive);
  }

  private getSafeSwordForwardOffset(direction: THREE.Vector3, desiredOffset: number): number {
    if (desiredOffset <= 0) return desiredOffset;
    let safeOffset = desiredOffset;
    for (const enemy of this.getLivingEnemies()) {
      const dx = SWORD_ATTACK_POS.x - enemy.root.position.x;
      const dz = SWORD_ATTACK_POS.z - enemy.root.position.z;
      const projection = dx * direction.x + dz * direction.z;
      const c = dx * dx + dz * dz - MELEE_BODY_GAP * MELEE_BODY_GAP;
      const discriminant = projection * projection - c;
      if (discriminant <= 0) continue;
      const root = Math.sqrt(discriminant);
      const enter = -projection - root;
      const exit = -projection + root;
      if (enter <= 0 && exit > 0) return 0;
      if (enter > 0 && safeOffset > enter) safeOffset = enter;
    }
    return Math.max(0, safeOffset - 0.002);
  }

  private getEnemyTargetPosition(target: AllyUnit): THREE.Vector3 {
    // During combat, navigation must target the sword slime's stable battle
    // anchor rather than the temporary root movement used by its slash.
    // Otherwise enemies chase the attack animation itself and collapse into the
    // slime's body.
    if (target.kind === 'Sword' && this.phase === 'combat') return SWORD_ATTACK_POS;
    return target.root.position;
  }

  private findNearest<T extends AllyUnit | EnemyUnit>(source: AllyUnit | EnemyUnit, candidates: T[]): T | null {
    let nearest: T | null = null;
    let nearestDistanceSq = Infinity;
    for (const candidate of candidates) {
      if (!candidate.alive || !candidate.root.visible) continue;
      const dx = candidate.root.position.x - source.root.position.x;
      const dz = candidate.root.position.z - source.root.position.z;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq < nearestDistanceSq) {
        nearestDistanceSq = distanceSq;
        nearest = candidate;
      }
    }
    return nearest;
  }

  private createWorldHealthBar(): HealthBarGroup {
    const group = new THREE.Group() as HealthBarGroup;
    group.renderOrder = 8;
    const backMaterial = new THREE.MeshBasicMaterial({ color: '#173348', transparent: true, opacity: 0.78, depthTest: false, depthWrite: false });
    const fillMaterial = new THREE.MeshBasicMaterial({ color: '#58d681', transparent: true, opacity: 0.96, depthTest: false, depthWrite: false });
    const background = new THREE.Mesh(new THREE.PlaneGeometry(0.43, 0.06), backMaterial);
    background.renderOrder = 8;
    group.add(background);
    const fillWidth = 0.39;
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(fillWidth, 0.028), fillMaterial);
    fill.position.z = 0.002;
    fill.renderOrder = 9;
    group.add(fill);
    group.userData.fill = fill;
    group.userData.fillWidth = fillWidth;
    this.scene.add(group);
    return group;
  }

  private updateWorldHealthBar(unit: AllyUnit): void {
    const ratio = unit.maxHp > 0 ? clamp01(unit.hp / unit.maxHp) : 0;
    const fill = unit.healthBar.userData.fill;
    const fillWidth = unit.healthBar.userData.fillWidth ?? 0.39;
    if (fill) {
      fill.scale.x = Math.max(0.001, ratio);
      fill.position.x = -(fillWidth * (1 - ratio)) / 2;
    }
    unit.healthBar.visible = unit.root.visible && (unit.alive || unit.state === 'defeat');
    unit.healthBar.position.set(unit.root.position.x, Math.max(0.31, unit.root.position.y + (unit.state === 'defeat' ? 0.18 : 0.34)), unit.root.position.z + 0.015);
    unit.healthBar.quaternion.copy(this.camera.quaternion);
  }

  private updateHealthBars(): void {
    this.allies.forEach((ally) => this.updateWorldHealthBar(ally));
  }

  private createDefeatEyes(unit: AllyUnit): { normalEyes: THREE.Object3D[]; xEyes: THREE.Object3D[] } {
    const normalEyes = ['Eye_L', 'Eye_R'].map((name) => unit.root.getObjectByName(name)).filter((eye): eye is THREE.Object3D => Boolean(eye));
    if (normalEyes.length !== 2) return { normalEyes, xEyes: [] };
    const xMaterial = new THREE.MeshBasicMaterial({ color: '#201925' });
    const barGeometry = new THREE.BoxGeometry(0.28, 0.052, 0.034);
    const xEyes: THREE.Object3D[] = [];
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
      eye.parent?.add(group);
      xEyes.push(group);
    }
    return { normalEyes, xEyes };
  }

  private setDefeatEyes(unit: AllyUnit, defeated: boolean): void {
    unit.normalEyes.forEach((eye) => { eye.visible = !defeated; });
    unit.xEyes.forEach((eye) => { eye.visible = defeated; });
  }

  private applyDamage(
    target: AllyUnit | EnemyUnit,
    amount: number,
    source: 'sword' | 'arrow' | 'enemy',
    sourcePosition: THREE.Vector3,
  ): void {
    if (!target.alive) return;
    target.hp = Math.max(0, target.hp - amount);
    target.hitStartedAt = this.simulationNow;
    this.tempVector.copy(target.root.position);
    this.tempVector.y += target.side === 'enemy' ? 0.28 : 0.22;
    this.createImpact(this.tempVector, target.side === 'enemy' ? '#fff0a0' : '#ffb4a8', target.side === 'enemy' ? 0.11 : 0.09);
    this.startCameraShake(0.12, target.side === 'enemy' ? 0.025 : 0.017);
    if (source !== 'arrow') this.startHitStop(source === 'enemy' ? 0.028 : 0.038);

    // Keep ally combat anchors stable. The pre-React runtime only knocked enemies
    // back on hit; applying this displacement to allies causes the sword slime to
    // drift away from its combat anchor after repeated enemy attacks.
    if (target.side === 'enemy') {
      this.tempVector2.copy(target.root.position).sub(sourcePosition).setY(0);
      if (this.tempVector2.lengthSq() > 0.0001) {
        this.tempVector2.normalize();
        target.root.position.addScaledVector(this.tempVector2, source === 'arrow' ? 0.026 : 0.066);
      }
    }
    if (target.hp <= 0) {
      if (target.side === 'enemy') this.beginEnemyDefeat(target);
      else this.beginAllyDefeat(target);
    }
    this.emitSnapshot(true);
  }

  private beginAllyDefeat(unit: AllyUnit): void {
    if (!unit.alive) return;
    unit.alive = false;
    unit.state = 'defeat';
    unit.defeatStartedAt = this.simulationNow;
    this.setDefeatEyes(unit, true);
  }

  private beginEnemyDefeat(enemy: EnemyUnit): void {
    if (!enemy.alive) return;
    enemy.alive = false;
    enemy.state = 'defeat';
    enemy.defeatStartedAt = this.simulationNow;
    enemy.attackStartedAt = -Infinity;
    enemy.attackTarget = null;
  }

  private updateAllyDefeat(unit: AllyUnit, now: number): void {
    if (unit.state !== 'defeat') return;
    const u = clamp01((now - unit.defeatStartedAt) / 0.72);
    const squash = Math.sin(Math.min(1, u * 1.4) * Math.PI * 0.5);
    unit.root.position.y = THREE.MathUtils.lerp(unit.root.position.y, 0.005, 0.18);
    unit.root.rotation.z = (unit.kind === 'Sword' ? -1 : 1) * 0.12 * squash;
    unit.body.scale.set(unit.bodyBaseScale.x * (1 + 0.4 * squash), unit.bodyBaseScale.y * (1 - 0.72 * squash), unit.bodyBaseScale.z * (1 + 0.22 * squash));
    this.setEquipmentSwing(unit, (unit.kind === 'Sword' ? 1 : -1) * u * 0.72, -u * 0.025, u * 0.16);
  }

  private updateEnemyDefeat(enemy: EnemyUnit, now: number): void {
    if (enemy.state !== 'defeat') return;
    const u = clamp01((now - enemy.defeatStartedAt) / 0.64);
    const squash = Math.sin(Math.min(1, u * 1.3) * Math.PI * 0.5);
    const vanish = clamp01((u - 0.72) / 0.28);
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

  private startBattle(now: number): void {
    this.phase = 'approach';
    this.phaseStartedAt = now;
    this.result = null;
    this.nextSwordAttackAt = now + 1.7;
    this.nextBowAttackAt = now + 0.65;
    const firstEnemy = this.findNearest(this.sword ?? this.bow!, this.getLivingEnemies());
    if (firstEnemy) {
      if (this.sword) this.facePoint(this.sword, firstEnemy.root.position);
      if (this.bow) this.facePoint(this.bow, firstEnemy.root.position);
    }
    this.enemies.forEach((enemy, index) => {
      enemy.nextAttackAt = now + 0.82 + index * 0.2;
      enemy.lastUpdateAt = now;
    });
    this.emitSnapshot(true);
  }

  private updateApproach(now: number): void {
    if (!this.sword || !this.bow) return;
    const duration = 1.55;
    this.updateHopTravel(this.sword, now, this.phaseStartedAt, SWORD_HOME, SWORD_ATTACK_POS, duration);
    this.updateBow(now);
    this.enemies.forEach((enemy) => this.updateEnemyApproachIdle(enemy, now));
    if (now - this.phaseStartedAt >= duration) {
      this.sword.root.position.copy(SWORD_ATTACK_POS);
      this.phase = 'combat';
      this.phaseStartedAt = now;
      this.nextSwordAttackAt = now + 0.12;
      this.enemies.forEach((enemy, index) => {
        enemy.attackStartedAt = -Infinity;
        enemy.attackTarget = null;
        enemy.attackHitApplied = false;
        enemy.nextAttackAt = now + 0.38 + index * 0.18;
        enemy.lastUpdateAt = now;
      });
      this.emitSnapshot(true);
    }
  }

  private updateCombat(now: number): void {
    if (!this.sword || !this.bow) return;
    this.updateSword(now);
    this.updateBow(now);
    this.enemies.forEach((enemy) => this.updateEnemyUnit(enemy, now));
  }

  private updateSword(now: number): void {
    const sword = this.sword;
    if (!sword || !sword.alive) return;
    const fusionRank = this.getSwordFusionRank();
    const greatsword = isGreatswordRank(fusionRank);

    if (this.swordAttackStartedAt !== -Infinity && !this.swordAttackTarget?.alive) {
      const replacement = greatsword ? this.findNearest(sword, this.getLivingEnemies()) : null;
      if (replacement) {
        this.swordAttackTarget = replacement;
      } else {
        this.swordAttackStartedAt = -Infinity;
        this.swordAttackTarget = null;
        this.swordHitsApplied = 0;
        this.swordAttackHitCount = 1;
        sword.root.position.copy(SWORD_ATTACK_POS);
        this.setEquipmentSwing(sword, 0);
        this.resetSlash();
        this.resetSpinArc();
      }
    }

    if (this.swordAttackStartedAt === -Infinity && now >= this.nextSwordAttackAt) {
      const target = this.findNearest(sword, this.getLivingEnemies());
      if (target) {
        this.swordAttackStartedAt = now;
        this.swordAttackTarget = target;
        this.swordHitsApplied = 0;
        this.swordAttackHitCount = 1;
        this.nextSwordAttackAt = now + (greatsword ? 1.55 : 1.08);
      }
    }

    if (this.swordAttackStartedAt === -Infinity || !this.swordAttackTarget) {
      sword.root.position.copy(SWORD_ATTACK_POS);
      this.updateIdle(sword, now, 0.2);
      const target = this.findNearest(sword, this.getLivingEnemies());
      if (target) this.facePoint(sword, target.root.position);
      this.resetSpinArc();
      return;
    }

    if (greatsword) {
      this.updateGreatswordAttack(now, sword, this.swordAttackTarget, fusionRank);
      return;
    }

    const duration = 0.88;
    const u = clamp01((now - this.swordAttackStartedAt) / duration);
    const target = this.swordAttackTarget;

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
      const spring = Math.sin(p * Math.PI * 2) * Math.exp(-4.2 * p);
      weaponAngle = THREE.MathUtils.lerp(1.34, 0, recovery);
      weaponSweep = THREE.MathUtils.lerp(0.18, 0, recovery);
      bodyOffset = THREE.MathUtils.lerp(0.32, 0, recovery);
      squash = Math.max(0, -spring) * 0.20;
      stretch = Math.max(0, spring) * 0.15;
      lean = spring * 0.09;
    }

    this.tempVector.copy(target.root.position).sub(SWORD_ATTACK_POS).setY(0);
    const targetDistanceFromAnchor = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    if (bodyOffset > 0) {
      bodyOffset = Math.min(bodyOffset, Math.max(0, targetDistanceFromAnchor - MELEE_BODY_GAP));
      bodyOffset = this.getSafeSwordForwardOffset(this.tempVector, bodyOffset);
    }
    sword.root.position.copy(SWORD_ATTACK_POS).addScaledVector(this.tempVector, bodyOffset);
    this.facePoint(sword, target.root.position);
    this.applyUnitDeformation(sword, squash, stretch, lean, 0, 0);
    this.setEquipmentSwing(sword, weaponAngle, weaponLift, weaponSweep);
    sword.root.updateMatrixWorld(true);

    if (releaseProgress >= 0 && sword.weaponTip) {
      sword.weaponTip.getWorldPosition(this.tempVector3);
      const arcU = clamp01((releaseProgress - 0.08) / 0.82);
      const arcPulse = Math.sin(arcU * Math.PI);
      if (this.slashArc) {
        this.slashArc.visible = arcPulse > 0.01;
        this.slashArc.position.copy(this.tempVector3);
        this.slashArc.position.y += 0.012;
        this.slashArc.quaternion.copy(this.camera.quaternion);
        this.slashArc.rotation.z = -0.95 + arcU * 1.15;
        this.slashArc.scale.set(0.90 + arcU * 0.52, 0.68 + arcU * 0.16, 1);
        this.slashArc.material.opacity = arcPulse * 0.88;
      }

      if (releaseProgress >= 0.50 && this.swordHitsApplied === 0 && target.alive) {
        this.swordHitsApplied = 1;
        this.applyDamage(target, 2, 'sword', sword.root.position);
      }
    } else {
      this.resetSlash();
    }

    if (u >= 1 || !target.alive) {
      this.finishSwordAttack(now, sword, target);
    }
  }

  private updateGreatswordAttack(now: number, sword: AllyUnit, target: EnemyUnit, fusionRank: number): void {
    const duration = 1.18;
    const u = clamp01((now - this.swordAttackStartedAt) / duration);
    const anticipation = clamp01(u / 0.22);
    const spinU = clamp01((u - 0.18) / 0.62);
    const recovery = clamp01((u - 0.80) / 0.20);
    const spinEase = easeInOutCubic(spinU);

    sword.root.position.copy(SWORD_ATTACK_POS);
    this.facePoint(sword, target.root.position);
    const facing = sword.root.rotation.y;
    sword.root.rotation.y = facing + spinEase * Math.PI * 2;

    const squash = u < 0.22
      ? 0.34 * anticipation
      : Math.max(0, 0.12 * (1 - recovery));
    const stretch = spinU > 0 && spinU < 1 ? 0.24 * Math.sin(spinU * Math.PI) : 0;
    const wobble = spinU > 0 && spinU < 1 ? Math.sin(spinU * Math.PI * 4) * 0.08 : 0;
    this.applyUnitDeformation(sword, squash, stretch, -0.10 * anticipation, wobble, 0);
    this.setEquipmentSwing(
      sword,
      THREE.MathUtils.lerp(-0.35, 0.10, spinEase),
      0.018 * Math.sin(spinU * Math.PI),
      0.30 * Math.sin(spinU * Math.PI),
    );

    if (this.spinArc) {
      const pulse = spinU > 0 && spinU < 1 ? Math.sin(spinU * Math.PI) : 0;
      this.spinArc.visible = pulse > 0.01;
      this.spinArc.position.set(sword.root.position.x, 0.12, sword.root.position.z);
      const radiusScale = fusionRank >= 4 ? 1.62 : fusionRank >= 3 ? 1.50 : 1.38;
      this.spinArc.scale.setScalar(radiusScale * (0.88 + pulse * 0.18));
      this.spinArc.material.opacity = pulse * 0.70;
    }

    if (spinU >= 0.46 && this.swordHitsApplied === 0) {
      this.swordHitsApplied = 1;
      const radius = fusionRank >= 4 ? 1.28 : fusionRank >= 3 ? 1.18 : 1.08;
      const damage = fusionRank >= 3 ? 3 : 2;
      const targets = this.getLivingEnemies().filter((enemy) => {
        const dx = enemy.root.position.x - sword.root.position.x;
        const dz = enemy.root.position.z - sword.root.position.z;
        return (dx * dx + dz * dz) <= radius * radius;
      });
      for (const enemy of targets) {
        this.applyDamage(enemy, damage, 'sword', sword.root.position);
      }
      this.createImpact(sword.root.position.clone().add(new THREE.Vector3(0, 0.14, 0)), '#fff0a0', 0.16);
    }

    if (u >= 1) {
      this.finishSwordAttack(now, sword, target);
    }
  }

  private finishSwordAttack(now: number, sword: AllyUnit, target: EnemyUnit): void {
    this.swordAttackStartedAt = -Infinity;
    this.swordAttackTarget = null;
    this.swordHitsApplied = 0;
    this.swordAttackHitCount = 1;
    sword.root.position.copy(SWORD_ATTACK_POS);
    this.facePoint(sword, target.root.position);
    this.setEquipmentSwing(sword, 0);
    this.resetSlash();
    this.resetSpinArc();
    this.nextSwordAttackAt = Math.max(this.nextSwordAttackAt, now + 0.24);
  }

  private showSlash(contact: THREE.Vector3, target: THREE.Vector3, strong: boolean): void {
    if (!this.slashArc) return;
    this.slashArc.visible = true;
    this.slashArc.position.copy(contact).lerp(target, 0.35);
    this.slashArc.position.y += 0.08;
    this.slashArc.quaternion.copy(this.camera.quaternion);
    this.slashArc.scale.setScalar(strong ? 1.45 : 1.05);
    this.slashArc.material.opacity = strong ? 0.95 : 0.78;
  }

  private resetSlash(): void {
    if (!this.slashArc) return;
    this.slashArc.visible = false;
    this.slashArc.material.opacity = 0;
  }

  private resetSpinArc(): void {
    if (!this.spinArc) return;
    this.spinArc.visible = false;
    this.spinArc.material.opacity = 0;
  }

  private updateBow(now: number): void {
    const bow = this.bow;
    if (!bow || !bow.alive) return;
    if (this.bowAttackStartedAt === -Infinity && now >= this.nextBowAttackAt) {
      const target = this.findNearest(bow, this.getLivingEnemies());
      if (target) {
        this.bowAttackStartedAt = now;
        this.bowAttackTarget = target;
        this.bowShotApplied = false;
      }
    }
    if (this.bowAttackStartedAt === -Infinity || !this.bowAttackTarget?.alive) {
      this.updateIdle(bow, now, 1.1);
      return;
    }

    const u = clamp01((now - this.bowAttackStartedAt) / 0.62);
    this.facePoint(bow, this.bowAttackTarget.root.position);
    const tension = Math.sin(Math.min(1, u / 0.55) * Math.PI * 0.5);
    const release = clamp01((u - 0.55) / 0.18);
    this.applyUnitDeformation(bow, 0.08 * tension, 0.12 * release, -0.06 * tension + 0.08 * release, 0, 0);
    this.setEquipmentSwing(bow, -0.36 * tension + 0.5 * release, 0.012 * tension);
    if (!this.bowShotApplied && u >= 0.56) {
      this.bowShotApplied = true;
      this.fireArrow(bow, this.bowAttackTarget);
    }
    if (u >= 1) {
      this.bowAttackStartedAt = -Infinity;
      this.bowAttackTarget = null;
      this.nextBowAttackAt = now + 1.0;
      this.setEquipmentSwing(bow, 0);
    }
  }

  private fireArrow(bow: AllyUnit, target: EnemyUnit): void {
    const root = this.createArrowMesh();
    bow.equipmentAnchor.getWorldPosition(this.tempVector);
    const start = this.tempVector.clone();
    const end = target.root.position.clone().add(new THREE.Vector3(0, 0.28, 0));
    root.position.copy(start);
    this.scene.add(root);
    this.arrows.push({ root, start, end, target, startedAt: this.simulationNow, duration: 0.38, hitApplied: false });
  }

  private updateArrows(now: number): void {
    for (let i = this.arrows.length - 1; i >= 0; i -= 1) {
      const arrow = this.arrows[i];
      const u = clamp01((now - arrow.startedAt) / arrow.duration);
      const targetPosition = arrow.target.root.position.clone().add(new THREE.Vector3(0, 0.26, 0));
      arrow.end.lerp(targetPosition, 0.22);
      arrow.root.position.lerpVectors(arrow.start, arrow.end, u);
      arrow.root.position.y += Math.sin(u * Math.PI) * 0.08;
      this.tempVector.copy(arrow.end).sub(arrow.start).normalize();
      arrow.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.tempVector);
      if (!arrow.hitApplied && u >= 0.94) {
        arrow.hitApplied = true;
        if (arrow.target.alive) this.applyDamage(arrow.target, 1, 'arrow', arrow.start);
      }
      if (u >= 1) {
        this.scene.remove(arrow.root);
        this.arrows.splice(i, 1);
      }
    }
  }

  private updateImpacts(now: number): void {
    for (let i = this.impacts.length - 1; i >= 0; i -= 1) {
      const impact = this.impacts[i];
      const u = clamp01((now - impact.startedAt) / impact.duration);
      impact.group.scale.setScalar(1 + u * 1.35);
      impact.materials.forEach((material) => { material.opacity = (1 - u) * 0.92; });
      impact.group.quaternion.copy(this.camera.quaternion);
      if (u >= 1) {
        this.scene.remove(impact.group);
        this.impacts.splice(i, 1);
      }
    }
  }

  private updateEnemyApproachIdle(enemy: EnemyUnit, now: number): void {
    if (!enemy.alive || enemy.state === 'defeat' || enemy.state === 'dead') return;
    enemy.root.position.copy(enemy.home);
    enemy.root.position.y = 0;
    const idlePulse = Math.sin(now * 5 + enemy.index) * 0.018;
    enemy.root.scale.set(
      enemy.baseScale * (1 + idlePulse),
      enemy.baseScale * (1 - idlePulse * 0.7),
      enemy.baseScale,
    );
    this.facePoint(enemy, SWORD_ATTACK_POS);
    enemy.shadow.position.set(enemy.home.x, 0.011, enemy.home.z);
    enemy.shadow.scale.set(1.35, 0.68, 1);
    enemy.shadow.material.opacity = 0.22;
  }

  private updateEnemyUnit(enemy: EnemyUnit, now: number): void {
    if (enemy.state === 'defeat' || enemy.state === 'dead') {
      this.updateEnemyDefeat(enemy, now);
      return;
    }
    const dt = enemy.lastUpdateAt > 0 ? Math.min(0.05, Math.max(0, now - enemy.lastUpdateAt)) : 0;
    enemy.lastUpdateAt = now;
    const targets = this.getLivingAllies();
    const target = enemy.attackTarget?.alive ? enemy.attackTarget : this.findNearest(enemy, targets);
    if (!target) return;

    if (enemy.attackStartedAt !== -Infinity) {
      this.updateEnemyAttack(enemy, now);
      return;
    }

    const targetPosition = this.getEnemyTargetPosition(target);
    this.facePoint(enemy, targetPosition);
    this.tempVector.copy(targetPosition).sub(enemy.root.position).setY(0);
    const distance = this.tempVector.length();
    if (distance > ENEMY_ATTACK_RANGE) {
      this.tempVector.normalize();
      let step = Math.min(distance - ENEMY_ATTACK_RANGE, ENEMY_MOVE_SPEED * dt);
      if (target.kind === 'Sword' && this.phase === 'combat') {
        const actualSwordDistance = Math.hypot(
          target.root.position.x - enemy.root.position.x,
          target.root.position.z - enemy.root.position.z,
        );
        step = Math.min(step, Math.max(0, actualSwordDistance - MELEE_BODY_GAP));
      }
      enemy.root.position.addScaledVector(this.tempVector, step);
      const hop = Math.abs(Math.sin(now * 8 + enemy.index * 1.2)) * 0.045;
      enemy.root.position.y = hop;
      enemy.root.scale.set(enemy.baseScale * (1 - hop * 0.3), enemy.baseScale * (1 + hop * 0.55), enemy.baseScale);
    } else {
      enemy.root.position.y = 0;
      const hitU = clamp01((now - enemy.hitStartedAt) / 0.18);
      const hitPulse = enemy.hitStartedAt > 0 && hitU < 1 ? Math.sin(hitU * Math.PI) : 0;
      const idlePulse = Math.sin(now * 5 + enemy.index) * 0.018;
      enemy.root.scale.set(
        enemy.baseScale * (1 + idlePulse + hitPulse * 0.1),
        enemy.baseScale * (1 - idlePulse * 0.7 - hitPulse * 0.2),
        enemy.baseScale,
      );
      if (now >= enemy.nextAttackAt) {
        enemy.attackStartedAt = now;
        enemy.attackOrigin.copy(enemy.root.position);
        enemy.attackTarget = target;
        enemy.attackHitApplied = false;
        enemy.nextAttackAt = now + 1.52 + enemy.index * 0.1;
      }
    }
    enemy.shadow.position.set(enemy.root.position.x, 0.011, enemy.root.position.z);
    enemy.shadow.scale.set(1.35, 0.68, 1);
    enemy.shadow.material.opacity = 0.22;
  }

  private updateEnemyAttack(enemy: EnemyUnit, now: number): void {
    const target = enemy.attackTarget;
    if (!target?.alive) {
      enemy.attackStartedAt = -Infinity;
      enemy.attackTarget = null;
      enemy.root.position.copy(enemy.attackOrigin);
      return;
    }
    const duration = 0.5;
    const u = clamp01((now - enemy.attackStartedAt) / duration);
    const targetPosition = target.root.position;
    this.tempVector.copy(targetPosition).sub(enemy.attackOrigin).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    const lunge = u < 0.56 ? Math.sin((u / 0.56) * Math.PI * 0.5) : 1 - clamp01((u - 0.56) / 0.44);
    const maxTravel = Math.max(0, distance - MELEE_BODY_GAP);
    const travel = Math.min(distance * 0.42, 0.4, maxTravel) * lunge;
    const jump = Math.sin(u * Math.PI) * 0.08;
    enemy.root.position.copy(enemy.attackOrigin).addScaledVector(this.tempVector, travel);
    enemy.root.position.y = jump;
    enemy.root.scale.set(enemy.baseScale * (1 + 0.18 * lunge), enemy.baseScale * (1 - 0.22 * lunge + jump * 0.35), enemy.baseScale);
    this.facePoint(enemy, targetPosition);
    if (!enemy.attackHitApplied && u >= 0.57) {
      enemy.attackHitApplied = true;
      this.applyDamage(target, 1, 'enemy', enemy.root.position);
    }
    if (u >= 1) {
      enemy.attackStartedAt = -Infinity;
      enemy.attackTarget = null;
      enemy.attackHitApplied = false;
      enemy.root.position.copy(enemy.attackOrigin);
      enemy.root.position.y = 0;
    }
  }

  private evaluateBattleOutcome(now: number): void {
    if (this.phase === 'result' || this.phase === 'loading') return;
    if (this.getLivingEnemies().length === 0) this.enterResult('victory', now);
    else if (this.getLivingAllies().length === 0) this.enterResult('defeat', now);
  }

  private enterResult(result: 'victory' | 'defeat', now: number): void {
    if (this.phase === 'result') return;
    this.phase = 'result';
    this.phaseStartedAt = now;
    this.result = result;
    this.swordAttackStartedAt = -Infinity;
    this.bowAttackStartedAt = -Infinity;
    this.enemies.forEach((enemy) => {
      enemy.attackStartedAt = -Infinity;
      enemy.attackTarget = null;
    });
    this.emitSnapshot(true);
  }

  private updateResult(now: number): void {
    if (!this.sword || !this.bow) return;
    if (this.sword.alive) this.updateIdle(this.sword, now);
    if (this.bow.alive) this.updateIdle(this.bow, now, 1.1);
    this.enemies.forEach((enemy) => this.updateEnemyDefeat(enemy, now));
    if (now - this.phaseStartedAt >= RESULT_HOLD_SECONDS) this.resetWave(now);
  }

  private resetWave(now: number): void {
    if (!this.sword || !this.bow) return;
    this.clearProjectiles();
    this.resetAlly(this.sword);
    this.resetAlly(this.bow);
    this.enemies.forEach((enemy, index) => this.resetEnemy(enemy, now + index * 0.02));
    this.sword.root.position.copy(SWORD_HOME);
    this.bow.root.position.copy(BOW_HOME);
    this.facePoint(this.sword, TARGET_HOME);
    this.facePoint(this.bow, TARGET_HOME);
    this.startBattle(now + 0.1);
  }

  private resetAlly(unit: AllyUnit): void {
    unit.hp = unit.maxHp;
    unit.alive = true;
    unit.state = 'idle';
    unit.defeatStartedAt = -Infinity;
    unit.hitStartedAt = -Infinity;
    unit.root.visible = true;
    unit.root.position.copy(unit.home);
    unit.root.rotation.set(0, 0, 0);
    unit.root.scale.setScalar(SCALE);
    unit.body.scale.copy(unit.bodyBaseScale);
    if (unit.faceRoot) {
      unit.faceRoot.scale.set(1, 1, 1);
      unit.faceRoot.position.copy(unit.faceBasePosition);
    }
    this.clearMorphs(unit);
    this.setEquipmentSwing(unit, 0);
    this.setDefeatEyes(unit, false);
    unit.shadow.visible = true;
    unit.shadow.material.opacity = 0.22;
    unit.healthBar.visible = true;
  }

  private resetEnemy(enemy: EnemyUnit, now: number): void {
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

  private clearProjectiles(): void {
    this.arrows.splice(0).forEach((arrow) => this.scene.remove(arrow.root));
    this.impacts.splice(0).forEach((impact) => this.scene.remove(impact.group));
    this.resetSlash();
    this.resetSpinArc();
  }

  private startCameraShake(duration: number, amplitude: number): void {
    this.cameraShakeStartedAt = this.rawNow;
    this.cameraShakeEndsAt = Math.max(this.cameraShakeEndsAt, this.rawNow + duration);
    this.cameraShakeAmplitude = Math.max(this.cameraShakeAmplitude, amplitude);
  }

  private updateCamera(now: number): void {
    this.camera.position.copy(CAMERA_BASE_POSITION);
    if (now < this.cameraShakeEndsAt) {
      const duration = Math.max(0.001, this.cameraShakeEndsAt - this.cameraShakeStartedAt);
      const u = clamp01((now - this.cameraShakeStartedAt) / duration);
      const envelope = (1 - u) * this.cameraShakeAmplitude;
      this.camera.position.x += Math.sin(now * 97) * envelope;
      this.camera.position.y += Math.sin(now * 131 + 0.7) * envelope * 0.55;
    } else {
      this.cameraShakeAmplitude = 0;
    }
    this.camera.lookAt(CAMERA_LOOK_AT);
  }

  private emitSnapshot(force = false): void {
    const enemyMaxHp = this.enemies.reduce((sum, enemy) => sum + enemy.maxHp, 0);
    const enemyHp = this.enemies.reduce((sum, enemy) => sum + enemy.hp, 0);
    const enemyAlive = this.getLivingEnemies().length;
    const label = this.phase === 'loading'
      ? '出撃準備中'
      : this.phase === 'approach'
        ? '接敵中'
        : this.phase === 'combat'
          ? '交戦中'
          : this.result === 'victory' ? '勝利' : '敗北';
    const snapshot: BattleSnapshot = {
      phase: this.phase,
      label,
      result: this.result,
      enemyAlive,
      enemyHp,
      enemyMaxHp,
      swordHp: this.sword?.hp ?? SWORD_MAX_HP,
      swordMaxHp: SWORD_MAX_HP,
      bowHp: this.bow?.hp ?? BOW_MAX_HP,
      bowMaxHp: BOW_MAX_HP,
    };
    const key = JSON.stringify(snapshot);
    if (force || key !== this.lastSnapshotKey) {
      this.lastSnapshotKey = key;
      this.onSnapshot(snapshot);
    }
  }
}
