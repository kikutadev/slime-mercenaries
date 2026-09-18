import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { isGreatswordRank } from './fusion';
import {
  SLIME_MOTION_TIMING,
  SLIME_MOTION_THRESHOLDS,
  applyDeformationPose,
  applyEquipmentPose,
  applyMageRunePose,
  applyGuardPulseVfx,
  applyMageCastSigil,
  applyRogueSlashVfx,
  clamp01,
  easeOutCubic,
  getAllyDefeatMotion,
  getArrowArcHeight,
  getBowAttackMotion,
  getDaggerAttackMotion,
  getFighterAttackMotion,
  getGuardianAttackMotion,
  getGreatswordAttackMotion,
  getGreatswordSpinVfxPose,
  getGunAttackMotion,
  getGunnerAttackMotion,
  getGunnerShotReleaseU,
  getHopTravelMotion,
  getIdleMotion,
  getMageAttackMotion,
  getRangerAttackMotion,
  getRogueAttackMotion,
  getShieldAttackMotion,
  getSwordAttackMotion,
  getWandAttackMotion,
  getSwordSlashVfxPose,
  createGreatswordSpinArc,
  createGuardPulseVfx,
  createMageCastSigil,
  createMageOrbVfx,
  createRogueSlashArc,
  createGunnerTracerMesh,
  createGunBulletMesh,
  createMagicOrbMesh,
  createMuzzleFlashMesh,
  createSlimeArrowMesh,
  createSwordSlashArc,
  type MorphMesh,
  type SlimeEquipmentMotionKind,
} from './slime-motion';
import type { BattleBehaviorId } from './slimes';
import {
  applyEnemySecondaryPose,
  captureEnemyRigRestPose,
  getEnemyMotionProfile,
  resetEnemySecondaryPose,
  resolveEnemyRigParts,
  type EnemyMotionProfile,
  type EnemyRigParts,
  type EnemyRigRestPose,
} from './enemy-motion';
import type { EnemyBehaviorId, EnemyId, EnemyScaleClass } from './enemies';
import type { EnemyFormationSlot } from './encounters';
import { createBattleEnvironment } from './battle-environment';
import { getApproachCameraRetreat, getEnemyApproachEntryPose, getSceneryApproachOffset } from './battle-approach';
import { getVictoryMarchSlot, getVictoryTransitionPose, shouldUseMarchEntry, victoryStatusLabel } from './battle-transition';

export interface BattleSnapshotAlly {
  hp: number;
  maxHp: number;
  alive: boolean;
}

export interface BattleSnapshot {
  phase: 'loading' | 'approach' | 'combat' | 'result';
  label: string;
  result: 'victory' | 'defeat' | null;
  enemyAlive: number;
  enemyHp: number;
  enemyMaxHp: number;
  allies: Readonly<Record<string, BattleSnapshotAlly>>;
}

type UnitState = 'idle' | 'defeat' | 'dead';

type BasicMaterial = THREE.MeshBasicMaterial;

type HealthBarGroup = THREE.Group & {
  userData: {
    fill?: THREE.Mesh;
    fillWidth?: number;
  };
};

interface AllyUnit {
  id: string;
  slimeId: string;
  slotIndex: number;
  side: 'ally';
  behaviorId: BattleBehaviorId;
  fusionRank: number;
  root: THREE.Group;
  body: MorphMesh;
  faceRoot: THREE.Object3D | null;
  equipmentAnchor: THREE.Object3D;
  secondaryEquipmentAnchor: THREE.Object3D | null;
  mageRuneAnchor: THREE.Object3D | null;
  guardPulseVfx: THREE.Group | null;
  mageCastSigil: THREE.Group | null;
  rogueSlashArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null;
  weaponTip: THREE.Object3D | null;
  projectileOrigin: THREE.Object3D | null;
  spellOrigin: THREE.Object3D | null;
  equipmentBaseQuaternion: THREE.Quaternion;
  equipmentBasePosition: THREE.Vector3;
  secondaryEquipmentBaseQuaternion: THREE.Quaternion;
  secondaryEquipmentBasePosition: THREE.Vector3;
  mageRuneBaseQuaternion: THREE.Quaternion;
  mageRuneBaseScale: THREE.Vector3;
  bodyBaseScale: THREE.Vector3;
  faceBasePosition: THREE.Vector3;
  shadow: THREE.Mesh<THREE.CircleGeometry, BasicMaterial>;
  healthBar: HealthBarGroup;
  home: THREE.Vector3;
  combatAnchor: THREE.Vector3;
  approachOrigin: THREE.Vector3;
  resultOrigin: THREE.Vector3;
  maxHp: number;
  hp: number;
  alive: boolean;
  state: UnitState;
  defeatStartedAt: number;
  hitStartedAt: number;
  nextAttackAt: number;
  attackStartedAt: number;
  attackTarget: EnemyUnit | null;
  hitsApplied: number;
  shotApplied: boolean;
  normalEyes: THREE.Object3D[];
  xEyes: THREE.Object3D[];
}

interface EnemyUnit {
  id: string;
  side: 'enemy';
  enemyId: EnemyId;
  name: string;
  behaviorId: EnemyBehaviorId;
  scaleClass: EnemyScaleClass;
  formationSlot: EnemyFormationSlot;
  index: number;
  root: THREE.Group;
  bodyRoot: THREE.Object3D;
  bodyBaseScale: THREE.Vector3;
  faceRoot: THREE.Object3D | null;
  faceBasePosition: THREE.Vector3;
  faceBaseScale: THREE.Vector3;
  effectOrigin: THREE.Object3D | null;
  motionProfile: EnemyMotionProfile;
  rigParts: EnemyRigParts;
  rigRest: EnemyRigRestPose;
  shadow: THREE.Mesh<THREE.CircleGeometry, BasicMaterial>;
  home: THREE.Vector3;
  baseScale: number;
  maxHp: number;
  hp: number;
  moveSpeed: number;
  attackRange: number;
  attackInterval: number;
  attackDamage: number;
  initialAttackDelay: number;
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
  normalEyes: THREE.Object3D[];
  xEyes: THREE.Object3D[];
}

interface ProjectileRuntime {
  root: THREE.Object3D;
  start: THREE.Vector3;
  end: THREE.Vector3;
  target: EnemyUnit;
  startedAt: number;
  duration: number;
  hitApplied: boolean;
  damage: number;
  splashRadius: number;
  splashDamage: number;
  arcHeightScale: number;
  orientToTravel: boolean;
  hitU: number;
}

interface TracerRuntime {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  startedAt: number;
  duration: number;
}

interface MuzzleFlashRuntime {
  mesh: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>;
  startedAt: number;
  duration: number;
}

interface EnemyProjectileRuntime {
  root: THREE.Object3D;
  start: THREE.Vector3;
  end: THREE.Vector3;
  target: AllyUnit;
  sourcePosition: THREE.Vector3;
  damage: number;
  startedAt: number;
  duration: number;
  hitApplied: boolean;
  arcHeight: (u: number) => number;
}

interface ImpactRuntime {
  group: THREE.Group;
  materials: THREE.MeshBasicMaterial[];
  startedAt: number;
  duration: number;
}

interface VictoryLootMoteRuntime {
  mesh: THREE.Mesh<THREE.OctahedronGeometry, THREE.MeshBasicMaterial>;
  start: THREE.Vector3;
  end: THREE.Vector3;
  delay: number;
}

export interface BattleRuntimeAllyConfig {
  slimeId: string;
  slotIndex: number;
  asset: string;
  behaviorId: BattleBehaviorId;
  fusionRank: number;
  equipmentAnchorName: string;
  weaponTipName: string | null;
  maxHp: number;
  formationRole: 'front' | 'back';
}

export interface BattleRuntimeEnemyConfig {
  enemyId: EnemyId;
  name: string;
  asset: string;
  behaviorId: EnemyBehaviorId;
  maxHp: number;
  moveSpeed: number;
  attackRange: number;
  attackInterval: number;
  attackDamage: number;
  renderScale: number;
  scaleClass: EnemyScaleClass;
  shadowRadius: number;
  instanceIndex: number;
  formationSlot: EnemyFormationSlot;
  initialAttackDelay: number;
}

export interface BattleRuntimeOptions {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  baseUrl: string;
  stageNumber: number;
  waveIndex: number;
  allies: readonly BattleRuntimeAllyConfig[];
  enemies: readonly BattleRuntimeEnemyConfig[];
  onSnapshot: (snapshot: BattleSnapshot) => void;
}

const SCALE = 0.19;
const ALLY_HOME_POSITIONS = [
  new THREE.Vector3(-0.62, 0.02, 1.18),
  new THREE.Vector3(0, 0.02, 1.34),
  new THREE.Vector3(0.62, 0.02, 1.18),
  new THREE.Vector3(-0.66, 0.02, 1.78),
  new THREE.Vector3(0, 0.02, 1.92),
  new THREE.Vector3(0.66, 0.02, 1.78),
] as const;
const MELEE_COMBAT_POSITIONS = [
  new THREE.Vector3(-0.52, 0.02, -0.72),
  new THREE.Vector3(0, 0.02, -0.82),
  new THREE.Vector3(0.52, 0.02, -0.72),
  new THREE.Vector3(-0.72, 0.02, -0.34),
  new THREE.Vector3(0, 0.02, -0.42),
  new THREE.Vector3(0.72, 0.02, -0.34),
] as const;
const ENEMY_FORMATION_POSITIONS: Readonly<Record<EnemyFormationSlot, THREE.Vector3>> = {
  'front-left': new THREE.Vector3(-0.62, 0, -1.34),
  'front-center': new THREE.Vector3(0, 0, -1.46),
  'front-right': new THREE.Vector3(0.62, 0, -1.34),
  'mid-left': new THREE.Vector3(-0.82, 0, -1.78),
  'mid-center': new THREE.Vector3(0, 0, -1.86),
  'mid-right': new THREE.Vector3(0.82, 0, -1.78),
  'back-left': new THREE.Vector3(-0.68, 0, -2.18),
  'back-center': new THREE.Vector3(0, 0, -2.26),
  'back-right': new THREE.Vector3(0.68, 0, -2.18),
  'rear-left': new THREE.Vector3(-0.94, 0, -2.52),
  'rear-center': new THREE.Vector3(0, 0, -2.60),
  'rear-right': new THREE.Vector3(0.94, 0, -2.52),
};
const TARGET_HOME = ENEMY_FORMATION_POSITIONS['front-center'];
const ENEMY_MAX_HP = 4;
const ENEMY_ATTACK_RANGE = 0.72;
const ENEMY_MOVE_SPEED = 0.74;
const MELEE_BODY_GAP = 0.58;
const RESULT_HOLD_SECONDS = 1.85;
const CAMERA_BASE_POSITION = new THREE.Vector3(2.8, 5.35, 8.9);
const CAMERA_LOOK_AT = new THREE.Vector3(0, 0.38, -1.05);

export class BattleRuntime {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly loader = new GLTFLoader();
  private readonly enemyTemplatePromises = new Map<string, Promise<THREE.Group>>();
  private readonly baseUrl: string;
  private readonly stageNumber: number;
  private readonly waveIndex: number;
  private readonly allyConfigs: readonly BattleRuntimeAllyConfig[];
  private readonly enemyConfigs: readonly BattleRuntimeEnemyConfig[];
  private readonly onSnapshot: (snapshot: BattleSnapshot) => void;
  private readonly tempVector = new THREE.Vector3();
  private readonly tempVector2 = new THREE.Vector3();
  private readonly tempVector3 = new THREE.Vector3();

  private readonly allies: AllyUnit[] = [];
  private readonly enemies: EnemyUnit[] = [];
  private readonly projectiles: ProjectileRuntime[] = [];
  private readonly enemyProjectiles: EnemyProjectileRuntime[] = [];
  private readonly muzzleFlashes: MuzzleFlashRuntime[] = [];
  private readonly tracers: TracerRuntime[] = [];
  private readonly impacts: ImpactRuntime[] = [];
  private readonly victoryLootMotes: VictoryLootMoteRuntime[] = [];
  private slashArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null = null;
  private spinArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null = null;
  private environmentSceneryRoot: THREE.Group | null = null;
  private environmentTravel: ((distance: number) => void) | null = null;
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
  private cameraShakeStartedAt = -Infinity;
  private cameraShakeEndsAt = -Infinity;
  private cameraShakeAmplitude = 0;
  private lastSnapshotKey = '';
  private continuationEntryPending: boolean;

  constructor(options: BattleRuntimeOptions) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.baseUrl = options.baseUrl;
    this.stageNumber = options.stageNumber;
    this.waveIndex = options.waveIndex;
    this.allyConfigs = options.allies;
    this.enemyConfigs = options.enemies;
    this.onSnapshot = options.onSnapshot;
    this.continuationEntryPending = shouldUseMarchEntry(options.stageNumber, options.waveIndex);
  }

  async initialize(): Promise<void> {
    if (this.initialized || this.disposed) return;
    this.initialized = true;

    this.camera.position.copy(CAMERA_BASE_POSITION);
    this.camera.lookAt(CAMERA_LOOK_AT);

    const environment = createBattleEnvironment(this.scene, this.stageNumber, this.waveIndex);
    this.environmentSceneryRoot = environment.sceneryRoot;
    this.environmentTravel = environment.setTravelDistance;
    this.createSlashArc();

    const [loadedAllies, loadedEnemies] = await Promise.all([
      Promise.all(this.allyConfigs.map((config) => this.loadUnit(config))),
      Promise.all(this.enemyConfigs.map((config) => this.loadEnemy(config))),
    ]);

    if (this.disposed) return;
    this.allies.push(...loadedAllies);
    this.enemies.push(...loadedEnemies);
    this.allies.forEach((ally) => this.facePoint(ally, TARGET_HOME));
    this.startBattle(this.rawNow + 0.15);
    this.emitSnapshot(true);
  }

  tick(rawNow: number): void {
    if (!this.initialized || this.disposed) return;
    this.rawNow = rawNow;
    if (this.allies.length === 0) return;
    const hitStopActive = rawNow < this.hitStopEndsAt;
    const simulationNow = this.getSimulationTime(rawNow);
    this.simulationNow = simulationNow;

    if (!hitStopActive) {
      if (this.phase === 'approach') this.updateApproach(simulationNow);
      else if (this.phase === 'combat') this.updateCombat(simulationNow);
      else if (this.phase === 'result') this.updateResult(simulationNow);

      this.allies.forEach((ally) => this.updateAllyDefeat(ally, simulationNow));
      this.updateProjectiles(simulationNow);
      this.updateEnemyProjectiles(simulationNow);
      this.updateMuzzleFlashes(simulationNow);
      this.updateTracers(simulationNow);
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

  private enemyHome(formationSlot: EnemyFormationSlot): THREE.Vector3 {
    return ENEMY_FORMATION_POSITIONS[formationSlot].clone();
  }

  /** Load each authored enemy GLB once per battle runtime, then clone its scene for each unit. */
  private loadEnemyTemplate(asset: string): Promise<THREE.Group> {
    const cached = this.enemyTemplatePromises.get(asset);
    if (cached !== undefined) return cached;
    const promise = this.loader
      .loadAsync(`${this.baseUrl}${asset}`)
      .then((gltf) => gltf.scene as THREE.Group);
    this.enemyTemplatePromises.set(asset, promise);
    return promise;
  }

  private async loadEnemy(config: BattleRuntimeEnemyConfig): Promise<EnemyUnit> {
    const home = this.enemyHome(config.formationSlot);
    const template = await this.loadEnemyTemplate(config.asset);
    const root = template.clone(true) as THREE.Group;
    root.name = `EnemyRuntime:${config.enemyId}:${config.instanceIndex}`;
    root.position.copy(home);
    root.scale.setScalar(config.renderScale);
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    const bodyRoot = root.getObjectByName('BodyRoot') ?? root;
    const faceRoot = root.getObjectByName('FaceRoot') ?? null;
    const effectOrigin = root.getObjectByName('EffectOrigin') ?? null;
    const motionProfile = getEnemyMotionProfile(config.behaviorId);
    const rigParts = resolveEnemyRigParts(root);
    const rigRest = captureEnemyRigRestPose(rigParts);
    const normalEyes = ['Eye_L', 'Eye_R']
      .map((name) => root.getObjectByName(name))
      .filter((eye): eye is THREE.Object3D => Boolean(eye));
    const xEyes = this.createEnemyDefeatEyes(normalEyes);
    this.setEnemyDefeatEyes(normalEyes, xEyes, false);
    this.scene.add(root);
    const shadow = this.makeShadow(config.shadowRadius);
    shadow.position.set(home.x, 0.011, home.z);

    return {
      id: `enemy-${config.enemyId}-${config.instanceIndex + 1}`,
      side: 'enemy', enemyId: config.enemyId, name: config.name, behaviorId: config.behaviorId,
      scaleClass: config.scaleClass, formationSlot: config.formationSlot, index: config.instanceIndex, root, bodyRoot,
      bodyBaseScale: bodyRoot.scale.clone(), faceRoot,
      faceBasePosition: faceRoot?.position.clone() ?? new THREE.Vector3(),
      faceBaseScale: faceRoot?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
      effectOrigin, motionProfile, rigParts, rigRest, shadow, home,
      baseScale: config.renderScale, maxHp: config.maxHp, hp: config.maxHp, moveSpeed: config.moveSpeed,
      attackRange: config.attackRange, attackInterval: config.attackInterval, attackDamage: config.attackDamage,
      initialAttackDelay: config.initialAttackDelay,
      alive: true, state: 'idle', defeatStartedAt: -Infinity, hitStartedAt: -Infinity,
      attackStartedAt: -Infinity, attackOrigin: home.clone(), attackTarget: null, attackHitApplied: false,
      nextAttackAt: 0, lastUpdateAt: 0, normalEyes, xEyes,
    };
  }

  private createEnemyDefeatEyes(normalEyes: readonly THREE.Object3D[]): THREE.Object3D[] {
    if (normalEyes.length !== 2) return [];
    const material = new THREE.MeshBasicMaterial({ color: '#261d2b' });
    const geometry = new THREE.BoxGeometry(0.072, 0.020, 0.018);
    return normalEyes.flatMap((eye) => {
      if (eye.parent === null) return [];
      const group = new THREE.Group();
      group.name = `${eye.name}_DefeatX`;
      group.position.copy(eye.position);
      group.position.z += 0.022;
      for (const rotation of [-Math.PI / 4, Math.PI / 4]) {
        const bar = new THREE.Mesh(geometry, material);
        bar.rotation.z = rotation;
        group.add(bar);
      }
      group.visible = false;
      eye.parent.add(group);
      return [group];
    });
  }

  private setEnemyDefeatEyes(normalEyes: readonly THREE.Object3D[], xEyes: readonly THREE.Object3D[], defeated: boolean): void {
    normalEyes.forEach((eye) => { eye.visible = !defeated; });
    xEyes.forEach((eye) => { eye.visible = defeated; });
  }

  private createSlashArc(): void {
    const arc = createSwordSlashArc();
    this.scene.add(arc);
    this.slashArc = arc;

    const spinArc = createGreatswordSpinArc();
    this.scene.add(spinArc);
    this.spinArc = spinArc;
  }

  private createArrowMesh(): THREE.Group {
    return createSlimeArrowMesh();
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

  private createVictoryLootMotes(): void {
    this.clearVictoryLootMotes();
    if (this.enemies.length === 0) return;
    const geometry = new THREE.OctahedronGeometry(0.055, 0);
    const colors = ['#ffd76a', '#9ae880', '#fff0ad'] as const;
    const count = Math.min(14, Math.max(7, this.enemies.length * 2));
    for (let index = 0; index < count; index += 1) {
      const source = this.enemies[index % this.enemies.length]!;
      const material = new THREE.MeshBasicMaterial({
        color: colors[index % colors.length]!,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const angle = index * 2.399963229728653;
      const start = source.root.position.clone();
      start.x += Math.cos(angle) * (0.08 + (index % 3) * 0.035);
      start.y = 0.12 + (index % 2) * 0.035;
      start.z += Math.sin(angle) * 0.07;
      const end = new THREE.Vector3(
        ((index % 3) - 1) * 0.16,
        0.22 + (index % 2) * 0.04,
        -0.28 + (index % 4) * 0.035,
      );
      mesh.position.copy(start);
      mesh.visible = false;
      this.scene.add(mesh);
      this.victoryLootMotes.push({ mesh, start, end, delay: (index % 5) * 0.045 });
    }
  }

  private updateVictoryLootMotes(elapsed: number, visibility: number): void {
    for (let index = 0; index < this.victoryLootMotes.length; index += 1) {
      const mote = this.victoryLootMotes[index]!;
      const local = clamp01((elapsed - 0.18 - mote.delay) / 0.78);
      const active = visibility > 0.001 && local > 0 && local < 1;
      mote.mesh.visible = active;
      if (!active) continue;
      const eased = easeOutCubic(local);
      mote.mesh.position.lerpVectors(mote.start, mote.end, eased);
      mote.mesh.position.y += Math.sin(local * Math.PI) * 0.46;
      mote.mesh.rotation.x = elapsed * 5.4 + index * 0.31;
      mote.mesh.rotation.y = elapsed * 6.8 + index * 0.47;
      mote.mesh.scale.setScalar(0.72 + Math.sin(local * Math.PI) * 0.58);
      mote.mesh.material.opacity = visibility * Math.sin(local * Math.PI);
    }
  }

  private clearVictoryLootMotes(): void {
    const geometry = this.victoryLootMotes[0]?.mesh.geometry ?? null;
    for (const mote of this.victoryLootMotes) {
      this.scene.remove(mote.mesh);
      mote.mesh.material.dispose();
    }
    geometry?.dispose();
    this.victoryLootMotes.length = 0;
  }

  private updateVictoryMarch(ally: AllyUnit, now: number): void {
    if (!ally.alive) return;
    const elapsed = Math.max(0, now - this.phaseStartedAt);
    const pose = getVictoryTransitionPose(elapsed, ally.slotIndex);
    const slot = getVictoryMarchSlot(ally.slotIndex);
    this.tempVector.set(slot.x, 0.02, slot.z);
    ally.root.position.lerpVectors(ally.resultOrigin, this.tempVector, pose.formationBlend);
    ally.root.position.y = THREE.MathUtils.lerp(ally.resultOrigin.y, 0.02, pose.formationBlend) + pose.bob;
    ally.root.scale.setScalar(SCALE);
    ally.root.rotation.z = 0;
    ally.body.scale.copy(ally.bodyBaseScale);
    this.resetBranchAccents(ally);
    if (ally.faceRoot) ally.faceRoot.position.copy(ally.faceBasePosition);
    this.applyUnitDeformation(ally, 0, pose.stretch, pose.lean, Math.sin(elapsed * 3.9 + ally.slotIndex) * 0.025, pose.bob);
    this.setEquipmentSwing(ally, Math.sin(elapsed * 7.8 + ally.slotIndex * 0.82) * 0.075, pose.bob * 0.18, 0);
    this.tempVector2.set(ally.root.position.x, 0, ally.root.position.z - 1);
    this.facePoint(ally, this.tempVector2);
  }

  private async loadUnit(config: BattleRuntimeAllyConfig): Promise<AllyUnit> {
    const home = this.allyHome(config.slotIndex);
    const combatAnchor = config.formationRole === 'front'
      ? this.meleeCombatAnchor(config.slotIndex)
      : home.clone();
    const marchSlot = getVictoryMarchSlot(config.slotIndex);
    const approachOrigin = this.continuationEntryPending
      ? new THREE.Vector3(marchSlot.x, 0.02, marchSlot.z)
      : home.clone();
    const gltf = await this.loader.loadAsync(`${this.baseUrl}${config.asset}`);
    const root = gltf.scene as THREE.Group;
    root.name = `SlimeRuntime:${config.slimeId}:${config.slotIndex}`;
    root.scale.setScalar(SCALE);
    root.position.copy(approachOrigin);
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    const body = root.getObjectByName('Body') as MorphMesh | null;
    const faceRoot = root.getObjectByName('FaceRoot') ?? null;
    const equipmentAnchor = root.getObjectByName(config.equipmentAnchorName) ?? null;
    const secondaryEquipmentAnchor = root.getObjectByName('OffhandAnchor') ?? null;
    const mageRuneAnchor = root.getObjectByName('MageRuneAnchor') ?? null;
    const weaponTip = config.weaponTipName === null ? null : root.getObjectByName(config.weaponTipName) ?? null;
    const projectileOrigin = root.getObjectByName('ProjectileOrigin') ?? null;
    const spellOrigin = root.getObjectByName('SpellOrigin') ?? null;
    if (!body?.morphTargetDictionary || !equipmentAnchor) {
      throw new Error(`${config.slimeId} model is missing runtime anchors (${config.equipmentAnchorName}).`);
    }

    const shadow = this.makeShadow(0.24);
    shadow.position.set(approachOrigin.x, 0.011, approachOrigin.z);
    const healthBar = this.createWorldHealthBar();
    const guardPulseVfx = config.behaviorId === 'guardian-guard' ? createGuardPulseVfx() : null;
    if (guardPulseVfx) this.scene.add(guardPulseVfx);
    const mageCastSigil = config.behaviorId === 'mage-aoe' ? createMageCastSigil() : null;
    if (mageCastSigil) this.scene.add(mageCastSigil);
    const rogueSlashArc = config.behaviorId === 'rogue-twin-strike' ? createRogueSlashArc() : null;
    if (rogueSlashArc) this.scene.add(rogueSlashArc);
    const unit: AllyUnit = {
      id: `ally-${config.slimeId}-${config.slotIndex}`,
      slimeId: config.slimeId,
      slotIndex: config.slotIndex,
      side: 'ally',
      behaviorId: config.behaviorId,
      fusionRank: config.fusionRank,
      root,
      body,
      faceRoot,
      equipmentAnchor,
      secondaryEquipmentAnchor,
      mageRuneAnchor,
      guardPulseVfx,
      mageCastSigil,
      rogueSlashArc,
      weaponTip,
      projectileOrigin,
      spellOrigin,
      equipmentBaseQuaternion: equipmentAnchor.quaternion.clone(),
      equipmentBasePosition: equipmentAnchor.position.clone(),
      secondaryEquipmentBaseQuaternion: secondaryEquipmentAnchor?.quaternion.clone() ?? new THREE.Quaternion(),
      secondaryEquipmentBasePosition: secondaryEquipmentAnchor?.position.clone() ?? new THREE.Vector3(),
      mageRuneBaseQuaternion: mageRuneAnchor?.quaternion.clone() ?? new THREE.Quaternion(),
      mageRuneBaseScale: mageRuneAnchor?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
      bodyBaseScale: body.scale.clone(),
      faceBasePosition: faceRoot?.position.clone() ?? new THREE.Vector3(),
      shadow,
      healthBar,
      home,
      combatAnchor,
      approachOrigin,
      resultOrigin: approachOrigin.clone(),
      maxHp: config.maxHp,
      hp: config.maxHp,
      alive: true,
      state: 'idle',
      defeatStartedAt: -Infinity,
      hitStartedAt: -Infinity,
      nextAttackAt: 0,
      attackStartedAt: -Infinity,
      attackTarget: null,
      hitsApplied: 0,
      shotApplied: false,
      normalEyes: [],
      xEyes: [],
    };
    const eyes = this.createDefeatEyes(unit);
    unit.normalEyes = eyes.normalEyes;
    unit.xEyes = eyes.xEyes;
    this.scene.add(root);
    return unit;
  }

  private allyHome(slotIndex: number): THREE.Vector3 {
    return (ALLY_HOME_POSITIONS[slotIndex] ?? ALLY_HOME_POSITIONS[ALLY_HOME_POSITIONS.length - 1]!).clone();
  }

  private meleeCombatAnchor(slotIndex: number): THREE.Vector3 {
    return (MELEE_COMBAT_POSITIONS[slotIndex] ?? MELEE_COMBAT_POSITIONS[MELEE_COMBAT_POSITIONS.length - 1]!).clone();
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
    applyDeformationPose(unit.body, unit.faceRoot, { squash, stretch, lean, wobble, jump });
    const airborne = clamp01(jump / 0.16);
    const airScale = THREE.MathUtils.lerp(1, 0.66, airborne);
    unit.shadow.position.x = unit.root.position.x;
    unit.shadow.position.z = unit.root.position.z + 0.01;
    unit.shadow.scale.set(1.35 * airScale, 0.68 * airScale, 1);
    unit.shadow.material.opacity = THREE.MathUtils.lerp(0.22, 0.08, airborne);
  }

  private equipmentKindFor(unit: AllyUnit): SlimeEquipmentMotionKind {
    switch (unit.behaviorId) {
      case 'bow-ranged':
      case 'ranger-double-shot': return 'bow';
      case 'fighter-combo': return 'sword';
      case 'shield-defender':
      case 'guardian-guard': return 'shield';
      case 'wand-magic':
      case 'mage-aoe': return 'wand';
      case 'dagger-skirmisher':
      case 'rogue-twin-strike': return 'dagger';
      case 'gun-ranged':
      case 'gunner-burst': return 'gun';
      default: return 'sword';
    }
  }

  private isMeleeBehavior(unit: AllyUnit): boolean {
    return unit.behaviorId === 'sword-melee' || unit.behaviorId === 'fighter-combo' || unit.behaviorId === 'shield-defender' || unit.behaviorId === 'guardian-guard' || unit.behaviorId === 'dagger-skirmisher' || unit.behaviorId === 'rogue-twin-strike';
  }

  private setEquipmentSwing(unit: AllyUnit, angle: number, lift = 0, sweep = 0): void {
    applyEquipmentPose(
      unit.equipmentAnchor,
      unit.equipmentBaseQuaternion,
      unit.equipmentBasePosition,
      this.equipmentKindFor(unit),
      { angle, lift, sweep },
    );
  }


  private setSecondaryEquipmentSwing(unit: AllyUnit, angle: number, lift = 0, sweep = 0): void {
    applyEquipmentPose(
      unit.secondaryEquipmentAnchor,
      unit.secondaryEquipmentBaseQuaternion,
      unit.secondaryEquipmentBasePosition,
      'dagger',
      { angle, lift, sweep },
    );
  }

  private resetBranchAccents(unit: AllyUnit): void {
    this.setSecondaryEquipmentSwing(unit, 0);
    applyMageRunePose(unit.mageRuneAnchor, unit.mageRuneBaseQuaternion, unit.mageRuneBaseScale, 0, 0);
    applyGuardPulseVfx(unit.guardPulseVfx, 0, 1);
    applyMageCastSigil(unit.mageCastSigil, 0, 0);
    if (unit.rogueSlashArc) { unit.rogueSlashArc.visible = false; unit.rogueSlashArc.material.opacity = 0; }
  }

  private updateIdle(unit: AllyUnit, now: number, phaseOffset = 0): void {
    if (!unit.alive) return;
    unit.body.scale.copy(unit.bodyBaseScale);
    this.resetBranchAccents(unit);
    if (unit.faceRoot) unit.faceRoot.position.copy(unit.faceBasePosition);
    const pose = getIdleMotion(now, phaseOffset);
    this.applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
  }

  private updateHopTravel(unit: AllyUnit, now: number, startTime: number, start: THREE.Vector3, end: THREE.Vector3, duration: number): boolean {
    const u = clamp01((now - startTime) / duration);
    const pose = getHopTravelMotion(u);
    unit.root.position.lerpVectors(start, end, pose.eased);
    unit.root.position.y = THREE.MathUtils.lerp(start.y, end.y, pose.eased) + pose.deformation.jump;
    this.applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    this.facePoint(unit, end);
    return u >= 1;
  }

  private getLivingEnemies(): EnemyUnit[] {
    return this.enemies.filter((enemy) => enemy.alive);
  }

  private getLivingAllies(): AllyUnit[] {
    return this.allies.filter((ally) => ally.alive);
  }

  private getSafeMeleeForwardOffset(anchor: THREE.Vector3, direction: THREE.Vector3, desiredOffset: number): number {
    if (desiredOffset <= 0) return desiredOffset;
    let safeOffset = desiredOffset;
    for (const enemy of this.getLivingEnemies()) {
      const dx = anchor.x - enemy.root.position.x;
      const dz = anchor.z - enemy.root.position.z;
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
    // Melee attack animations temporarily move the visual root. Enemies navigate toward the
    // stable combat anchor so repeated attacks cannot drag both sides into the same point.
    if (this.isMeleeBehavior(target) && this.phase === 'combat') return target.combatAnchor;
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
    unit.healthBar.visible = unit.root.visible
      && (unit.alive || unit.state === 'defeat')
      && !(this.phase === 'result' && this.result === 'victory');
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
    source: 'melee' | 'projectile' | 'enemy',
    sourcePosition: THREE.Vector3,
  ): void {
    if (!target.alive) return;
    target.hp = Math.max(0, target.hp - amount);
    target.hitStartedAt = this.simulationNow;
    this.tempVector.copy(target.root.position);
    this.tempVector.y += target.side === 'enemy' ? 0.28 : 0.22;
    const impactSize = target.side === 'enemy' ? (source === 'melee' ? 0.082 : 0.11) : 0.09;
    this.createImpact(this.tempVector, target.side === 'enemy' ? '#fff0a0' : '#ffb4a8', impactSize);
    this.startCameraShake(0.12, target.side === 'enemy' ? 0.025 : 0.017);
    if (source !== 'projectile') this.startHitStop(source === 'enemy' ? 0.028 : 0.038);

    if (target.side === 'enemy') {
      this.tempVector2.copy(target.root.position).sub(sourcePosition).setY(0);
      if (this.tempVector2.lengthSq() > 0.0001) {
        this.tempVector2.normalize();
        const knockback = target.hp <= 0
          ? (source === 'projectile' ? 0.10 : 0.16)
          : (source === 'projectile' ? 0.026 : 0.066);
        target.root.position.addScaledVector(this.tempVector2, knockback);
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
    this.resetBranchAccents(unit);
    this.setDefeatEyes(unit, true);
  }

  private beginEnemyDefeat(enemy: EnemyUnit): void {
    if (!enemy.alive) return;
    enemy.alive = false;
    enemy.state = 'defeat';
    enemy.defeatStartedAt = this.simulationNow;
    enemy.attackOrigin.copy(enemy.root.position);
    enemy.attackStartedAt = -Infinity;
    enemy.attackTarget = null;
    this.setEnemyDefeatEyes(enemy.normalEyes, enemy.xEyes, true);
  }

  private updateAllyDefeat(unit: AllyUnit, now: number): void {
    if (unit.state !== 'defeat') return;
    const u = clamp01((now - unit.defeatStartedAt) / SLIME_MOTION_TIMING.allyDefeat);
    const side = unit.slotIndex % 2 === 0 ? -1 : 1;
    const pose = getAllyDefeatMotion(u, side);
    unit.root.position.y = THREE.MathUtils.lerp(unit.root.position.y, 0.005, 0.18);
    unit.root.rotation.z = pose.rootRotationZ;
    unit.body.scale.set(
      unit.bodyBaseScale.x * pose.bodyScaleX,
      unit.bodyBaseScale.y * pose.bodyScaleY,
      unit.bodyBaseScale.z * pose.bodyScaleZ,
    );
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
  }

  private updateEnemyDefeat(enemy: EnemyUnit, now: number): void {
    if (enemy.state !== 'defeat') return;
    const u = clamp01((now - enemy.defeatStartedAt) / enemy.motionProfile.defeatDuration);
    const side = enemy.index % 2 === 0 ? -1 : 1;
    const pose = enemy.motionProfile.defeat(u, side);
    enemy.root.rotation.z = pose.rotationZ;
    enemy.root.position.x = enemy.attackOrigin.x + pose.lateralDrift;
    enemy.root.position.z = enemy.attackOrigin.z - pose.backwardDrift;
    enemy.root.position.y = pose.yOffset;
    // Collapse the mushroom body only. FaceRoot is a sibling of BodyRoot in the authored GLB,
    // so keeping the root uniformly scaled preserves the tiny embroidered face while the cap/body
    // visibly squashes into the ground.
    enemy.root.scale.setScalar(enemy.baseScale * pose.opacity);
    enemy.bodyRoot.scale.set(
      enemy.bodyBaseScale.x * pose.scaleX,
      enemy.bodyBaseScale.y * pose.scaleY,
      enemy.bodyBaseScale.z * pose.scaleZ,
    );
    applyEnemySecondaryPose(enemy.rigParts, enemy.rigRest, pose.secondary);
    if (enemy.faceRoot) {
      enemy.faceRoot.position.copy(enemy.faceBasePosition);
      enemy.faceRoot.position.y += 0.055 * Math.sin(Math.min(1, u / 0.72) * Math.PI * 0.5);
      enemy.faceRoot.position.z += 0.38 * Math.sin(Math.min(1, u / 0.72) * Math.PI * 0.5);
      enemy.faceRoot.scale.copy(enemy.faceBaseScale);
    }
    enemy.shadow.material.opacity = 0.22 * pose.opacity;
    if (u >= 1) {
      enemy.root.visible = false;
      enemy.shadow.visible = false;
      enemy.state = 'dead';
    }
  }

  private startBattle(now: number): void {
    this.phase = 'approach';
    this.phaseStartedAt = now;
    if (this.environmentSceneryRoot) this.environmentSceneryRoot.position.z = getSceneryApproachOffset(0);
    this.environmentTravel?.(0);
    this.clearVictoryLootMotes();
    this.result = null;
    this.allies.forEach((ally) => {
      ally.attackStartedAt = -Infinity;
      ally.attackTarget = null;
      ally.hitsApplied = 0;
      ally.shotApplied = false;
      ally.nextAttackAt = now + ((ally.behaviorId === 'bow-ranged' || ally.behaviorId === 'ranger-double-shot' || ally.behaviorId === 'mage-aoe' || ally.behaviorId === 'gunner-burst') ? 0.65 : 1.7) + ally.slotIndex * 0.05;
      const firstEnemy = this.findNearest(ally, this.getLivingEnemies());
      if (firstEnemy) this.facePoint(ally, firstEnemy.root.position);
    });
    this.enemies.forEach((enemy) => {
      enemy.nextAttackAt = now + 0.82 + enemy.initialAttackDelay;
      enemy.lastUpdateAt = now;
    });
    this.emitSnapshot(true);
  }

  private updateApproach(now: number): void {
    const duration = 1.55;
    const approachElapsed = now - this.phaseStartedAt;
    if (this.environmentSceneryRoot) this.environmentSceneryRoot.position.z = getSceneryApproachOffset(approachElapsed);
    this.allies.forEach((ally) => {
      if (!ally.alive) return;
      const destination = this.isMeleeBehavior(ally) ? ally.combatAnchor : ally.home;
      if (this.continuationEntryPending) {
        this.updateHopTravel(ally, now, this.phaseStartedAt, ally.approachOrigin, destination, duration);
      } else if (this.isMeleeBehavior(ally)) {
        this.updateHopTravel(ally, now, this.phaseStartedAt, ally.home, ally.combatAnchor, duration);
      } else {
        ally.root.position.copy(ally.home);
        this.updateIdle(ally, now, 1.1 + ally.slotIndex * 0.31);
        const target = this.findNearest(ally, this.getLivingEnemies());
        if (target) this.facePoint(ally, target.root.position);
      }
    });
    this.enemies.forEach((enemy) => this.updateEnemyApproachIdle(enemy, now));
    if (now - this.phaseStartedAt >= duration) {
      this.allies.forEach((ally) => {
        ally.root.position.copy(this.isMeleeBehavior(ally) ? ally.combatAnchor : ally.home);
        ally.nextAttackAt = now + (this.isMeleeBehavior(ally) ? 0.12 : 0.2 + ally.slotIndex * 0.06);
      });
      if (this.environmentSceneryRoot) this.environmentSceneryRoot.position.z = 0;
      this.phase = 'combat';
      this.phaseStartedAt = now;
      this.continuationEntryPending = false;
      this.enemies.forEach((enemy) => {
        enemy.attackStartedAt = -Infinity;
        enemy.attackTarget = null;
        enemy.attackHitApplied = false;
        enemy.nextAttackAt = now + enemy.initialAttackDelay;
        enemy.lastUpdateAt = now;
      });
      this.emitSnapshot(true);
    }
  }

  private updateCombat(now: number): void {
    this.allies.forEach((ally) => {
      if (ally.behaviorId === 'sword-melee') this.updateSword(now, ally);
      else if (ally.behaviorId === 'fighter-combo') this.updateFighter(now, ally);
      else if (ally.behaviorId === 'bow-ranged') this.updateBow(now, ally);
      else if (ally.behaviorId === 'ranger-double-shot') this.updateRanger(now, ally);
      else if (ally.behaviorId === 'shield-defender') this.updateShield(now, ally);
      else if (ally.behaviorId === 'guardian-guard') this.updateGuardian(now, ally);
      else if (ally.behaviorId === 'wand-magic') this.updateWand(now, ally);
      else if (ally.behaviorId === 'mage-aoe') this.updateMage(now, ally);
      else if (ally.behaviorId === 'dagger-skirmisher') this.updateDagger(now, ally);
      else if (ally.behaviorId === 'rogue-twin-strike') this.updateRogue(now, ally);
      else if (ally.behaviorId === 'gun-ranged') this.updateGun(now, ally);
      else if (ally.behaviorId === 'gunner-burst') this.updateGunner(now, ally);
    });
    this.enemies.forEach((enemy) => this.updateEnemyUnit(enemy, now));
  }

  private updateSword(now: number, sword: AllyUnit): void {
    if (!sword.alive) return;
    const fusionRank = sword.fusionRank;
    const greatsword = isGreatswordRank(fusionRank);

    if (sword.attackStartedAt !== -Infinity && !sword.attackTarget?.alive) {
      const replacement = greatsword ? this.findNearest(sword, this.getLivingEnemies()) : null;
      if (replacement) {
        sword.attackTarget = replacement;
      } else {
        sword.attackStartedAt = -Infinity;
        sword.attackTarget = null;
        sword.hitsApplied = 0;
        sword.root.position.copy(sword.combatAnchor);
        this.setEquipmentSwing(sword, 0);
        this.resetSlash();
        this.resetSpinArc();
      }
    }

    if (sword.attackStartedAt === -Infinity && now >= sword.nextAttackAt) {
      const target = this.findNearest(sword, this.getLivingEnemies());
      if (target) {
        sword.attackStartedAt = now;
        sword.attackTarget = target;
        sword.hitsApplied = 0;
        sword.nextAttackAt = now + 1.08;
      }
    }

    if (sword.attackStartedAt === -Infinity || !sword.attackTarget) {
      sword.root.position.copy(sword.combatAnchor);
      this.updateIdle(sword, now, 0.2 + sword.slotIndex * 0.23);
      const target = this.findNearest(sword, this.getLivingEnemies());
      if (target) this.facePoint(sword, target.root.position);
      this.resetSpinArc();
      return;
    }

    if (greatsword) {
      this.updateGreatswordAttack(now, sword, sword.attackTarget, fusionRank);
      return;
    }

    const duration = SLIME_MOTION_TIMING.swordAttack;
    const u = clamp01((now - sword.attackStartedAt) / duration);
    const target = sword.attackTarget;
    const pose = getSwordAttackMotion(u);
    let bodyOffset = pose.bodyOffset;

    this.tempVector.copy(target.root.position).sub(sword.combatAnchor).setY(0);
    const targetDistanceFromAnchor = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    if (bodyOffset > 0) {
      bodyOffset = Math.min(bodyOffset, Math.max(0, targetDistanceFromAnchor - MELEE_BODY_GAP));
      bodyOffset = this.getSafeMeleeForwardOffset(sword.combatAnchor, this.tempVector, bodyOffset);
    }
    sword.root.position.copy(sword.combatAnchor).addScaledVector(this.tempVector, bodyOffset);
    this.facePoint(sword, target.root.position);
    this.applyUnitDeformation(sword, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(sword, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    sword.root.updateMatrixWorld(true);

    if (pose.releaseProgress >= 0 && sword.weaponTip) {
      sword.weaponTip.getWorldPosition(this.tempVector3);
      const slashVfx = getSwordSlashVfxPose(pose.releaseProgress);
      if (this.slashArc) {
        this.slashArc.visible = slashVfx.visible;
        this.slashArc.position.copy(this.tempVector3);
        this.slashArc.position.y += 0.012;
        this.slashArc.quaternion.copy(this.camera.quaternion);
        this.slashArc.rotation.z = slashVfx.rotationZ;
        this.slashArc.scale.set(slashVfx.scaleX, slashVfx.scaleY, 1);
        this.slashArc.material.opacity = slashVfx.opacity;
      }

      if (pose.releaseProgress >= SLIME_MOTION_THRESHOLDS.swordHitReleaseProgress && sword.hitsApplied === 0 && target.alive) {
        sword.hitsApplied = 1;
        this.applyDamage(target, 2, 'melee', sword.root.position);
      }
    } else {
      this.resetSlash();
    }

    if (u >= 1 || !target.alive) this.finishSwordAttack(now, sword, target);
  }

  private updateFighter(now: number, fighter: AllyUnit): void {
    if (!fighter.alive) return;
    if (fighter.attackStartedAt !== -Infinity && !fighter.attackTarget?.alive) {
      fighter.attackStartedAt = -Infinity;
      fighter.attackTarget = null;
      fighter.hitsApplied = 0;
      fighter.root.position.copy(fighter.combatAnchor);
      this.setEquipmentSwing(fighter, 0);
      this.resetSlash();
    }
    if (fighter.attackStartedAt === -Infinity && now >= fighter.nextAttackAt) {
      const target = this.findNearest(fighter, this.getLivingEnemies());
      if (target) {
        fighter.attackStartedAt = now;
        fighter.attackTarget = target;
        fighter.hitsApplied = 0;
      }
    }
    if (fighter.attackStartedAt === -Infinity || !fighter.attackTarget) {
      fighter.root.position.copy(fighter.combatAnchor);
      this.updateIdle(fighter, now, 0.32 + fighter.slotIndex * 0.21);
      const target = this.findNearest(fighter, this.getLivingEnemies());
      if (target) this.facePoint(fighter, target.root.position);
      this.resetSlash();
      return;
    }

    const target = fighter.attackTarget;
    const u = clamp01((now - fighter.attackStartedAt) / SLIME_MOTION_TIMING.fighterAttack);
    const pose = getFighterAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(fighter.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    let offset = pose.bodyOffset;
    if (offset > 0) {
      offset = Math.min(offset, Math.max(0, distance - MELEE_BODY_GAP));
      offset = this.getSafeMeleeForwardOffset(fighter.combatAnchor, this.tempVector, offset);
    }
    fighter.root.position.copy(fighter.combatAnchor).addScaledVector(this.tempVector, offset);
    this.facePoint(fighter, target.root.position);
    this.applyUnitDeformation(fighter, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(fighter, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    fighter.root.updateMatrixWorld(true);

    if (pose.releaseProgress >= 0 && fighter.weaponTip) {
      fighter.weaponTip.getWorldPosition(this.tempVector3);
      const slashVfx = getSwordSlashVfxPose(pose.releaseProgress);
      if (this.slashArc) {
        this.slashArc.visible = slashVfx.visible;
        this.slashArc.position.copy(this.tempVector3);
        this.slashArc.position.y += 0.012;
        this.slashArc.quaternion.copy(this.camera.quaternion);
        this.slashArc.rotation.z = pose.slashDirection > 0 ? slashVfx.rotationZ : (-slashVfx.rotationZ - 0.28);
        this.slashArc.scale.set(slashVfx.scaleX, slashVfx.scaleY, 1);
        this.slashArc.material.opacity = slashVfx.opacity;
      }
      if (pose.releaseProgress >= SLIME_MOTION_THRESHOLDS.fighterHitReleaseProgress && fighter.hitsApplied === pose.comboHit && target.alive) {
        const damage = pose.comboHit === 0 ? 1 : 2;
        fighter.hitsApplied += 1;
        this.applyDamage(target, damage, 'melee', fighter.root.position);
      }
    } else {
      this.resetSlash();
    }

    if (u >= 1 || !target.alive) {
      fighter.attackStartedAt = -Infinity;
      fighter.attackTarget = null;
      fighter.hitsApplied = 0;
      fighter.root.position.copy(fighter.combatAnchor);
      this.setEquipmentSwing(fighter, 0);
      this.resetSlash();
      fighter.nextAttackAt = now + 0.46;
    }
  }

  private updateGreatswordAttack(now: number, sword: AllyUnit, target: EnemyUnit, fusionRank: number): void {
    const duration = SLIME_MOTION_TIMING.greatswordAttack;
    const u = clamp01((now - sword.attackStartedAt) / duration);
    const pose = getGreatswordAttackMotion(u);

    sword.root.position.copy(sword.combatAnchor);
    this.facePoint(sword, target.root.position);
    sword.root.rotation.y += pose.rootYawOffset;
    this.applyUnitDeformation(sword, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(sword, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);

    if (this.spinArc) {
      const spinVfx = getGreatswordSpinVfxPose(pose, fusionRank);
      this.spinArc.visible = spinVfx.visible;
      this.tempVector.copy(target.root.position).sub(sword.root.position).setY(0);
      if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
      this.spinArc.position.copy(sword.root.position).addScaledVector(this.tempVector, 0.28);
      this.spinArc.position.y = 0.30;
      this.spinArc.quaternion.copy(this.camera.quaternion);
      this.spinArc.rotation.z = spinVfx.rotationZ;
      this.spinArc.scale.set(spinVfx.scaleX, spinVfx.scaleY, 1);
      this.spinArc.material.opacity = spinVfx.opacity;
    }

    if (pose.slashU >= SLIME_MOTION_THRESHOLDS.greatswordHitSlashU && sword.hitsApplied === 0) {
      sword.hitsApplied = 1;
      const radius = fusionRank >= 4 ? 1.34 : fusionRank >= 3 ? 1.24 : 1.14;
      const damage = fusionRank >= 3 ? 3 : 2;
      this.tempVector.copy(target.root.position).sub(sword.root.position).setY(0);
      if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
      const cosHalfArc = Math.cos(THREE.MathUtils.degToRad(108));
      const targets = this.getLivingEnemies().filter((enemy) => {
        this.tempVector2.copy(enemy.root.position).sub(sword.root.position).setY(0);
        const distanceSq = this.tempVector2.lengthSq();
        if (distanceSq > radius * radius) return false;
        if (distanceSq <= 0.0001) return true;
        this.tempVector2.normalize();
        return this.tempVector.dot(this.tempVector2) >= cosHalfArc;
      });
      for (const enemy of targets) this.applyDamage(enemy, damage, 'melee', sword.root.position);
      this.createImpact(sword.root.position.clone().add(new THREE.Vector3(0, 0.14, 0)), '#fff0a0', 0.10);
      this.startCameraShake(0.11, 0.036);
    }

    if (u >= 1) this.finishSwordAttack(now, sword, target);
  }

  private finishSwordAttack(now: number, sword: AllyUnit, target: EnemyUnit): void {
    sword.attackStartedAt = -Infinity;
    sword.attackTarget = null;
    sword.hitsApplied = 0;
    sword.root.position.copy(sword.combatAnchor);
    this.facePoint(sword, target.root.position);
    this.setEquipmentSwing(sword, 0);
    this.resetSlash();
    this.resetSpinArc();
    sword.nextAttackAt = Math.max(sword.nextAttackAt, now + 0.24);
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


  private updateGuardian(now: number, guardian: AllyUnit): void {
    if (!guardian.alive) return;
    if (guardian.attackStartedAt !== -Infinity && !guardian.attackTarget?.alive) {
      guardian.attackStartedAt = -Infinity;
      guardian.attackTarget = null;
      guardian.hitsApplied = 0;
    }
    if (guardian.attackStartedAt === -Infinity && now >= guardian.nextAttackAt) {
      const target = this.findNearest(guardian, this.getLivingEnemies());
      if (target) {
        guardian.attackStartedAt = now;
        guardian.attackTarget = target;
        guardian.hitsApplied = 0;
      }
    }
    if (guardian.attackStartedAt === -Infinity || !guardian.attackTarget) {
      guardian.root.position.copy(guardian.combatAnchor);
      this.updateIdle(guardian, now, 0.55 + guardian.slotIndex * 0.17);
      const target = this.findNearest(guardian, this.getLivingEnemies());
      if (target) this.facePoint(guardian, target.root.position);
      return;
    }
    const target = guardian.attackTarget;
    const u = clamp01((now - guardian.attackStartedAt) / SLIME_MOTION_TIMING.guardianAttack);
    const pose = getGuardianAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(guardian.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    let offset = pose.bodyOffset;
    if (offset > 0) {
      offset = Math.min(offset, Math.max(0, distance - MELEE_BODY_GAP));
      offset = this.getSafeMeleeForwardOffset(guardian.combatAnchor, this.tempVector, offset);
    }
    guardian.root.position.copy(guardian.combatAnchor).addScaledVector(this.tempVector, offset);
    this.facePoint(guardian, target.root.position);
    this.applyUnitDeformation(guardian, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(guardian, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (guardian.guardPulseVfx) {
      guardian.guardPulseVfx.position.copy(guardian.root.position);
      guardian.guardPulseVfx.position.y = 0.025;
      applyGuardPulseVfx(guardian.guardPulseVfx, pose.guardPulse, pose.guardPulseProgress);
    }
    if (u >= SLIME_MOTION_THRESHOLDS.guardianContactU && guardian.hitsApplied === 0 && target.alive) {
      guardian.hitsApplied = 1;
      this.applyDamage(target, 2, 'melee', guardian.root.position);
      this.startCameraShake(0.08, 0.022);
    }
    if (u >= 1 || !target.alive) {
      guardian.attackStartedAt = -Infinity;
      guardian.attackTarget = null;
      guardian.hitsApplied = 0;
      guardian.root.position.copy(guardian.combatAnchor);
      this.setEquipmentSwing(guardian, 0);
      this.resetBranchAccents(guardian);
      guardian.nextAttackAt = now + 0.72;
    }
  }

  private updateMage(now: number, mage: AllyUnit): void {
    if (!mage.alive) return;
    if (mage.attackStartedAt !== -Infinity && !mage.attackTarget?.alive) {
      mage.attackStartedAt = -Infinity;
      mage.attackTarget = null;
      mage.shotApplied = false;
    }
    if (mage.attackStartedAt === -Infinity && now >= mage.nextAttackAt) {
      const target = this.findNearest(mage, this.getLivingEnemies());
      if (target) {
        mage.attackStartedAt = now;
        mage.attackTarget = target;
        mage.shotApplied = false;
      }
    }
    if (mage.attackStartedAt === -Infinity || !mage.attackTarget) {
      mage.root.position.copy(mage.home);
      this.updateIdle(mage, now, 2.25 + mage.slotIndex * 0.23);
      const target = this.findNearest(mage, this.getLivingEnemies());
      if (target) this.facePoint(mage, target.root.position);
      return;
    }
    const target = mage.attackTarget;
    const u = clamp01((now - mage.attackStartedAt) / SLIME_MOTION_TIMING.mageAttack);
    const pose = getMageAttackMotion(u);
    this.facePoint(mage, target.root.position);
    this.tempVector.copy(target.root.position).sub(mage.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    mage.root.position.copy(mage.home).addScaledVector(this.tempVector, pose.bodyOffset);
    this.applyUnitDeformation(mage, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(mage, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    applyMageRunePose(mage.mageRuneAnchor, mage.mageRuneBaseQuaternion, mage.mageRuneBaseScale, pose.runeRotation, pose.runePulse);
    if (mage.mageCastSigil) {
      mage.root.updateMatrixWorld(true);
      (mage.spellOrigin ?? mage.equipmentAnchor).getWorldPosition(this.tempVector3);
      mage.mageCastSigil.position.copy(this.tempVector3);
      mage.mageCastSigil.quaternion.copy(this.camera.quaternion);
      applyMageCastSigil(mage.mageCastSigil, pose.runePulse, pose.runeRotation);
    }
    if (!mage.shotApplied && u >= SLIME_MOTION_THRESHOLDS.mageReleaseU) {
      mage.shotApplied = true;
      this.fireMagicOrb(mage, target, 0.58, true);
    }
    if (u >= 1) {
      mage.attackStartedAt = -Infinity;
      mage.attackTarget = null;
      mage.root.position.copy(mage.home);
      mage.nextAttackAt = now + 1.05;
      this.setEquipmentSwing(mage, 0);
      this.resetBranchAccents(mage);
    }
  }

  private updateRogue(now: number, rogue: AllyUnit): void {
    if (!rogue.alive) return;
    if (rogue.attackStartedAt !== -Infinity && !rogue.attackTarget?.alive) {
      rogue.attackStartedAt = -Infinity;
      rogue.attackTarget = null;
      rogue.hitsApplied = 0;
    }
    if (rogue.attackStartedAt === -Infinity && now >= rogue.nextAttackAt) {
      const target = this.findNearest(rogue, this.getLivingEnemies());
      if (target) {
        rogue.attackStartedAt = now;
        rogue.attackTarget = target;
        rogue.hitsApplied = 0;
      }
    }
    if (rogue.attackStartedAt === -Infinity || !rogue.attackTarget) {
      rogue.root.position.copy(rogue.combatAnchor);
      this.updateIdle(rogue, now, 1.85 + rogue.slotIndex * 0.21);
      const target = this.findNearest(rogue, this.getLivingEnemies());
      if (target) this.facePoint(rogue, target.root.position);
      return;
    }
    const target = rogue.attackTarget;
    const u = clamp01((now - rogue.attackStartedAt) / SLIME_MOTION_TIMING.rogueAttack);
    const pose = getRogueAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(rogue.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.set(-this.tempVector.z, 0, this.tempVector.x);
    let forward = pose.bodyOffset;
    if (forward > 0) {
      forward = Math.min(forward, Math.max(0, distance - MELEE_BODY_GAP));
      forward = this.getSafeMeleeForwardOffset(rogue.combatAnchor, this.tempVector, forward);
    }
    rogue.root.position.copy(rogue.combatAnchor)
      .addScaledVector(this.tempVector, forward)
      .addScaledVector(this.tempVector2, pose.lateralOffset);
    this.facePoint(rogue, target.root.position);
    this.applyUnitDeformation(rogue, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(rogue, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    this.setSecondaryEquipmentSwing(rogue, pose.secondaryEquipment.angle, pose.secondaryEquipment.lift, pose.secondaryEquipment.sweep);
    rogue.root.updateMatrixWorld(true);
    const slashAnchor = pose.comboHit === 1 ? rogue.secondaryEquipmentAnchor : rogue.equipmentAnchor;
    (slashAnchor ?? rogue.root).getWorldPosition(this.tempVector3);
    this.tempVector3.y += 0.02;
    applyRogueSlashVfx(rogue.rogueSlashArc, pose, this.camera.quaternion, this.tempVector3);
    const hitMask = 1 << pose.comboHit;
    if (pose.hitProgress >= SLIME_MOTION_THRESHOLDS.rogueHitProgress && (rogue.hitsApplied & hitMask) === 0 && target.alive) {
      rogue.hitsApplied |= hitMask;
      this.applyDamage(target, pose.comboHit === 0 ? 1 : 2, 'melee', rogue.root.position);
    }
    if (u >= 1 || !target.alive) {
      rogue.attackStartedAt = -Infinity;
      rogue.attackTarget = null;
      rogue.hitsApplied = 0;
      rogue.root.position.copy(rogue.combatAnchor);
      this.setEquipmentSwing(rogue, 0);
      this.setSecondaryEquipmentSwing(rogue, 0);
      rogue.nextAttackAt = now + 0.30;
    }
  }

  private updateGunner(now: number, gunner: AllyUnit): void {
    if (!gunner.alive) return;
    if (gunner.attackStartedAt !== -Infinity && !gunner.attackTarget?.alive) {
      gunner.attackStartedAt = -Infinity;
      gunner.attackTarget = null;
      gunner.hitsApplied = 0;
    }
    if (gunner.attackStartedAt === -Infinity && now >= gunner.nextAttackAt) {
      const target = this.findNearest(gunner, this.getLivingEnemies());
      if (target) {
        gunner.attackStartedAt = now;
        gunner.attackTarget = target;
        gunner.hitsApplied = 0;
      }
    }
    if (gunner.attackStartedAt === -Infinity || !gunner.attackTarget) {
      gunner.root.position.copy(gunner.home);
      this.updateIdle(gunner, now, 2.85 + gunner.slotIndex * 0.19);
      const target = this.findNearest(gunner, this.getLivingEnemies());
      if (target) this.facePoint(gunner, target.root.position);
      return;
    }
    const target = gunner.attackTarget;
    const u = clamp01((now - gunner.attackStartedAt) / SLIME_MOTION_TIMING.gunnerAttack);
    const pose = getGunnerAttackMotion(u);
    this.facePoint(gunner, target.root.position);
    this.tempVector.copy(target.root.position).sub(gunner.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    gunner.root.position.copy(gunner.home).addScaledVector(this.tempVector, pose.bodyOffset);
    this.applyUnitDeformation(gunner, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(gunner, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    for (const shotIndex of [0, 1, 2] as const) {
      const mask = 1 << shotIndex;
      if (u >= getGunnerShotReleaseU(shotIndex) && (gunner.hitsApplied & mask) === 0) {
        gunner.hitsApplied |= mask;
        this.fireBullet(gunner, target, true);
      }
    }
    if (u >= 1) {
      gunner.attackStartedAt = -Infinity;
      gunner.attackTarget = null;
      gunner.hitsApplied = 0;
      gunner.root.position.copy(gunner.home);
      gunner.nextAttackAt = now + 0.56;
      this.setEquipmentSwing(gunner, 0);
    }
  }

  private updateShield(now: number, shield: AllyUnit): void {
    if (!shield.alive) return;
    if (shield.attackStartedAt !== -Infinity && !shield.attackTarget?.alive) {
      shield.attackStartedAt = -Infinity;
      shield.attackTarget = null;
      shield.hitsApplied = 0;
    }
    if (shield.attackStartedAt === -Infinity && now >= shield.nextAttackAt) {
      const target = this.findNearest(shield, this.getLivingEnemies());
      if (target) {
        shield.attackStartedAt = now;
        shield.attackTarget = target;
        shield.hitsApplied = 0;
      }
    }
    if (shield.attackStartedAt === -Infinity || !shield.attackTarget) {
      shield.root.position.copy(shield.combatAnchor);
      this.updateIdle(shield, now, 0.45 + shield.slotIndex * 0.19);
      const target = this.findNearest(shield, this.getLivingEnemies());
      if (target) this.facePoint(shield, target.root.position);
      return;
    }
    const target = shield.attackTarget;
    const u = clamp01((now - shield.attackStartedAt) / SLIME_MOTION_TIMING.shieldAttack);
    const pose = getShieldAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(shield.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    let offset = pose.bodyOffset;
    if (offset > 0) {
      offset = Math.min(offset, Math.max(0, distance - MELEE_BODY_GAP));
      offset = this.getSafeMeleeForwardOffset(shield.combatAnchor, this.tempVector, offset);
    }
    shield.root.position.copy(shield.combatAnchor).addScaledVector(this.tempVector, offset);
    this.facePoint(shield, target.root.position);
    this.applyUnitDeformation(shield, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(shield, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (u >= SLIME_MOTION_THRESHOLDS.shieldContactU && shield.hitsApplied === 0 && target.alive) {
      shield.hitsApplied = 1;
      this.applyDamage(target, 1, 'melee', shield.root.position);
    }
    if (u >= 1 || !target.alive) {
      shield.attackStartedAt = -Infinity;
      shield.attackTarget = null;
      shield.hitsApplied = 0;
      shield.root.position.copy(shield.combatAnchor);
      this.setEquipmentSwing(shield, 0);
      shield.nextAttackAt = now + 0.58;
    }
  }

  private updateDagger(now: number, dagger: AllyUnit): void {
    if (!dagger.alive) return;
    if (dagger.attackStartedAt !== -Infinity && !dagger.attackTarget?.alive) {
      dagger.attackStartedAt = -Infinity;
      dagger.attackTarget = null;
      dagger.hitsApplied = 0;
    }
    if (dagger.attackStartedAt === -Infinity && now >= dagger.nextAttackAt) {
      const target = this.findNearest(dagger, this.getLivingEnemies());
      if (target) {
        dagger.attackStartedAt = now;
        dagger.attackTarget = target;
        dagger.hitsApplied = 0;
      }
    }
    if (dagger.attackStartedAt === -Infinity || !dagger.attackTarget) {
      dagger.root.position.copy(dagger.combatAnchor);
      this.updateIdle(dagger, now, 1.65 + dagger.slotIndex * 0.27);
      const target = this.findNearest(dagger, this.getLivingEnemies());
      if (target) this.facePoint(dagger, target.root.position);
      return;
    }
    const target = dagger.attackTarget;
    const u = clamp01((now - dagger.attackStartedAt) / SLIME_MOTION_TIMING.daggerAttack);
    const pose = getDaggerAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(dagger.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    let offset = pose.bodyOffset;
    if (offset > 0) {
      offset = Math.min(offset, Math.max(0, distance - MELEE_BODY_GAP));
      offset = this.getSafeMeleeForwardOffset(dagger.combatAnchor, this.tempVector, offset);
    }
    dagger.root.position.copy(dagger.combatAnchor).addScaledVector(this.tempVector, offset);
    this.facePoint(dagger, target.root.position);
    this.applyUnitDeformation(dagger, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(dagger, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (u >= SLIME_MOTION_THRESHOLDS.daggerContactU && dagger.hitsApplied === 0 && target.alive) {
      dagger.hitsApplied = 1;
      this.applyDamage(target, 1, 'melee', dagger.root.position);
    }
    if (u >= 1 || !target.alive) {
      dagger.attackStartedAt = -Infinity;
      dagger.attackTarget = null;
      dagger.hitsApplied = 0;
      dagger.root.position.copy(dagger.combatAnchor);
      this.setEquipmentSwing(dagger, 0);
      dagger.nextAttackAt = now + 0.36;
    }
  }

  private updateWand(now: number, wand: AllyUnit): void {
    if (!wand.alive) return;
    if (wand.attackStartedAt !== -Infinity && !wand.attackTarget?.alive) {
      wand.attackStartedAt = -Infinity;
      wand.attackTarget = null;
      wand.shotApplied = false;
    }
    if (wand.attackStartedAt === -Infinity && now >= wand.nextAttackAt) {
      const target = this.findNearest(wand, this.getLivingEnemies());
      if (target) {
        wand.attackStartedAt = now;
        wand.attackTarget = target;
        wand.shotApplied = false;
      }
    }
    if (wand.attackStartedAt === -Infinity || !wand.attackTarget) {
      wand.root.position.copy(wand.home);
      this.updateIdle(wand, now, 2.05 + wand.slotIndex * 0.29);
      const target = this.findNearest(wand, this.getLivingEnemies());
      if (target) this.facePoint(wand, target.root.position);
      return;
    }
    const target = wand.attackTarget;
    const u = clamp01((now - wand.attackStartedAt) / SLIME_MOTION_TIMING.wandAttack);
    const pose = getWandAttackMotion(u);
    this.facePoint(wand, target.root.position);
    this.tempVector.copy(target.root.position).sub(wand.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    wand.root.position.copy(wand.home).addScaledVector(this.tempVector, pose.bodyOffset);
    this.applyUnitDeformation(wand, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(wand, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (!wand.shotApplied && u >= SLIME_MOTION_THRESHOLDS.wandReleaseU) {
      wand.shotApplied = true;
      this.fireMagicOrb(wand, target);
    }
    if (u >= 1) {
      wand.attackStartedAt = -Infinity;
      wand.attackTarget = null;
      wand.root.position.copy(wand.home);
      wand.nextAttackAt = now + 0.92;
      this.setEquipmentSwing(wand, 0);
    }
  }

  private updateGun(now: number, gun: AllyUnit): void {
    if (!gun.alive) return;
    if (gun.attackStartedAt !== -Infinity && !gun.attackTarget?.alive) {
      gun.attackStartedAt = -Infinity;
      gun.attackTarget = null;
      gun.shotApplied = false;
    }
    if (gun.attackStartedAt === -Infinity && now >= gun.nextAttackAt) {
      const target = this.findNearest(gun, this.getLivingEnemies());
      if (target) {
        gun.attackStartedAt = now;
        gun.attackTarget = target;
        gun.shotApplied = false;
      }
    }
    if (gun.attackStartedAt === -Infinity || !gun.attackTarget) {
      gun.root.position.copy(gun.home);
      this.updateIdle(gun, now, 2.65 + gun.slotIndex * 0.21);
      const target = this.findNearest(gun, this.getLivingEnemies());
      if (target) this.facePoint(gun, target.root.position);
      return;
    }
    const target = gun.attackTarget;
    const u = clamp01((now - gun.attackStartedAt) / SLIME_MOTION_TIMING.gunAttack);
    const pose = getGunAttackMotion(u);
    this.facePoint(gun, target.root.position);
    this.tempVector.copy(target.root.position).sub(gun.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    gun.root.position.copy(gun.home).addScaledVector(this.tempVector, pose.bodyOffset);
    this.applyUnitDeformation(gun, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(gun, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (!gun.shotApplied && u >= SLIME_MOTION_THRESHOLDS.gunReleaseU) {
      gun.shotApplied = true;
      this.fireBullet(gun, target);
    }
    if (u >= 1) {
      gun.attackStartedAt = -Infinity;
      gun.attackTarget = null;
      gun.root.position.copy(gun.home);
      gun.nextAttackAt = now + 0.78;
      this.setEquipmentSwing(gun, 0);
    }
  }

  private fireMagicOrb(wand: AllyUnit, target: EnemyUnit, splashRadius = 0, enhanced = false): void {
    const root = enhanced ? createMageOrbVfx() : createMagicOrbMesh();
    (wand.spellOrigin ?? wand.equipmentAnchor).getWorldPosition(this.tempVector);
    const start = this.tempVector.clone();
    const end = target.root.position.clone().add(new THREE.Vector3(0, 0.28, 0));
    root.position.copy(start);
    root.visible = true;
    this.scene.add(root);
    this.projectiles.push({
      root, start, end, target, startedAt: this.simulationNow,
      duration: SLIME_MOTION_TIMING.magicOrbFlight, hitApplied: false,
      damage: 1, splashRadius, splashDamage: splashRadius > 0 ? 1 : 0, arcHeightScale: 0.45, orientToTravel: false, hitU: 0.92,
    });
  }

  private fireBullet(gun: AllyUnit, target: EnemyUnit, enhanced = false): void {
    const root = createGunBulletMesh();
    (gun.projectileOrigin ?? gun.equipmentAnchor).getWorldPosition(this.tempVector);
    const start = this.tempVector.clone();
    const end = target.root.position.clone().add(new THREE.Vector3(0, 0.25, 0));
    root.position.copy(start);
    root.visible = true;
    this.scene.add(root);
    this.projectiles.push({
      root, start, end, target, startedAt: this.simulationNow,
      duration: SLIME_MOTION_TIMING.bulletFlight, hitApplied: false,
      damage: 1, splashRadius: 0, splashDamage: 0, arcHeightScale: 0, orientToTravel: false, hitU: 0.88,
    });

    const flash = createMuzzleFlashMesh();
    flash.visible = true;
    flash.position.copy(start);
    this.tempVector2.copy(end).sub(start).normalize();
    flash.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.tempVector2);
    flash.material.opacity = 0.95;
    this.scene.add(flash);
    this.muzzleFlashes.push({ mesh: flash, startedAt: this.simulationNow, duration: enhanced ? 0.14 : 0.11 });

    if (enhanced) {
      const tracer = createGunnerTracerMesh();
      this.tempVector2.copy(end).sub(start);
      const distance = this.tempVector2.length();
      if (distance > 0.0001) {
        tracer.visible = true;
        const tracerLength = Math.min(0.72, distance * 0.58);
        this.tempVector3.copy(this.tempVector2).normalize();
        tracer.position.copy(start).addScaledVector(this.tempVector3, tracerLength * 0.5);
        tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.tempVector3);
        tracer.scale.y = tracerLength / 0.20;
        this.scene.add(tracer);
        this.tracers.push({ mesh: tracer, startedAt: this.simulationNow, duration: 0.15 });
      } else {
        tracer.geometry.dispose();
        tracer.material.dispose();
      }
    }
  }

  private updateBow(now: number, bow: AllyUnit): void {
    if (!bow.alive) return;
    if (bow.attackStartedAt !== -Infinity && !bow.attackTarget?.alive) {
      bow.attackStartedAt = -Infinity;
      bow.attackTarget = null;
      bow.shotApplied = false;
    }
    if (bow.attackStartedAt === -Infinity && now >= bow.nextAttackAt) {
      const target = this.findNearest(bow, this.getLivingEnemies());
      if (target) {
        bow.attackStartedAt = now;
        bow.attackTarget = target;
        bow.shotApplied = false;
      }
    }
    if (bow.attackStartedAt === -Infinity || !bow.attackTarget) {
      bow.root.position.copy(bow.home);
      this.updateIdle(bow, now, 1.1 + bow.slotIndex * 0.31);
      const target = this.findNearest(bow, this.getLivingEnemies());
      if (target) this.facePoint(bow, target.root.position);
      return;
    }

    const u = clamp01((now - bow.attackStartedAt) / SLIME_MOTION_TIMING.bowAttack);
    this.facePoint(bow, bow.attackTarget.root.position);
    const pose = getBowAttackMotion(u);
    this.applyUnitDeformation(bow, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(bow, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (!bow.shotApplied && u >= SLIME_MOTION_THRESHOLDS.bowReleaseU) {
      bow.shotApplied = true;
      this.fireArrow(bow, bow.attackTarget);
    }
    if (u >= 1) {
      bow.attackStartedAt = -Infinity;
      bow.attackTarget = null;
      bow.nextAttackAt = now + 1.0;
      this.setEquipmentSwing(bow, 0);
    }
  }

  private updateRanger(now: number, ranger: AllyUnit): void {
    if (!ranger.alive) return;
    if (ranger.attackStartedAt !== -Infinity && !ranger.attackTarget?.alive) {
      ranger.attackStartedAt = -Infinity;
      ranger.attackTarget = null;
      ranger.hitsApplied = 0;
    }
    if (ranger.attackStartedAt === -Infinity && now >= ranger.nextAttackAt) {
      const target = this.findNearest(ranger, this.getLivingEnemies());
      if (target) {
        ranger.attackStartedAt = now;
        ranger.attackTarget = target;
        ranger.hitsApplied = 0;
      }
    }
    if (ranger.attackStartedAt === -Infinity || !ranger.attackTarget) {
      ranger.root.position.copy(ranger.home);
      this.updateIdle(ranger, now, 1.32 + ranger.slotIndex * 0.27);
      const target = this.findNearest(ranger, this.getLivingEnemies());
      if (target) this.facePoint(ranger, target.root.position);
      return;
    }

    const target = ranger.attackTarget;
    const u = clamp01((now - ranger.attackStartedAt) / SLIME_MOTION_TIMING.rangerAttack);
    const pose = getRangerAttackMotion(u);
    this.facePoint(ranger, target.root.position);
    this.tempVector.copy(target.root.position).sub(ranger.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.set(-this.tempVector.z, 0, this.tempVector.x);
    ranger.root.position.copy(ranger.home).addScaledVector(this.tempVector2, pose.lateralOffset);
    this.applyUnitDeformation(ranger, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    this.setEquipmentSwing(ranger, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (pose.shotProgress >= SLIME_MOTION_THRESHOLDS.bowReleaseU && ranger.hitsApplied === pose.shotIndex && target.alive) {
      ranger.hitsApplied += 1;
      ranger.root.updateMatrixWorld(true);
      this.fireArrow(ranger, target);
    }
    if (u >= 1) {
      ranger.attackStartedAt = -Infinity;
      ranger.attackTarget = null;
      ranger.hitsApplied = 0;
      ranger.root.position.copy(ranger.home);
      this.setEquipmentSwing(ranger, 0);
      ranger.nextAttackAt = now + 0.68;
    }
  }

  private fireArrow(bow: AllyUnit, target: EnemyUnit): void {
    const root = this.createArrowMesh();
    (bow.projectileOrigin ?? bow.equipmentAnchor).getWorldPosition(this.tempVector);
    const start = this.tempVector.clone();
    const end = target.root.position.clone().add(new THREE.Vector3(0, 0.28, 0));
    root.position.copy(start);
    this.scene.add(root);
    this.projectiles.push({ root, start, end, target, startedAt: this.simulationNow, duration: SLIME_MOTION_TIMING.arrowFlight, hitApplied: false, damage: 1, splashRadius: 0, splashDamage: 0, arcHeightScale: 1, orientToTravel: true, hitU: SLIME_MOTION_THRESHOLDS.arrowHitU });
  }

  private updateProjectiles(now: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i]!;
      const u = clamp01((now - projectile.startedAt) / projectile.duration);
      const targetPosition = projectile.target.root.position.clone().add(new THREE.Vector3(0, 0.26, 0));
      projectile.end.lerp(targetPosition, 0.22);
      projectile.root.position.lerpVectors(projectile.start, projectile.end, u);
      projectile.root.position.y += getArrowArcHeight(u) * projectile.arcHeightScale;
      if (projectile.orientToTravel) {
        this.tempVector.copy(projectile.end).sub(projectile.start).normalize();
        projectile.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.tempVector);
      }
      if (!projectile.hitApplied && u >= projectile.hitU) {
        projectile.hitApplied = true;
        if (projectile.target.alive) {
          this.applyDamage(projectile.target, projectile.damage, 'projectile', projectile.start);
          if ((projectile.splashRadius ?? 0) > 0) {
            const splashRadiusSq = (projectile.splashRadius ?? 0) ** 2;
            for (const enemy of this.getLivingEnemies()) {
              if (enemy === projectile.target) continue;
              this.tempVector.copy(enemy.root.position).sub(projectile.target.root.position).setY(0);
              if (this.tempVector.lengthSq() <= splashRadiusSq) {
                this.applyDamage(enemy, projectile.splashDamage, 'projectile', projectile.target.root.position);
              }
            }
            this.createImpact(projectile.target.root.position.clone().add(new THREE.Vector3(0, 0.20, 0)), '#b88cff', 0.12);
          }
        }
      }
      if (u >= 1) {
        this.scene.remove(projectile.root);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateMuzzleFlashes(now: number): void {
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i -= 1) {
      const flash = this.muzzleFlashes[i]!;
      const u = clamp01((now - flash.startedAt) / flash.duration);
      flash.mesh.visible = u < 1;
      flash.mesh.scale.setScalar(0.70 + u * 0.55);
      flash.mesh.material.opacity = (1 - u) * 0.95;
      if (u >= 1) {
        this.scene.remove(flash.mesh);
        this.muzzleFlashes.splice(i, 1);
      }
    }
  }

  private updateTracers(now: number): void {
    for (let i = this.tracers.length - 1; i >= 0; i -= 1) {
      const tracer = this.tracers[i]!;
      const u = clamp01((now - tracer.startedAt) / tracer.duration);
      tracer.mesh.material.opacity = (1 - u) * 0.96;
      tracer.mesh.scale.x = 1 + u * 0.55;
      tracer.mesh.scale.z = 1 + u * 0.55;
      if (u >= 1) {
        this.scene.remove(tracer.mesh);
        tracer.mesh.geometry.dispose();
        tracer.mesh.material.dispose();
        this.tracers.splice(i, 1);
      }
    }
  }

  private fireEnemyProjectile(enemy: EnemyUnit, target: AllyUnit): void {
    const projectile = enemy.motionProfile.projectile;
    if (!projectile) return;
    const root = projectile.createMesh();
    enemy.root.updateMatrixWorld(true);
    if (enemy.effectOrigin) enemy.effectOrigin.getWorldPosition(this.tempVector);
    else this.tempVector.copy(enemy.root.position).add(new THREE.Vector3(0, 0.34, 0));
    const start = this.tempVector.clone();
    const end = target.root.position.clone().add(new THREE.Vector3(0, 0.22, 0));
    root.position.copy(start);
    this.scene.add(root);
    this.enemyProjectiles.push({
      root,
      start,
      end,
      target,
      sourcePosition: enemy.root.position.clone(),
      damage: enemy.attackDamage,
      startedAt: this.simulationNow,
      duration: projectile.flightSeconds,
      hitApplied: false,
      arcHeight: projectile.arcHeight,
    });
  }

  private updateEnemyProjectiles(now: number): void {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i -= 1) {
      const spore = this.enemyProjectiles[i]!;
      const u = clamp01((now - spore.startedAt) / spore.duration);
      if (spore.target.alive) {
        this.tempVector.copy(spore.target.root.position).add(new THREE.Vector3(0, 0.22, 0));
        spore.end.lerp(this.tempVector, 0.2);
      }
      spore.root.position.lerpVectors(spore.start, spore.end, u);
      spore.root.position.y += spore.arcHeight(u);
      spore.root.rotation.y = now * 7.5;
      spore.root.rotation.z = now * 4.2;
      if (!spore.hitApplied && u >= 0.86) {
        spore.hitApplied = true;
        if (spore.target.alive) this.applyDamage(spore.target, spore.damage, 'enemy', spore.sourcePosition);
      }
      if (u >= 1) {
        this.scene.remove(spore.root);
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  private updateImpacts(now: number): void {
    for (let i = this.impacts.length - 1; i >= 0; i -= 1) {
      const impact = this.impacts[i]!;
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
    const entry = getEnemyApproachEntryPose(
      now - this.phaseStartedAt,
      enemy.index,
      enemy.formationSlot,
      enemy.scaleClass,
    );
    enemy.root.position.copy(enemy.home);
    enemy.root.position.z += entry.zOffset;
    const pose = enemy.motionProfile.idle(now, enemy.index * 0.73);
    enemy.root.position.y = pose.jump + entry.yOffset;
    enemy.root.scale.set(
      enemy.baseScale * pose.scaleX * entry.scale,
      enemy.baseScale * pose.scaleY * entry.scale,
      enemy.baseScale * pose.scaleZ * entry.scale,
    );
    const target = this.findNearest(enemy, this.getLivingAllies());
    if (target) this.facePoint(enemy, this.getEnemyTargetPosition(target));
    enemy.root.rotation.z = pose.wobbleZ;
    applyEnemySecondaryPose(enemy.rigParts, enemy.rigRest, pose.secondary);
    enemy.shadow.position.set(enemy.root.position.x, 0.011, enemy.root.position.z);
    enemy.shadow.scale.set(1.35 * entry.shadowScale, 0.68 * entry.shadowScale, 1);
    enemy.shadow.material.opacity = entry.shadowOpacity;
  }

  private updateEnemyUnit(enemy: EnemyUnit, now: number): void {
    if (enemy.state === 'defeat' || enemy.state === 'dead') {
      this.updateEnemyDefeat(enemy, now);
      return;
    }
    const dt = enemy.lastUpdateAt > 0 ? Math.min(0.05, Math.max(0, now - enemy.lastUpdateAt)) : 0;
    enemy.lastUpdateAt = now;
    const target = enemy.attackTarget?.alive ? enemy.attackTarget : this.findNearest(enemy, this.getLivingAllies());
    if (!target) return;

    if (enemy.attackStartedAt !== -Infinity) {
      this.updateEnemyAttack(enemy, now);
      return;
    }

    const targetPosition = this.getEnemyTargetPosition(target);
    this.facePoint(enemy, targetPosition);
    this.tempVector.copy(targetPosition).sub(enemy.root.position).setY(0);
    const distance = this.tempVector.length();
    if (distance > enemy.attackRange) {
      this.tempVector.normalize();
      let step = Math.min(distance - enemy.attackRange, enemy.moveSpeed * dt);
      if (target.behaviorId === 'sword-melee' && this.phase === 'combat') {
        const actualDistance = Math.hypot(
          target.root.position.x - enemy.root.position.x,
          target.root.position.z - enemy.root.position.z,
        );
        step = Math.min(step, Math.max(0, actualDistance - MELEE_BODY_GAP));
      }
      enemy.root.position.addScaledVector(this.tempVector, step);
      const pose = enemy.motionProfile.move(now, enemy.index * 0.19);
      enemy.root.position.y = pose.jump;
      enemy.root.scale.set(
        enemy.baseScale * pose.scaleX,
        enemy.baseScale * pose.scaleY,
        enemy.baseScale * pose.scaleZ,
      );
      enemy.root.rotation.z = pose.wobbleZ;
      applyEnemySecondaryPose(enemy.rigParts, enemy.rigRest, pose.secondary);
    } else {
      enemy.root.position.y = 0;
      const idle = enemy.motionProfile.idle(now, enemy.index * 0.73);
      const hitU = clamp01((now - enemy.hitStartedAt) / 0.2);
      const hit = enemy.motionProfile.hit(hitU, enemy.index % 2 === 0 ? -1 : 1);
      const hitActive = enemy.hitStartedAt > 0 && hitU < 1;
      enemy.root.scale.set(
        enemy.baseScale * idle.scaleX * (hitActive ? hit.scaleX : 1),
        enemy.baseScale * idle.scaleY * (hitActive ? hit.scaleY : 1),
        enemy.baseScale * idle.scaleZ * (hitActive ? hit.scaleZ : 1),
      );
      enemy.root.rotation.z = idle.wobbleZ + (hitActive ? hit.rotationZ : 0);
      applyEnemySecondaryPose(enemy.rigParts, enemy.rigRest, hitActive ? hit.secondary : idle.secondary);
      if (now >= enemy.nextAttackAt) {
        enemy.attackStartedAt = now;
        enemy.attackOrigin.copy(enemy.root.position);
        enemy.attackTarget = target;
        enemy.attackHitApplied = false;
        enemy.nextAttackAt = now + enemy.attackInterval + enemy.index * 0.07;
      }
    }
    enemy.shadow.position.set(enemy.root.position.x, 0.011, enemy.root.position.z);
    const airborne = clamp01(enemy.root.position.y / 0.14);
    enemy.shadow.scale.set(1.35 * THREE.MathUtils.lerp(1, 0.72, airborne), 0.68 * THREE.MathUtils.lerp(1, 0.72, airborne), 1);
    enemy.shadow.material.opacity = THREE.MathUtils.lerp(0.22, 0.12, airborne);
  }

  private updateEnemyAttack(enemy: EnemyUnit, now: number): void {
    const target = enemy.attackTarget;
    if (!target?.alive) {
      enemy.attackStartedAt = -Infinity;
      enemy.attackTarget = null;
      enemy.root.position.copy(enemy.attackOrigin);
      return;
    }
    const duration = enemy.motionProfile.attackDuration;
    const u = clamp01((now - enemy.attackStartedAt) / duration);
    const pose = enemy.motionProfile.attack(u);
    const targetPosition = target.root.position;
    this.tempVector.copy(targetPosition).sub(enemy.attackOrigin).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    const maxTravel = Math.max(0, distance - MELEE_BODY_GAP);
    const travelBase = enemy.motionProfile.projectile
      ? enemy.motionProfile.attackTravelDistance
      : Math.min(distance * 0.42, enemy.motionProfile.attackTravelDistance, maxTravel);
    enemy.root.position.copy(enemy.attackOrigin).addScaledVector(this.tempVector, travelBase * pose.travel);
    enemy.root.position.y = pose.jump;
    enemy.root.scale.set(
      enemy.baseScale * pose.scaleX,
      enemy.baseScale * pose.scaleY,
      enemy.baseScale * pose.scaleZ,
    );
    this.facePoint(enemy, targetPosition);
    enemy.root.rotation.z = pose.wobbleZ;
    applyEnemySecondaryPose(enemy.rigParts, enemy.rigRest, pose.secondary);

    if (!enemy.attackHitApplied && u >= enemy.motionProfile.contactU) {
      enemy.attackHitApplied = true;
      if (enemy.motionProfile.projectile) this.fireEnemyProjectile(enemy, target);
      else this.applyDamage(target, enemy.attackDamage, 'enemy', enemy.root.position);
    }
    if (u >= 1) {
      enemy.attackStartedAt = -Infinity;
      enemy.attackTarget = null;
      enemy.attackHitApplied = false;
      enemy.root.position.copy(enemy.attackOrigin);
      enemy.root.position.y = 0;
      enemy.root.rotation.z = 0;
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
    this.allies.forEach((ally) => {
      ally.attackStartedAt = -Infinity;
      ally.attackTarget = null;
      ally.hitsApplied = 0;
      ally.shotApplied = false;
      ally.resultOrigin.copy(ally.root.position);
      if (ally.alive) {
        ally.root.rotation.z = 0;
        ally.body.scale.copy(ally.bodyBaseScale);
        this.clearMorphs(ally);
        this.setEquipmentSwing(ally, 0);
        this.resetBranchAccents(ally);
      }
    });
    this.enemies.forEach((enemy) => {
      enemy.attackStartedAt = -Infinity;
      enemy.attackTarget = null;
    });
    this.clearFlightVfx();
    if (this.environmentSceneryRoot) this.environmentSceneryRoot.position.z = 0;
    this.environmentTravel?.(0);
    if (result === 'victory') this.createVictoryLootMotes();
    this.emitSnapshot(true);
  }

  private updateResult(now: number): void {
    const elapsed = Math.max(0, now - this.phaseStartedAt);
    this.enemies.forEach((enemy) => this.updateEnemyDefeat(enemy, now));
    if (this.result === 'victory') {
      const transition = getVictoryTransitionPose(elapsed, 0);
      this.allies.forEach((ally) => this.updateVictoryMarch(ally, now));
      this.environmentTravel?.(transition.sceneryTravel);
      this.updateVictoryLootMotes(elapsed, transition.lootVisibility);
      return;
    }
    this.allies.forEach((ally) => {
      if (ally.alive) this.updateIdle(ally, now, ally.slotIndex * 0.31);
    });
    if (elapsed >= RESULT_HOLD_SECONDS) this.resetWave(now);
  }

  private resetWave(now: number): void {
    this.continuationEntryPending = false;
    this.clearProjectiles();
    this.allies.forEach((ally) => {
      this.resetAlly(ally);
      this.facePoint(ally, TARGET_HOME);
    });
    this.enemies.forEach((enemy, index) => this.resetEnemy(enemy, now + index * 0.02));
    this.startBattle(now + 0.1);
  }

  private resetAlly(unit: AllyUnit): void {
    unit.hp = unit.maxHp;
    unit.alive = true;
    unit.state = 'idle';
    unit.defeatStartedAt = -Infinity;
    unit.hitStartedAt = -Infinity;
    unit.nextAttackAt = 0;
    unit.attackStartedAt = -Infinity;
    unit.attackTarget = null;
    unit.hitsApplied = 0;
    unit.shotApplied = false;
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
    this.resetBranchAccents(unit);
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
    enemy.nextAttackAt = now + enemy.initialAttackDelay;
    enemy.lastUpdateAt = now;
    enemy.root.visible = true;
    enemy.root.position.copy(enemy.home);
    enemy.root.rotation.set(0, 0, 0);
    enemy.root.scale.setScalar(enemy.baseScale);
    enemy.bodyRoot.scale.copy(enemy.bodyBaseScale);
    resetEnemySecondaryPose(enemy.rigParts, enemy.rigRest);
    if (enemy.faceRoot) {
      enemy.faceRoot.position.copy(enemy.faceBasePosition);
      enemy.faceRoot.scale.copy(enemy.faceBaseScale);
    }
    this.setEnemyDefeatEyes(enemy.normalEyes, enemy.xEyes, false);
    enemy.shadow.visible = true;
    enemy.shadow.position.set(enemy.home.x, 0.011, enemy.home.z);
    enemy.shadow.scale.set(1.35, 0.68, 1);
    enemy.shadow.material.opacity = 0.22;
  }

  private clearFlightVfx(): void {
    this.projectiles.splice(0).forEach((projectile) => this.scene.remove(projectile.root));
    this.muzzleFlashes.splice(0).forEach((flash) => this.scene.remove(flash.mesh));
    this.tracers.splice(0).forEach((tracer) => {
      this.scene.remove(tracer.mesh);
      tracer.mesh.geometry.dispose();
      tracer.mesh.material.dispose();
    });
    this.enemyProjectiles.splice(0).forEach((spore) => this.scene.remove(spore.root));
    this.resetSlash();
    this.resetSpinArc();
  }

  private clearProjectiles(): void {
    this.clearVictoryLootMotes();
    this.clearFlightVfx();
    this.impacts.splice(0).forEach((impact) => this.scene.remove(impact.group));
  }

  private startCameraShake(duration: number, amplitude: number): void {
    this.cameraShakeStartedAt = this.rawNow;
    this.cameraShakeEndsAt = Math.max(this.cameraShakeEndsAt, this.rawNow + duration);
    this.cameraShakeAmplitude = Math.max(this.cameraShakeAmplitude, amplitude);
  }

  private updateCamera(now: number): void {
    this.camera.position.copy(CAMERA_BASE_POSITION);
    if (this.phase === 'approach') {
      this.camera.position.z += getApproachCameraRetreat(this.simulationNow - this.phaseStartedAt);
    } else if (this.phase === 'result' && this.result === 'victory') {
      const transition = getVictoryTransitionPose(this.simulationNow - this.phaseStartedAt, 0);
      this.camera.position.z -= transition.cameraAdvance;
    }
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
          : this.result === 'victory'
            ? victoryStatusLabel(this.simulationNow - this.phaseStartedAt)
            : '敗北';
    const allies = Object.fromEntries(this.allies.map((ally) => [ally.slimeId, {
      hp: ally.hp,
      maxHp: ally.maxHp,
      alive: ally.alive,
    }]));
    const snapshot: BattleSnapshot = {
      phase: this.phase,
      label,
      result: this.result,
      enemyAlive,
      enemyHp,
      enemyMaxHp,
      allies,
    };
    const key = JSON.stringify(snapshot);
    if (force || key !== this.lastSnapshotKey) {
      this.lastSnapshotKey = key;
      this.onSnapshot(snapshot);
    }
  }
}
