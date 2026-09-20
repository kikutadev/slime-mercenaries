import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { isGreatswordRank } from './fusion';
import {
  SLIME_MOTION_TIMING,
  SLIME_MOTION_THRESHOLDS,
  applyMageRunePose,
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
  getMageAttackMotion,
  getRangerAttackMotion,
  getRogueAttackMotion,
  getShieldAttackMotion,
  getSwordAttackMotion,
  getWandAttackMotion,
  getSwordSlashVfxPose,
  type MorphMesh,
} from './slime-motion';
import {
  applyGuardPulseVfx,
  applyMageCastSigil,
  applyRogueSlashVfx,
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
} from './slime-vfx';
import {
  TIER3_SWORD_THRESHOLDS,
  TIER3_SWORD_TIMING,
  applyBerserkerSignatureVfx,
  applyBlademasterSignatureVfx,
  createBerserkerSignatureVfx,
  createBlademasterSignatureVfx,
  getBerserkerAttackMotion,
  getBlademasterAttackMotion,
} from './slime-motions/tier3/sword';
import {
  TIER3_BOW_THRESHOLDS,
  TIER3_BOW_TIMING,
  applySniperSignatureVfx,
  applyStormSignatureVfx,
  createSniperSignatureVfx,
  createStormSignatureVfx,
  getSniperAttackMotion,
  getStormArcherAttackMotion,
  getStormShotReleaseU,
} from './slime-motions/tier3/bow';
import {
  TIER3_DEFENSE_THRESHOLDS,
  TIER3_DEFENSE_TIMING,
  applyFortressSignatureVfx,
  applyPaladinSignatureVfx,
  createFortressSignatureVfx,
  createPaladinSignatureVfx,
  getFortressAttackMotion,
  getPaladinAttackMotion,
} from './slime-motions/tier3/defense';
import {
  TIER3_MAGIC_THRESHOLDS,
  TIER3_MAGIC_TIMING,
  applyArchmageSignatureVfx,
  applyFrostMageSignatureVfx,
  createArchmageSignatureVfx,
  createFrostMageSignatureVfx,
  getArchmageAttackMotion,
  getFrostMageAttackMotion,
} from './slime-motions/tier3/magic';
import {
  ASSASSIN_SIGNATURE_TIMING,
  NINJA_SIGNATURE_TIMING,
  getAssassinCrossHitU,
  getAssassinExecutionLineU,
  getAssassinSignatureMotion,
  getNinjaDelayedSlashU,
  getNinjaSignatureMotion,
} from './slime-motions/tier3/rogue';
import {
  CANNONEER_SIGNATURE_TIMING,
  ENGINEER_SIGNATURE_TIMING,
  getCannoneerImpactU,
  getCannoneerSignatureMotion,
  getEngineerSignatureMotion,
  getEngineerTurretShotReleaseU,
} from './slime-motions/tier3/gun';
import {
  applyAssassinSignatureVfx,
  applyCannoneerSignatureVfx,
  applyEngineerSignatureVfx,
  applyNinjaSignatureVfx,
  createAssassinSignatureVfx,
  createCannoneerSignatureVfx,
  createEngineerSignatureVfx,
  createNinjaSignatureVfx,
} from './slime-motions/tier3/effects';
import { applyTimedMultiplier, distanceSqToSegment2D, resolveTimedMultiplier } from './combat-effects';
import {
  applyEnemyDefeatFacePose,
  applyEnemySecondaryPose,
  buildEnemyDefeatEyes,
  captureEnemyRigRestPose,
  getEnemyMotionProfile,
  resetEnemySecondaryPose,
  resolveEnemyRigParts,
  type EnemyMotionProfile,
} from './enemy-motion';
import { createBattleEnvironment } from './battle-environment';
import {
  BOSS_APPROACH_SECONDS,
  BOSS_LANDING_SECONDS,
  NORMAL_APPROACH_SECONDS,
  getBossApproachPresentation,
  getEnemyApproachEntryPose,
  getSceneryApproachOffset,
} from './battle-approach';
import { getVictoryMarchSlot, getVictoryPresentationElapsed, getVictoryTransitionPose, shouldUseMarchEntry } from './battle-transition';
import { battleRewardParticleCount, battleRewardVisual, type BattleRewardCue } from './battle-reward';
import { authoritativeResultTriggerDelay } from './battle-runtime-timing';
import { BattleClock } from './battle-runtime/clock';
import { BattleCameraController } from './battle-runtime/camera';
import { MELEE_BODY_GAP, SCALE, TARGET_HOME, allyHome, enemyHome, meleeCombatAnchor } from './battle-runtime/layout';
import { createBattleSnapshot } from './battle-runtime/snapshot';
import {
  applyUnitDeformation,
  clearMorphs,
  enemyTargetPosition,
  facePoint,
  findNearest,
  isMeleeBehavior,
  resetBranchAccents,
  safeMeleeForwardOffset,
  setEquipmentSwing,
  setSecondaryEquipmentSwing,
  updateHopTravel,
  updateIdle,
} from './battle-runtime/unit-presentation';
import {
  createAllyDefeatEyes,
  createShadow,
  createWorldHealthBar,
  setAllyDefeatEyes,
  setEnemyDefeatEyes,
  updateWorldHealthBar,
} from './battle-runtime/unit-visuals';
import type {
  AllyUnit,
  BattleRuntimeAllyConfig,
  BattleRuntimeEncounterUpdate,
  BattleRuntimeEnemyConfig,
  BattleRuntimeOptions,
  BattleSnapshot,
  EnemyProjectileRuntime,
  EnemyUnit,
  ImpactRuntime,
  MuzzleFlashRuntime,
  ProjectileRuntime,
  TracerRuntime,
  VictoryLootMoteRuntime,
} from './battle-runtime/types';

export type {
  BattleRuntimeAllyConfig,
  BattleRuntimeEncounterUpdate,
  BattleRuntimeEnemyConfig,
  BattleRuntimeOptions,
  BattleSnapshot,
  BattleSnapshotAlly,
} from './battle-runtime/types';

const RESULT_HOLD_SECONDS = 1.85;

export class BattleRuntime {
  private readonly scene: THREE.Scene;
  private readonly ownedSceneObjects = new Set<THREE.Object3D>();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new BattleClock();
  private readonly cameraController: BattleCameraController;
  private readonly loader = new GLTFLoader();
  private readonly enemyTemplatePromises = new Map<string, Promise<THREE.Group>>();
  private readonly baseUrl: string;
  private stageNumber: number;
  private waveIndex: number;
  private readonly allyConfigs: readonly BattleRuntimeAllyConfig[];
  private enemyConfigs: readonly BattleRuntimeEnemyConfig[];
  private authoritativeResult: 'victory' | 'defeat' | null;
  private authoritativeResultDelaySec: number | null;
  private readonly onSnapshot: (snapshot: BattleSnapshot) => void;
  private bossEncounter: boolean;
  private readonly tempVector = new THREE.Vector3();
  private readonly tempVector2 = new THREE.Vector3();
  private readonly tempVector3 = new THREE.Vector3();
  private readonly tempVector4 = new THREE.Vector3();
  private readonly tempVector5 = new THREE.Vector3();
  private readonly tempVector6 = new THREE.Vector3();

  private readonly allies: AllyUnit[] = [];
  private readonly enemies: EnemyUnit[] = [];
  private readonly projectiles: ProjectileRuntime[] = [];
  private readonly enemyProjectiles: EnemyProjectileRuntime[] = [];
  private readonly muzzleFlashes: MuzzleFlashRuntime[] = [];
  private readonly tracers: TracerRuntime[] = [];
  private readonly impacts: ImpactRuntime[] = [];
  private readonly victoryLootMotes: VictoryLootMoteRuntime[] = [];
  private pendingRewardCue: BattleRewardCue | null = null;
  private lastRewardCueId: string | null = null;
  private slashArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null = null;
  private spinArc: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial> | null = null;
  private environmentSceneryRoot: THREE.Group | null = null;
  private environmentTravel: ((distance: number) => void) | null = null;
  private environmentDispose: (() => void) | null = null;
  private encounterUpdateRevision = 0;
  private disposed = false;
  private initialized = false;
  private phase: BattleSnapshot['phase'] = 'loading';
  private phaseStartedAt = 0;
  private battleStartedAt = 0;
  private result: BattleSnapshot['result'] = null;
  private lastSnapshotKey = '';
  private continuationEntryPending: boolean;
  private bossLandingTriggered = false;

  constructor(options: BattleRuntimeOptions) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.cameraController = new BattleCameraController(this.camera);
    this.baseUrl = options.baseUrl;
    this.stageNumber = options.stageNumber;
    this.waveIndex = options.waveIndex;
    this.allyConfigs = options.allies;
    this.enemyConfigs = options.enemies;
    this.authoritativeResult = options.authoritativeResult;
    this.authoritativeResultDelaySec = options.authoritativeResultDelaySec;
    this.onSnapshot = options.onSnapshot;
    this.bossEncounter = options.enemies.some((enemy) => enemy.scaleClass === 'boss');
    this.continuationEntryPending = shouldUseMarchEntry(options.stageNumber, options.waveIndex);
  }

  private get rawNow(): number {
    return this.clock.rawNow;
  }

  private get simulationNow(): number {
    return this.clock.simulationNow;
  }

  private installEnvironment(stageNumber: number, waveIndex: number): void {
    this.environmentDispose?.();
    const environment = createBattleEnvironment(this.scene, stageNumber, waveIndex);
    this.environmentSceneryRoot = environment.sceneryRoot;
    this.environmentTravel = environment.setTravelDistance;
    this.environmentDispose = environment.dispose;
  }

  public updateAuthoritativeResult(
    result: 'victory' | 'defeat' | null,
    delaySec: number | null,
  ): void {
    this.authoritativeResult = result;
    this.authoritativeResultDelaySec = delaySec;
  }

  public async updateEncounter(update: BattleRuntimeEncounterUpdate): Promise<void> {
    if (this.disposed) return;
    const revision = ++this.encounterUpdateRevision;
    const previousStageNumber = this.stageNumber;
    const previousWaveIndex = this.waveIndex;
    const previousResult = this.result;
    const loadedEnemies = await Promise.all(update.enemies.map((config) => this.loadEnemy(config, false)));

    if (this.disposed || revision !== this.encounterUpdateRevision) {
      loadedEnemies.forEach((enemy) => this.disposeEnemy(enemy));
      return;
    }

    this.clearProjectiles();
    this.enemies.splice(0).forEach((enemy) => this.disposeEnemy(enemy));

    const recoverParty = previousResult === 'defeat'
      || update.stageNumber !== previousStageNumber
      || update.waveIndex <= previousWaveIndex;

    this.stageNumber = update.stageNumber;
    this.waveIndex = update.waveIndex;
    this.enemyConfigs = update.enemies;
    this.authoritativeResult = update.authoritativeResult;
    this.authoritativeResultDelaySec = update.authoritativeResultDelaySec;
    this.bossEncounter = update.enemies.some((enemy) => enemy.scaleClass === 'boss');
    this.continuationEntryPending = shouldUseMarchEntry(update.stageNumber, update.waveIndex);
    this.installEnvironment(update.stageNumber, update.waveIndex);

    loadedEnemies.forEach((enemy) => this.attachEnemy(enemy));
    this.enemies.push(...loadedEnemies);
    this.allies.forEach((ally) => {
      if (recoverParty) {
        this.resetAlly(ally);
        if (this.continuationEntryPending) {
          const slot = getVictoryMarchSlot(ally.slotIndex);
          ally.approachOrigin.set(slot.x, 0.02, slot.z);
          ally.root.position.copy(ally.approachOrigin);
        } else {
          ally.approachOrigin.copy(ally.home);
        }
      } else if (ally.alive) {
        // A normal wave transition keeps presentation HP and fallen members intact.
        // Only reset attack/deformation residue on survivors before they march again.
        ally.approachOrigin.copy(ally.root.position);
        ally.state = 'idle';
        ally.hitStartedAt = -Infinity;
        ally.root.scale.setScalar(SCALE);
        ally.body.scale.copy(ally.bodyBaseScale);
        if (ally.faceRoot) ally.faceRoot.position.copy(ally.faceBasePosition);
        clearMorphs(ally);
        setEquipmentSwing(ally, 0);
        resetBranchAccents(ally);
        setAllyDefeatEyes(ally, false);
        ally.shadow.visible = true;
        ally.healthBar.visible = true;
      }
      if (ally.alive) facePoint(ally, TARGET_HOME);
    });

    this.startBattle(this.simulationNow + 0.08);
    this.emitSnapshot(true);
  }

  async initialize(): Promise<void> {
    if (this.initialized || this.disposed) return;
    this.initialized = true;

    this.cameraController.reset();

    this.installEnvironment(this.stageNumber, this.waveIndex);
    this.createSlashArc();

    const [loadedAllies, loadedEnemies] = await Promise.all([
      Promise.all(this.allyConfigs.map((config) => this.loadUnit(config))),
      Promise.all(this.enemyConfigs.map((config) => this.loadEnemy(config))),
    ]);

    if (this.disposed) return;
    this.allies.push(...loadedAllies);
    this.enemies.push(...loadedEnemies);
    this.allies.forEach((ally) => facePoint(ally, TARGET_HOME));
    if (this.pendingRewardCue !== null) {
      const cue = this.pendingRewardCue;
      this.pendingRewardCue = null;
      this.createVictoryLootMotes(cue);
    }
    this.startBattle(this.rawNow + 0.15);
    this.emitSnapshot(true);
  }

  tick(hostRawNow: number): void {
    if (!this.initialized || this.disposed) return;
    const frame = this.clock.advance(hostRawNow);
    if (this.allies.length === 0) return;

    if (!frame.hitStopActive) {
      if (this.phase === 'approach') this.updateApproach(frame.simulationNow);
      else if (this.phase === 'combat') this.updateCombat(frame.simulationNow);
      else if (this.phase === 'result') this.updateResult(frame.simulationNow);

      this.enforceAuthoritativeResult(frame.simulationNow);
      this.allies.forEach((ally) => this.updateAllyDefeat(ally, frame.simulationNow));
      this.updateProjectiles(frame.simulationNow);
      this.updateEnemyProjectiles(frame.simulationNow);
      this.updateMuzzleFlashes(frame.simulationNow);
      this.updateTracers(frame.simulationNow);
      this.updateImpacts(frame.simulationNow);
      this.updateVictoryLootMotes(frame.simulationNow);
      this.evaluateBattleOutcome(frame.simulationNow);
    }
    this.updateHealthBars();
    this.updateCamera(frame.rawNow);
    this.emitSnapshot();
  }

  private startHitStop(durationSeconds: number): void {
    this.clock.startHitStop(durationSeconds);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.encounterUpdateRevision += 1;
    this.clearProjectiles();
    this.enemies.splice(0).forEach((enemy) => this.disposeEnemy(enemy));
    this.environmentDispose?.();
    this.environmentDispose = null;
    this.environmentSceneryRoot = null;
    this.environmentTravel = null;
    for (const object of this.ownedSceneObjects) this.scene.remove(object);
    this.ownedSceneObjects.clear();
    this.allies.length = 0;
  }

  private addSceneObject(object: THREE.Object3D): void {
    if (this.disposed) return;
    this.ownedSceneObjects.add(object);
    this.scene.add(object);
  }

  private removeSceneObject(object: THREE.Object3D): void {
    this.ownedSceneObjects.delete(object);
    this.scene.remove(object);
  }

  private makeEnemyAttackTelegraph(
    motionProfile: EnemyMotionProfile,
    attachToScene = true,
  ): THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | null {
    const vfx = motionProfile.attackVfx;
    if (vfx === undefined) return null;
    const material = new THREE.MeshBasicMaterial({
      color: vfx.color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(vfx.radius * 0.66, vfx.radius, 40),
      material,
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.014;
    mesh.visible = false;
    if (attachToScene) this.addSceneObject(mesh);
    return mesh;
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

  private async loadEnemy(config: BattleRuntimeEnemyConfig, attachToScene = true): Promise<EnemyUnit> {
    const home = enemyHome(config.formationSlot);
    const template = await this.loadEnemyTemplate(config.asset);
    const root = template.clone(true) as THREE.Group;
    root.name = `EnemyRuntime:${config.enemyId}:${config.instanceIndex}`;
    root.position.copy(home);
    root.scale.setScalar(config.renderScale);
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        object.material = Array.isArray(object.material)
          ? object.material.map((material) => material.clone())
          : object.material.clone();
      }
    });

    const bodyRoot = root.getObjectByName('BodyRoot') ?? root;
    const faceRoot = root.getObjectByName('FaceRoot') ?? null;
    const effectOrigin = root.getObjectByName('EffectOrigin') ?? null;
    const motionProfile = getEnemyMotionProfile(config.behaviorId);
    const attackTelegraph = this.makeEnemyAttackTelegraph(motionProfile, attachToScene);
    const rigParts = resolveEnemyRigParts(root);
    const rigRest = captureEnemyRigRestPose(rigParts);
    const { normalEyes, xEyes } = buildEnemyDefeatEyes(root);
    setEnemyDefeatEyes(normalEyes, xEyes, false);
    if (attachToScene) this.addSceneObject(root);
    const shadow = createShadow(config.shadowRadius);
    if (attachToScene) this.addSceneObject(shadow);
    shadow.position.set(home.x, 0.011, home.z);

    return {
      id: `enemy-${config.enemyId}-${config.instanceIndex + 1}`,
      side: 'enemy', enemyId: config.enemyId, name: config.name, behaviorId: config.behaviorId,
      scaleClass: config.scaleClass, formationSlot: config.formationSlot, index: config.instanceIndex, root, bodyRoot,
      bodyBaseScale: bodyRoot.scale.clone(), faceRoot,
      faceBasePosition: faceRoot?.position.clone() ?? new THREE.Vector3(),
      faceBaseScale: faceRoot?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
      effectOrigin,
      motionProfile,
      attackTelegraph,
      attackTelegraphPosition: home.clone(),
      rigParts,
      rigRest,
      shadow,
      home,
      baseScale: config.renderScale, maxHp: config.maxHp, hp: config.maxHp, moveSpeed: config.moveSpeed,
      attackRange: config.attackRange, attackInterval: config.attackInterval, attackDamage: config.attackDamage,
      initialAttackDelay: config.initialAttackDelay,
      alive: true, state: 'idle', defeatStartedAt: -Infinity, hitStartedAt: -Infinity,
      attackStartedAt: -Infinity, attackOrigin: home.clone(), attackTarget: null, attackHitApplied: false,
      nextAttackAt: 0, lastUpdateAt: 0, normalEyes, xEyes, moveSpeedEffect: null,
    };
  }

  private attachEnemy(enemy: EnemyUnit): void {
    this.addSceneObject(enemy.root);
    this.addSceneObject(enemy.shadow);
    if (enemy.attackTelegraph !== null) this.addSceneObject(enemy.attackTelegraph);
  }

  private disposeEnemy(enemy: EnemyUnit): void {
    this.removeSceneObject(enemy.root);
    this.removeSceneObject(enemy.shadow);
    enemy.shadow.geometry.dispose();
    enemy.shadow.material.dispose();
    if (enemy.attackTelegraph !== null) {
      this.removeSceneObject(enemy.attackTelegraph);
      enemy.attackTelegraph.geometry.dispose();
      enemy.attackTelegraph.material.dispose();
    }

    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    enemy.xEyes.forEach((root) => root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.forEach((entry) => materials.add(entry));
    }));
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((entry) => entry.dispose());
  }

  private createSlashArc(): void {
    const arc = createSwordSlashArc();
    this.addSceneObject(arc);
    this.slashArc = arc;

    const spinArc = createGreatswordSpinArc();
    this.addSceneObject(spinArc);
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
    this.addSceneObject(group);
    this.impacts.push({ group, materials, startedAt: this.simulationNow, duration });
  }

  public presentRewardCue(cue: BattleRewardCue): void {
    if (this.disposed || this.lastRewardCueId === cue.id) return;
    this.lastRewardCueId = cue.id;
    if (this.allies.length === 0) {
      this.pendingRewardCue = cue;
      return;
    }
    this.createVictoryLootMotes(cue);
  }

  private createVictoryLootMotes(cue: BattleRewardCue): void {
    this.clearVictoryLootMotes();
    let particleIndex = 0;
    for (const item of cue.items) {
      const visual = battleRewardVisual(item);
      const count = battleRewardParticleCount(item, cue.importance);
      for (let localIndex = 0; localIndex < count; localIndex += 1) {
        const geometry: THREE.BufferGeometry = visual.shape === 'coin'
          ? new THREE.CylinderGeometry(0.048, 0.048, 0.018, 10)
          : visual.shape === 'orb'
            ? new THREE.IcosahedronGeometry(0.052, 1)
            : new THREE.OctahedronGeometry(0.058, 0);
        const material = new THREE.MeshBasicMaterial({
          color: visual.color,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geometry, material);
        const angle = particleIndex * 2.399963229728653;
        const lane = (particleIndex % 5) - 2;
        const start = new THREE.Vector3(
          lane * 0.15 + Math.cos(angle) * 0.08,
          0.13 + (particleIndex % 3) * 0.035,
          -1.02 + Math.sin(angle) * 0.1,
        );
        const targetAlly = this.allies[particleIndex % this.allies.length];
        const end = targetAlly === undefined
          ? new THREE.Vector3(0, 0.24, -0.2)
          : targetAlly.root.position.clone().add(new THREE.Vector3(0, 0.22, 0.02));
        mesh.position.copy(start);
        mesh.visible = false;
        if (visual.shape === 'coin') mesh.rotation.x = Math.PI / 2;
        this.addSceneObject(mesh);
        this.victoryLootMotes.push({
          mesh,
          start,
          end,
          delay: (particleIndex % 6) * 0.045,
          startedAt: this.simulationNow,
          duration: 0.86 + (particleIndex % 3) * 0.06,
        });
        particleIndex += 1;
      }
    }
  }

  private updateVictoryLootMotes(now: number): void {
    let activeCount = 0;
    for (let index = 0; index < this.victoryLootMotes.length; index += 1) {
      const mote = this.victoryLootMotes[index]!;
      const local = clamp01((now - mote.startedAt - mote.delay) / mote.duration);
      const active = now >= mote.startedAt + mote.delay && local < 1;
      mote.mesh.visible = active;
      if (!active) continue;
      activeCount += 1;
      const eased = easeOutCubic(local);
      mote.mesh.position.lerpVectors(mote.start, mote.end, eased);
      mote.mesh.position.y += Math.sin(local * Math.PI) * 0.42;
      mote.mesh.rotation.x += 0.13;
      mote.mesh.rotation.y += 0.19;
      mote.mesh.scale.setScalar(0.76 + Math.sin(local * Math.PI) * 0.5);
      mote.mesh.material.opacity = Math.sin(local * Math.PI);
    }
    if (activeCount === 0 && this.victoryLootMotes.length > 0
      && now > Math.max(...this.victoryLootMotes.map((mote) => mote.startedAt + mote.delay + mote.duration))) {
      this.clearVictoryLootMotes();
    }
  }

  private clearVictoryLootMotes(): void {
    for (const mote of this.victoryLootMotes) {
      this.removeSceneObject(mote.mesh);
      mote.mesh.geometry.dispose();
      mote.mesh.material.dispose();
    }
    this.victoryLootMotes.length = 0;
  }

  private updateVictoryMarch(ally: AllyUnit, now: number): void {
    if (!ally.alive) return;
    const rawElapsed = Math.max(0, now - this.phaseStartedAt);
    const elapsed = getVictoryPresentationElapsed(rawElapsed, this.bossEncounter);
    const pose = getVictoryTransitionPose(elapsed, ally.slotIndex);
    const slot = getVictoryMarchSlot(ally.slotIndex);
    this.tempVector.set(slot.x, 0.02, slot.z);
    ally.root.position.lerpVectors(ally.resultOrigin, this.tempVector, pose.formationBlend);
    ally.root.position.y = THREE.MathUtils.lerp(ally.resultOrigin.y, 0.02, pose.formationBlend) + pose.bob;
    ally.root.scale.setScalar(SCALE);
    ally.root.rotation.z = 0;
    ally.body.scale.copy(ally.bodyBaseScale);
    resetBranchAccents(ally);
    if (ally.faceRoot) ally.faceRoot.position.copy(ally.faceBasePosition);
    applyUnitDeformation(ally, 0, pose.stretch, pose.lean, Math.sin(elapsed * 3.9 + ally.slotIndex) * 0.025, pose.bob);
    setEquipmentSwing(ally, Math.sin(elapsed * 7.8 + ally.slotIndex * 0.82) * 0.075, pose.bob * 0.18, 0);
    this.tempVector2.set(ally.root.position.x, 0, ally.root.position.z - 1);
    facePoint(ally, this.tempVector2);
  }

  private async loadUnit(config: BattleRuntimeAllyConfig): Promise<AllyUnit> {
    const home = allyHome(config.slotIndex);
    const combatAnchor = config.formationRole === 'front'
      ? meleeCombatAnchor(config.slotIndex)
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
    const auxiliaryRoot = config.behaviorId === 'engineer-turret'
      ? root.getObjectByName('EngineerTurretRoot') ?? null
      : null;
    const auxiliaryMuzzle = config.behaviorId === 'engineer-turret'
      ? root.getObjectByName('EngineerTurretMuzzle') ?? null
      : config.behaviorId === 'cannoneer-shell'
        ? root.getObjectByName('CannoneerMuzzle') ?? null
        : null;
    if (!body?.morphTargetDictionary || !equipmentAnchor) {
      throw new Error(`${config.slimeId} model is missing runtime anchors (${config.equipmentAnchorName}).`);
    }

    const shadow = createShadow(0.24);
    this.addSceneObject(shadow);
    shadow.position.set(approachOrigin.x, 0.011, approachOrigin.z);
    const healthBar = createWorldHealthBar();
    this.addSceneObject(healthBar);
    const guardPulseVfx = (config.behaviorId === 'guardian-guard' || config.behaviorId === 'paladin-barrier' || config.behaviorId === 'fortress-plant') ? createGuardPulseVfx() : null;
    if (guardPulseVfx) this.addSceneObject(guardPulseVfx);
    const mageCastSigil = (config.behaviorId === 'mage-aoe' || config.behaviorId === 'archmage-burst' || config.behaviorId === 'frost-mage-control') ? createMageCastSigil() : null;
    if (mageCastSigil) this.addSceneObject(mageCastSigil);
    const rogueSlashArc = (config.behaviorId === 'rogue-twin-strike' || config.behaviorId === 'ninja-vanish' || config.behaviorId === 'assassin-execute') ? createRogueSlashArc() : null;
    if (rogueSlashArc) this.addSceneObject(rogueSlashArc);
    const signatureVfx = config.behaviorId === 'blademaster-dash'
      ? createBlademasterSignatureVfx()
      : config.behaviorId === 'berserker-heavy'
        ? createBerserkerSignatureVfx()
        : config.behaviorId === 'sniper-pierce'
          ? createSniperSignatureVfx()
          : config.behaviorId === 'storm-archer-volley'
            ? createStormSignatureVfx()
            : config.behaviorId === 'paladin-barrier'
              ? createPaladinSignatureVfx()
              : config.behaviorId === 'fortress-plant'
                ? createFortressSignatureVfx()
                : config.behaviorId === 'archmage-burst'
                  ? createArchmageSignatureVfx()
                  : config.behaviorId === 'frost-mage-control'
                    ? createFrostMageSignatureVfx()
                    : config.behaviorId === 'ninja-vanish'
                      ? createNinjaSignatureVfx()
                      : config.behaviorId === 'assassin-execute'
                        ? createAssassinSignatureVfx()
                        : config.behaviorId === 'cannoneer-shell'
                          ? createCannoneerSignatureVfx()
                          : config.behaviorId === 'engineer-turret'
                            ? createEngineerSignatureVfx()
                            : null;
    if (signatureVfx) this.addSceneObject(signatureVfx);
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
      signatureVfx,
      auxiliaryRoot,
      auxiliaryMuzzle,
      auxiliaryBasePosition: auxiliaryRoot?.position.clone() ?? new THREE.Vector3(),
      auxiliaryBaseQuaternion: auxiliaryRoot?.quaternion.clone() ?? new THREE.Quaternion(),
      auxiliaryBaseScale: auxiliaryRoot?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
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
      damageTakenEffect: null,
    };
    const eyes = createAllyDefeatEyes(unit.root);
    unit.normalEyes = eyes.normalEyes;
    unit.xEyes = eyes.xEyes;
    this.addSceneObject(root);
    return unit;
  }

  private getLivingEnemies(): EnemyUnit[] {
    return this.enemies.filter((enemy) => enemy.alive);
  }

  private getLivingAllies(): AllyUnit[] {
    return this.allies.filter((ally) => ally.alive);
  }

  private updateHealthBars(): void {
    this.allies.forEach((ally) => {
      updateWorldHealthBar(ally, this.camera, this.phase, this.result);
    });
  }

  private applyDamage(
    target: AllyUnit | EnemyUnit,
    amount: number,
    source: 'melee' | 'projectile' | 'enemy',
    sourcePosition: THREE.Vector3,
  ): void {
    if (!target.alive) return;
    const effectiveAmount = target.side === 'ally'
      ? amount * resolveTimedMultiplier(target.damageTakenEffect, this.simulationNow)
      : amount;
    let nextHp = Math.max(0, target.hp - effectiveAmount);
    // A Domain-owned encounter must not resolve locally before its authored boundary.
    if (this.authoritativeResult !== null && nextHp <= 0) {
      const isLast = target.side === 'enemy'
        ? this.getLivingEnemies().length === 1
        : this.getLivingAllies().length === 1;
      if (isLast) nextHp = 1;
    }
    target.hp = nextHp;
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
    resetBranchAccents(unit);
    setAllyDefeatEyes(unit, true);
  }

  private beginEnemyDefeat(enemy: EnemyUnit): void {
    if (!enemy.alive) return;
    enemy.alive = false;
    enemy.state = 'defeat';
    enemy.defeatStartedAt = this.simulationNow;
    enemy.attackOrigin.copy(enemy.root.position);
    enemy.attackStartedAt = -Infinity;
    enemy.attackTarget = null;
    if (enemy.attackTelegraph) enemy.attackTelegraph.visible = false;
    setEnemyDefeatEyes(enemy.normalEyes, enemy.xEyes, true);
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
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
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
    enemy.root.scale.setScalar(enemy.baseScale * pose.opacity);
    enemy.bodyRoot.scale.set(
      enemy.bodyBaseScale.x * pose.scaleX,
      enemy.bodyBaseScale.y * pose.scaleY,
      enemy.bodyBaseScale.z * pose.scaleZ,
    );
    applyEnemySecondaryPose(enemy.rigParts, enemy.rigRest, pose.secondary);
    applyEnemyDefeatFacePose(
      enemy.faceRoot,
      enemy.bodyRoot,
      enemy.faceBasePosition,
      enemy.faceBaseScale,
      pose,
    );
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
    this.bossLandingTriggered = false;
    if (this.environmentSceneryRoot) this.environmentSceneryRoot.position.z = getSceneryApproachOffset(0);
    this.environmentTravel?.(0);
    this.clearVictoryLootMotes();
    this.battleStartedAt = now;
    this.result = null;
    this.allies.forEach((ally) => {
      if (!ally.alive) return;
      ally.attackStartedAt = -Infinity;
      ally.attackTarget = null;
      ally.hitsApplied = 0;
      ally.shotApplied = false;
      ally.nextAttackAt = now + ((ally.behaviorId === 'bow-ranged' || ally.behaviorId === 'ranger-double-shot' || ally.behaviorId === 'sniper-pierce' || ally.behaviorId === 'storm-archer-volley' || ally.behaviorId === 'mage-aoe' || ally.behaviorId === 'archmage-burst' || ally.behaviorId === 'frost-mage-control' || ally.behaviorId === 'gunner-burst' || ally.behaviorId === 'cannoneer-shell' || ally.behaviorId === 'engineer-turret') ? 0.65 : 1.7) + ally.slotIndex * 0.05;
      const firstEnemy = findNearest(ally, this.getLivingEnemies());
      if (firstEnemy) facePoint(ally, firstEnemy.root.position);
    });
    this.enemies.forEach((enemy) => {
      enemy.nextAttackAt = now + 0.82 + enemy.initialAttackDelay;
      enemy.lastUpdateAt = now;
    });
    this.emitSnapshot(true);
  }

  private updateApproach(now: number): void {
    const duration = this.bossEncounter ? BOSS_APPROACH_SECONDS : NORMAL_APPROACH_SECONDS;
    const approachElapsed = now - this.phaseStartedAt;
    if (this.environmentSceneryRoot) this.environmentSceneryRoot.position.z = getSceneryApproachOffset(approachElapsed);
    this.allies.forEach((ally) => {
      if (!ally.alive) return;
      const destination = isMeleeBehavior(ally) ? ally.combatAnchor : ally.home;
      if (this.continuationEntryPending) {
        updateHopTravel(ally, now, this.phaseStartedAt, ally.approachOrigin, destination, duration);
      } else if (isMeleeBehavior(ally)) {
        updateHopTravel(ally, now, this.phaseStartedAt, ally.home, ally.combatAnchor, duration);
      } else {
        ally.root.position.copy(ally.home);
        updateIdle(ally, now, 1.1 + ally.slotIndex * 0.31);
        const target = findNearest(ally, this.getLivingEnemies());
        if (target) facePoint(ally, target.root.position);
      }
    });
    this.enemies.forEach((enemy) => this.updateEnemyApproachIdle(enemy, now));
    if (this.bossEncounter && !this.bossLandingTriggered && approachElapsed >= BOSS_LANDING_SECONDS) {
      const boss = this.enemies.find((enemy) => enemy.scaleClass === 'boss');
      if (boss !== undefined) {
        const impactPosition = boss.root.position.clone();
        impactPosition.y += 0.16;
        this.createImpact(impactPosition, '#ffd58a', 0.22, 0.38);
        this.startCameraShake(0.22, 0.052);
      }
      this.bossLandingTriggered = true;
    }
    if (now - this.phaseStartedAt >= duration) {
      this.allies.forEach((ally) => {
        if (!ally.alive) return;
        ally.root.position.copy(isMeleeBehavior(ally) ? ally.combatAnchor : ally.home);
        ally.nextAttackAt = now + (isMeleeBehavior(ally) ? 0.12 : 0.2 + ally.slotIndex * 0.06);
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
      else if (ally.behaviorId === 'blademaster-dash') this.updateBlademaster(now, ally);
      else if (ally.behaviorId === 'berserker-heavy') this.updateBerserker(now, ally);
      else if (ally.behaviorId === 'bow-ranged') this.updateBow(now, ally);
      else if (ally.behaviorId === 'ranger-double-shot') this.updateRanger(now, ally);
      else if (ally.behaviorId === 'sniper-pierce') this.updateSniper(now, ally);
      else if (ally.behaviorId === 'storm-archer-volley') this.updateStormArcher(now, ally);
      else if (ally.behaviorId === 'shield-defender') this.updateShield(now, ally);
      else if (ally.behaviorId === 'guardian-guard') this.updateGuardian(now, ally);
      else if (ally.behaviorId === 'paladin-barrier') this.updatePaladin(now, ally);
      else if (ally.behaviorId === 'fortress-plant') this.updateFortress(now, ally);
      else if (ally.behaviorId === 'wand-magic') this.updateWand(now, ally);
      else if (ally.behaviorId === 'mage-aoe') this.updateMage(now, ally);
      else if (ally.behaviorId === 'archmage-burst') this.updateArchmage(now, ally);
      else if (ally.behaviorId === 'frost-mage-control') this.updateFrostMage(now, ally);
      else if (ally.behaviorId === 'dagger-skirmisher') this.updateDagger(now, ally);
      else if (ally.behaviorId === 'rogue-twin-strike') this.updateRogue(now, ally);
      else if (ally.behaviorId === 'ninja-vanish') this.updateNinja(now, ally);
      else if (ally.behaviorId === 'assassin-execute') this.updateAssassin(now, ally);
      else if (ally.behaviorId === 'gun-ranged') this.updateGun(now, ally);
      else if (ally.behaviorId === 'gunner-burst') this.updateGunner(now, ally);
      else if (ally.behaviorId === 'cannoneer-shell') this.updateCannoneer(now, ally);
      else if (ally.behaviorId === 'engineer-turret') this.updateEngineer(now, ally);
    });
    this.enemies.forEach((enemy) => this.updateEnemyUnit(enemy, now));
  }

  private updateSword(now: number, sword: AllyUnit): void {
    if (!sword.alive) return;
    const fusionRank = sword.fusionRank;
    const greatsword = isGreatswordRank(fusionRank);

    if (sword.attackStartedAt !== -Infinity && !sword.attackTarget?.alive) {
      const replacement = greatsword ? findNearest(sword, this.getLivingEnemies()) : null;
      if (replacement) {
        sword.attackTarget = replacement;
      } else {
        sword.attackStartedAt = -Infinity;
        sword.attackTarget = null;
        sword.hitsApplied = 0;
        sword.root.position.copy(sword.combatAnchor);
        setEquipmentSwing(sword, 0);
        this.resetSlash();
        this.resetSpinArc();
      }
    }

    if (sword.attackStartedAt === -Infinity && now >= sword.nextAttackAt) {
      const target = findNearest(sword, this.getLivingEnemies());
      if (target) {
        sword.attackStartedAt = now;
        sword.attackTarget = target;
        sword.hitsApplied = 0;
        sword.nextAttackAt = now + 1.08;
      }
    }

    if (sword.attackStartedAt === -Infinity || !sword.attackTarget) {
      sword.root.position.copy(sword.combatAnchor);
      updateIdle(sword, now, 0.2 + sword.slotIndex * 0.23);
      const target = findNearest(sword, this.getLivingEnemies());
      if (target) facePoint(sword, target.root.position);
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
      bodyOffset = safeMeleeForwardOffset(sword.combatAnchor, this.tempVector, bodyOffset, this.getLivingEnemies());
    }
    sword.root.position.copy(sword.combatAnchor).addScaledVector(this.tempVector, bodyOffset);
    facePoint(sword, target.root.position);
    applyUnitDeformation(sword, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(sword, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
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
      setEquipmentSwing(fighter, 0);
      this.resetSlash();
    }
    if (fighter.attackStartedAt === -Infinity && now >= fighter.nextAttackAt) {
      const target = findNearest(fighter, this.getLivingEnemies());
      if (target) {
        fighter.attackStartedAt = now;
        fighter.attackTarget = target;
        fighter.hitsApplied = 0;
      }
    }
    if (fighter.attackStartedAt === -Infinity || !fighter.attackTarget) {
      fighter.root.position.copy(fighter.combatAnchor);
      updateIdle(fighter, now, 0.32 + fighter.slotIndex * 0.21);
      const target = findNearest(fighter, this.getLivingEnemies());
      if (target) facePoint(fighter, target.root.position);
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
      offset = safeMeleeForwardOffset(fighter.combatAnchor, this.tempVector, offset, this.getLivingEnemies());
    }
    fighter.root.position.copy(fighter.combatAnchor).addScaledVector(this.tempVector, offset);
    facePoint(fighter, target.root.position);
    applyUnitDeformation(
      fighter,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    setEquipmentSwing(fighter, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
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
      if (
        pose.releaseProgress >= SLIME_MOTION_THRESHOLDS.fighterHitReleaseProgress
        && fighter.hitsApplied === pose.comboHit
        && target.alive
      ) {
        fighter.hitsApplied += 1;
        this.applyDamage(target, pose.comboHit === 0 ? 1 : 2, 'melee', fighter.root.position);
      }
    } else {
      this.resetSlash();
    }

    if (u >= 1 || !target.alive) {
      fighter.attackStartedAt = -Infinity;
      fighter.attackTarget = null;
      fighter.hitsApplied = 0;
      fighter.root.position.copy(fighter.combatAnchor);
      setEquipmentSwing(fighter, 0);
      this.resetSlash();
      fighter.nextAttackAt = now + 0.46;
    }
  }

  private updateBlademaster(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.combatAnchor);
      updateIdle(unit, now, 0.18 + unit.slotIndex * 0.17);
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }
    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_SWORD_TIMING.blademasterAttack);
    const pose = getBlademasterAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.combatAnchor).addScaledVector(this.tempVector, pose.bodyOffset);
    facePoint(unit, target.root.position);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    this.tempVector2.copy(target.root.position);
    this.tempVector2.y = 0.28;
    applyBlademasterSignatureVfx(unit.signatureVfx, pose, this.camera.quaternion, this.tempVector2);
    if (u >= TIER3_SWORD_THRESHOLDS.blademasterCutU && unit.hitsApplied === 0) {
      unit.hitsApplied = 1;
      const lineStart = unit.combatAnchor.clone();
      const lineDirection = this.tempVector.clone();
      const targets = this.getLivingEnemies().filter((enemy) => {
        this.tempVector2.copy(enemy.root.position).sub(lineStart).setY(0);
        const projection = this.tempVector2.dot(lineDirection);
        if (projection < -0.08 || projection > 1.72) return false;
        this.tempVector3.copy(lineDirection).multiplyScalar(projection);
        return this.tempVector2.sub(this.tempVector3).length() <= 0.34;
      });
      for (const enemy of targets) this.applyDamage(enemy, enemy === target ? 3 : 2, 'melee', unit.root.position);
      this.startHitStop(0.055);
      this.startCameraShake(0.10, 0.032);
    }
    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.48;
      setEquipmentSwing(unit, 0);
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
  }

  private updateBerserker(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.combatAnchor);
      updateIdle(unit, now, 0.64 + unit.slotIndex * 0.21);
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }
    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_SWORD_TIMING.berserkerAttack);
    const pose = getBerserkerAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    const offset = Math.min(pose.bodyOffset, Math.max(0, distance - MELEE_BODY_GAP));
    unit.root.position.copy(unit.combatAnchor).addScaledVector(this.tempVector, offset);
    facePoint(unit, target.root.position);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    this.tempVector2.copy(target.root.position); this.tempVector2.y = 0.12;
    applyBerserkerSignatureVfx(unit.signatureVfx, pose, this.camera.quaternion, this.tempVector2);
    if (u >= TIER3_SWORD_THRESHOLDS.berserkerImpactU && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.applyDamage(target, 4, 'melee', unit.root.position);
      this.startHitStop(0.070);
      this.startCameraShake(0.15, 0.055);
    }
    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.72;
      setEquipmentSwing(unit, 0);
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
  }

  private updateSniper(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.shotApplied = false;
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.shotApplied = false;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.home);
      updateIdle(unit, now, 1.48 + unit.slotIndex * 0.11);
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }
    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_BOW_TIMING.sniperAttack);
    const pose = getSniperAttackMotion(u);
    facePoint(unit, target.root.position);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    (unit.projectileOrigin ?? unit.equipmentAnchor).getWorldPosition(this.tempVector2);
    this.tempVector3.copy(target.root.position).add(new THREE.Vector3(0, 0.28, 0));
    applySniperSignatureVfx(unit.signatureVfx, pose, this.tempVector2, this.tempVector3, this.camera.quaternion);
    if (!unit.shotApplied && u >= TIER3_BOW_THRESHOLDS.sniperReleaseU) {
      unit.shotApplied = true;
      this.fireArrowProfile(unit, target, TIER3_BOW_TIMING.sniperArrowFlight, 4, 0.10, 0.86);
      this.startCameraShake(0.08, 0.028);
    }
    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.shotApplied = false;
      unit.nextAttackAt = now + 1.18;
      setEquipmentSwing(unit, 0);
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
  }

  private updateStormArcher(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.home);
      updateIdle(unit, now, 1.72 + unit.slotIndex * 0.13);
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }
    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_BOW_TIMING.stormArcherAttack);
    const pose = getStormArcherAttackMotion(u);
    facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.set(-this.tempVector.z, 0, this.tempVector.x);
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector2, pose.bodyOffset);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    (unit.projectileOrigin ?? unit.equipmentAnchor).getWorldPosition(this.tempVector3);
    const candidates = this.getLivingEnemies().slice().sort((a, b) => a.root.position.distanceToSquared(unit.root.position) - b.root.position.distanceToSquared(unit.root.position));
    const impactTargets = [
      candidates[0] ?? target,
      candidates[1] ?? candidates[0] ?? target,
      candidates[2] ?? candidates[1] ?? candidates[0] ?? target,
    ] as const;
    this.tempVector4.copy(impactTargets[0].root.position).add(new THREE.Vector3(0, 0.28, 0));
    this.tempVector5.copy(impactTargets[1].root.position).add(new THREE.Vector3(0, 0.28, 0));
    this.tempVector6.copy(impactTargets[2].root.position).add(new THREE.Vector3(0, 0.28, 0));
    applyStormSignatureVfx(
      unit.signatureVfx,
      pose,
      this.tempVector3,
      [this.tempVector4, this.tempVector5, this.tempVector6],
      this.camera.quaternion,
    );
    for (const shotIndex of [0, 1, 2] as const) {
      const mask = 1 << shotIndex;
      if (u >= getStormShotReleaseU(shotIndex) && (unit.hitsApplied & mask) === 0) {
        unit.hitsApplied |= mask;
        const shotTarget = impactTargets[shotIndex];
        if (shotTarget?.alive) this.fireArrowProfile(unit, shotTarget, TIER3_BOW_TIMING.stormArrowFlight, 2, 0.45, 0.90);
      }
    }
    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
      unit.nextAttackAt = now + 0.72;
      setEquipmentSwing(unit, 0);
      if (unit.signatureVfx) unit.signatureVfx.visible = false;
    }
  }

  private updateGreatswordAttack(now: number, sword: AllyUnit, target: EnemyUnit, fusionRank: number): void {
    const duration = SLIME_MOTION_TIMING.greatswordAttack;
    const u = clamp01((now - sword.attackStartedAt) / duration);
    const pose = getGreatswordAttackMotion(u);

    sword.root.position.copy(sword.combatAnchor);
    facePoint(sword, target.root.position);
    sword.root.rotation.y += pose.rootYawOffset;
    applyUnitDeformation(sword, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(sword, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);

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
    facePoint(sword, target.root.position);
    setEquipmentSwing(sword, 0);
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
      const target = findNearest(guardian, this.getLivingEnemies());
      if (target) {
        guardian.attackStartedAt = now;
        guardian.attackTarget = target;
        guardian.hitsApplied = 0;
      }
    }
    if (guardian.attackStartedAt === -Infinity || !guardian.attackTarget) {
      guardian.root.position.copy(guardian.combatAnchor);
      updateIdle(guardian, now, 0.55 + guardian.slotIndex * 0.17);
      const target = findNearest(guardian, this.getLivingEnemies());
      if (target) facePoint(guardian, target.root.position);
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
      offset = safeMeleeForwardOffset(guardian.combatAnchor, this.tempVector, offset, this.getLivingEnemies());
    }
    guardian.root.position.copy(guardian.combatAnchor).addScaledVector(this.tempVector, offset);
    facePoint(guardian, target.root.position);
    applyUnitDeformation(
      guardian,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    setEquipmentSwing(guardian, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
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
      setEquipmentSwing(guardian, 0);
      resetBranchAccents(guardian);
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
      const target = findNearest(mage, this.getLivingEnemies());
      if (target) {
        mage.attackStartedAt = now;
        mage.attackTarget = target;
        mage.shotApplied = false;
      }
    }
    if (mage.attackStartedAt === -Infinity || !mage.attackTarget) {
      mage.root.position.copy(mage.home);
      updateIdle(mage, now, 2.25 + mage.slotIndex * 0.23);
      const target = findNearest(mage, this.getLivingEnemies());
      if (target) facePoint(mage, target.root.position);
      return;
    }

    const target = mage.attackTarget;
    const u = clamp01((now - mage.attackStartedAt) / SLIME_MOTION_TIMING.mageAttack);
    const pose = getMageAttackMotion(u);
    facePoint(mage, target.root.position);
    this.tempVector.copy(target.root.position).sub(mage.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    mage.root.position.copy(mage.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(
      mage,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    setEquipmentSwing(mage, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    applyMageRunePose(
      mage.mageRuneAnchor,
      mage.mageRuneBaseQuaternion,
      mage.mageRuneBaseScale,
      pose.runeRotation,
      pose.runePulse,
    );
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
      setEquipmentSwing(mage, 0);
      resetBranchAccents(mage);
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
      const target = findNearest(rogue, this.getLivingEnemies());
      if (target) {
        rogue.attackStartedAt = now;
        rogue.attackTarget = target;
        rogue.hitsApplied = 0;
      }
    }
    if (rogue.attackStartedAt === -Infinity || !rogue.attackTarget) {
      rogue.root.position.copy(rogue.combatAnchor);
      updateIdle(rogue, now, 1.85 + rogue.slotIndex * 0.21);
      const target = findNearest(rogue, this.getLivingEnemies());
      if (target) facePoint(rogue, target.root.position);
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
      forward = safeMeleeForwardOffset(rogue.combatAnchor, this.tempVector, forward, this.getLivingEnemies());
    }
    rogue.root.position.copy(rogue.combatAnchor)
      .addScaledVector(this.tempVector, forward)
      .addScaledVector(this.tempVector2, pose.lateralOffset);
    facePoint(rogue, target.root.position);
    applyUnitDeformation(
      rogue,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    setEquipmentSwing(rogue, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    setSecondaryEquipmentSwing(
      rogue,
      pose.secondaryEquipment.angle,
      pose.secondaryEquipment.lift,
      pose.secondaryEquipment.sweep,
    );
    rogue.root.updateMatrixWorld(true);
    const slashAnchor = pose.comboHit === 1 ? rogue.secondaryEquipmentAnchor : rogue.equipmentAnchor;
    (slashAnchor ?? rogue.root).getWorldPosition(this.tempVector3);
    this.tempVector3.y += 0.02;
    applyRogueSlashVfx(rogue.rogueSlashArc, pose, this.camera.quaternion, this.tempVector3);
    const hitMask = 1 << pose.comboHit;
    if (
      pose.hitProgress >= SLIME_MOTION_THRESHOLDS.rogueHitProgress
      && (rogue.hitsApplied & hitMask) === 0
      && target.alive
    ) {
      rogue.hitsApplied |= hitMask;
      this.applyDamage(target, pose.comboHit === 0 ? 1 : 2, 'melee', rogue.root.position);
    }
    if (u >= 1 || !target.alive) {
      rogue.attackStartedAt = -Infinity;
      rogue.attackTarget = null;
      rogue.hitsApplied = 0;
      rogue.root.position.copy(rogue.combatAnchor);
      setEquipmentSwing(rogue, 0);
      setSecondaryEquipmentSwing(rogue, 0);
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
      const target = findNearest(gunner, this.getLivingEnemies());
      if (target) {
        gunner.attackStartedAt = now;
        gunner.attackTarget = target;
        gunner.hitsApplied = 0;
      }
    }
    if (gunner.attackStartedAt === -Infinity || !gunner.attackTarget) {
      gunner.root.position.copy(gunner.home);
      updateIdle(gunner, now, 2.85 + gunner.slotIndex * 0.19);
      const target = findNearest(gunner, this.getLivingEnemies());
      if (target) facePoint(gunner, target.root.position);
      return;
    }

    const target = gunner.attackTarget;
    const u = clamp01((now - gunner.attackStartedAt) / SLIME_MOTION_TIMING.gunnerAttack);
    const pose = getGunnerAttackMotion(u);
    facePoint(gunner, target.root.position);
    this.tempVector.copy(target.root.position).sub(gunner.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    gunner.root.position.copy(gunner.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(
      gunner,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    setEquipmentSwing(gunner, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
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
      setEquipmentSwing(gunner, 0);
    }
  }


  private updatePaladin(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      resetBranchAccents(unit);
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.combatAnchor);
      updateIdle(unit, now, 0.54 + unit.slotIndex * 0.17);
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_DEFENSE_TIMING.paladinAttack);
    const pose = getPaladinAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    const distance = this.tempVector.length();
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    let offset = pose.bodyOffset;
    if (offset > 0) {
      offset = Math.min(offset, Math.max(0, distance - MELEE_BODY_GAP));
      offset = safeMeleeForwardOffset(unit.combatAnchor, this.tempVector, offset, this.getLivingEnemies());
    }
    unit.root.position.copy(unit.combatAnchor).addScaledVector(this.tempVector, offset);
    facePoint(unit, target.root.position);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    unit.equipmentAnchor.getWorldPosition(this.tempVector3);
    applyPaladinSignatureVfx(unit.signatureVfx, pose, this.camera.quaternion, unit.root.position, this.tempVector3);

    if (u >= TIER3_DEFENSE_THRESHOLDS.paladinContactU && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.applyDamage(target, 2, 'melee', unit.root.position);
      this.startHitStop(0.05);
      this.startCameraShake(0.09, 0.032);
    }

    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.78;
      setEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  private updateFortress(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      resetBranchAccents(unit);
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.combatAnchor);
      updateIdle(unit, now, 0.78 + unit.slotIndex * 0.13);
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_DEFENSE_TIMING.fortressAttack);
    const pose = getFortressAttackMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.combatAnchor).addScaledVector(this.tempVector, pose.bodyOffset);
    facePoint(unit, target.root.position);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, 0);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    applyFortressSignatureVfx(unit.signatureVfx, pose, this.camera.quaternion, unit.root.position);

    if (u >= TIER3_DEFENSE_THRESHOLDS.fortressPlantU && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.applyDamage(target, 2, 'melee', unit.root.position);
      this.startHitStop(0.055);
      this.startCameraShake(0.12, 0.038);
    }

    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.98;
      setEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  private updateArchmage(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      resetBranchAccents(unit);
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.home);
      updateIdle(unit, now, 2.42 + unit.slotIndex * 0.19);
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_MAGIC_TIMING.archmageAttack);
    const pose = getArchmageAttackMotion(u);
    facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    applyMageRunePose(
      unit.mageRuneAnchor,
      unit.mageRuneBaseQuaternion,
      unit.mageRuneBaseScale,
      pose.runeCharge * Math.PI * 1.6,
      Math.max(pose.runeCharge, pose.moteBoost),
    );
    this.tempVector2.copy(target.root.position);
    this.tempVector2.y = 0.02;
    applyArchmageSignatureVfx(unit.signatureVfx, pose, this.camera.quaternion, unit.root.position, this.tempVector2);

    if (u >= TIER3_MAGIC_THRESHOLDS.archmageImpactU && unit.hitsApplied === 0) {
      unit.hitsApplied = 1;
      const center = target.root.position;
      for (const enemy of this.getLivingEnemies()) {
        this.tempVector3.copy(enemy.root.position).sub(center).setY(0);
        if (this.tempVector3.lengthSq() <= 1.05 ** 2) {
          this.applyDamage(enemy, enemy === target ? 4 : 2, 'projectile', unit.root.position);
        }
      }
      this.startHitStop(0.065);
      this.startCameraShake(0.16, 0.055);
    }

    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
      unit.nextAttackAt = now + 1.36;
      setEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  private updateFrostMage(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      resetBranchAccents(unit);
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.home);
      updateIdle(unit, now, 2.64 + unit.slotIndex * 0.17);
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / TIER3_MAGIC_TIMING.frostMageAttack);
    const pose = getFrostMageAttackMotion(u);
    facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    (unit.spellOrigin ?? unit.equipmentAnchor).getWorldPosition(this.tempVector2);
    this.tempVector3.copy(target.root.position);
    this.tempVector3.y = 0.18;
    applyFrostMageSignatureVfx(unit.signatureVfx, pose, this.tempVector2, this.tempVector3);

    if (u >= TIER3_MAGIC_THRESHOLDS.frostImpactU && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.applyDamage(target, 3, 'projectile', unit.root.position);
      for (const enemy of this.getLivingEnemies()) {
        if (enemy === target) continue;
        this.tempVector.copy(enemy.root.position).sub(target.root.position).setY(0);
        if (this.tempVector.lengthSq() <= 0.72 ** 2) this.applyDamage(enemy, 1, 'projectile', target.root.position);
      }
      this.startHitStop(0.045);
      this.startCameraShake(0.10, 0.026);
    }

    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
      unit.nextAttackAt = now + 1.12;
      setEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  private updateNinja(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.visible = true;
      resetBranchAccents(unit);
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.combatAnchor);
      unit.root.visible = true;
      updateIdle(unit, now, 1.86 + unit.slotIndex * 0.17);
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / NINJA_SIGNATURE_TIMING.duration);
    const pose = getNinjaSignatureMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.set(-this.tempVector.z, 0, this.tempVector.x);
    unit.root.position.copy(unit.combatAnchor)
      .addScaledVector(this.tempVector, pose.bodyOffset)
      .addScaledVector(this.tempVector2, pose.lateralOffset);
    facePoint(unit, target.root.position);
    unit.root.visible = pose.bodyAlpha > 0.08;
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    setSecondaryEquipmentSwing(unit, pose.secondaryEquipment.angle, pose.secondaryEquipment.lift, pose.secondaryEquipment.sweep);
    this.tempVector2.copy(unit.combatAnchor);
    this.tempVector2.y += 0.22;
    this.tempVector3.copy(target.root.position);
    this.tempVector3.y += 0.24;
    applyNinjaSignatureVfx(unit.signatureVfx, pose, this.camera.quaternion, this.tempVector2, this.tempVector3);

    if (u >= getNinjaDelayedSlashU(0) && unit.hitsApplied === 0 && target.alive) {
      unit.hitsApplied = 1;
      this.applyDamage(target, 3, 'melee', unit.root.position);
      const echo = this.getLivingEnemies().find((enemy) => enemy !== target);
      if (echo) this.applyDamage(echo, 1, 'melee', target.root.position);
      this.startHitStop(0.035);
      this.startCameraShake(0.09, 0.034);
    }

    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.visible = true;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.34;
      setEquipmentSwing(unit, 0);
      setSecondaryEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  private updateAssassin(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.visible = true;
      resetBranchAccents(unit);
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.combatAnchor);
      unit.root.visible = true;
      updateIdle(unit, now, 2.04 + unit.slotIndex * 0.15);
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / ASSASSIN_SIGNATURE_TIMING.duration);
    const pose = getAssassinSignatureMotion(u);
    this.tempVector.copy(target.root.position).sub(unit.combatAnchor).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.copy(target.root.position).addScaledVector(this.tempVector, 0.34);
    unit.root.position.lerpVectors(unit.combatAnchor, this.tempVector2, pose.behindTargetProgress);
    unit.root.position.addScaledVector(new THREE.Vector3(-this.tempVector.z, 0, this.tempVector.x), pose.lateralOffset);
    facePoint(unit, target.root.position);
    unit.root.visible = pose.bodyAlpha > 0.08;
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    setSecondaryEquipmentSwing(unit, pose.secondaryEquipment.angle, pose.secondaryEquipment.lift, pose.secondaryEquipment.sweep);
    this.tempVector3.copy(target.root.position);
    this.tempVector3.y += 0.25;
    applyAssassinSignatureVfx(unit.signatureVfx, pose, this.camera.quaternion, this.tempVector3);

    if (u >= getAssassinCrossHitU() && (unit.hitsApplied & 1) === 0) {
      unit.hitsApplied |= 1;
      this.startHitStop(0.065);
    }
    if (u >= getAssassinExecutionLineU() && (unit.hitsApplied & 2) === 0 && target.alive) {
      unit.hitsApplied |= 2;
      this.applyDamage(target, 4, 'melee', unit.root.position);
      this.startCameraShake(0.11, 0.046);
    }

    if (u >= 1 || !target.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.visible = true;
      unit.root.position.copy(unit.combatAnchor);
      unit.nextAttackAt = now + 0.48;
      setEquipmentSwing(unit, 0);
      setSecondaryEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  private updateCannoneer(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      resetBranchAccents(unit);
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.home);
      updateIdle(unit, now, 2.82 + unit.slotIndex * 0.13);
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / CANNONEER_SIGNATURE_TIMING.duration);
    const pose = getCannoneerSignatureMotion(u);
    facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    unit.root.updateMatrixWorld(true);
    (unit.auxiliaryMuzzle ?? unit.projectileOrigin ?? unit.equipmentAnchor).getWorldPosition(this.tempVector2);
    this.tempVector3.copy(target.root.position);
    this.tempVector3.y += 0.24;
    applyCannoneerSignatureVfx(unit.signatureVfx, pose, this.camera.quaternion, this.tempVector2, this.tempVector3);

    if (u >= CANNONEER_SIGNATURE_TIMING.shellReleaseU && (unit.hitsApplied & 1) === 0) {
      unit.hitsApplied |= 1;
      this.startHitStop(0.035);
      this.startCameraShake(0.10, 0.045);
    }
    if (u >= getCannoneerImpactU() && (unit.hitsApplied & 2) === 0) {
      unit.hitsApplied |= 2;
      const center = target.root.position;
      for (const enemy of this.getLivingEnemies()) {
        this.tempVector4.copy(enemy.root.position).sub(center).setY(0);
        if (this.tempVector4.lengthSq() <= 0.82 ** 2) {
          this.applyDamage(enemy, enemy === target ? 4 : 2, 'projectile', unit.root.position);
        }
      }
      this.startHitStop(0.06);
      this.startCameraShake(0.14, 0.060);
    }

    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
      unit.nextAttackAt = now + 1.05;
      setEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
    }
  }

  private updateEngineer(now: number, unit: AllyUnit): void {
    if (!unit.alive) return;
    if (unit.attackStartedAt !== -Infinity && !unit.attackTarget?.alive) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      resetBranchAccents(unit);
    }
    if (unit.attackStartedAt === -Infinity && now >= unit.nextAttackAt) {
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) {
        unit.attackStartedAt = now;
        unit.attackTarget = target;
        unit.hitsApplied = 0;
      }
    }
    if (unit.attackStartedAt === -Infinity || !unit.attackTarget) {
      unit.root.position.copy(unit.home);
      updateIdle(unit, now, 3.08 + unit.slotIndex * 0.11);
      const target = findNearest(unit, this.getLivingEnemies());
      if (target) facePoint(unit, target.root.position);
      return;
    }

    const target = unit.attackTarget;
    const u = clamp01((now - unit.attackStartedAt) / ENGINEER_SIGNATURE_TIMING.duration);
    const pose = getEngineerSignatureMotion(u);
    facePoint(unit, target.root.position);
    this.tempVector.copy(target.root.position).sub(unit.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    unit.root.position.copy(unit.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(unit, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);

    if (unit.auxiliaryRoot) {
      unit.auxiliaryRoot.visible = pose.turret.visibility > 0.01;
      unit.auxiliaryRoot.position.copy(unit.auxiliaryBasePosition);
      unit.auxiliaryRoot.position.y += pose.turret.lift;
      unit.auxiliaryRoot.quaternion.copy(unit.auxiliaryBaseQuaternion);
      unit.auxiliaryRoot.rotateY(pose.turret.yaw);
      const deployScale = Math.max(0.001, pose.turret.visibility * (0.74 + pose.turret.deployProgress * 0.26));
      unit.auxiliaryRoot.scale.copy(unit.auxiliaryBaseScale).multiplyScalar(deployScale);
    }

    unit.root.updateMatrixWorld(true);
    unit.root.getWorldPosition(this.tempVector2);
    if (unit.auxiliaryRoot) unit.auxiliaryRoot.getWorldPosition(this.tempVector3);
    else this.tempVector3.copy(unit.root.position);
    if (unit.auxiliaryMuzzle) unit.auxiliaryMuzzle.getWorldPosition(this.tempVector4);
    else this.tempVector4.copy(this.tempVector3);
    this.tempVector5.copy(target.root.position);
    this.tempVector5.y += 0.24;
    applyEngineerSignatureVfx(
      unit.signatureVfx,
      pose,
      this.camera.quaternion,
      this.tempVector2,
      this.tempVector3,
      this.tempVector4,
      this.tempVector5,
    );

    for (const shotIndex of [0, 1, 2] as const) {
      const mask = 1 << shotIndex;
      if (u >= getEngineerTurretShotReleaseU(shotIndex) && (unit.hitsApplied & mask) === 0) {
        unit.hitsApplied |= mask;
        const candidates = this.getLivingEnemies();
        const shotTarget = candidates[shotIndex] ?? target;
        if (shotTarget?.alive) this.applyDamage(shotTarget, 1, 'projectile', this.tempVector4);
      }
    }

    if (u >= 1) {
      unit.attackStartedAt = -Infinity;
      unit.attackTarget = null;
      unit.hitsApplied = 0;
      unit.root.position.copy(unit.home);
      unit.nextAttackAt = now + 1.08;
      setEquipmentSwing(unit, 0);
      resetBranchAccents(unit);
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
      const target = findNearest(shield, this.getLivingEnemies());
      if (target) {
        shield.attackStartedAt = now;
        shield.attackTarget = target;
        shield.hitsApplied = 0;
      }
    }
    if (shield.attackStartedAt === -Infinity || !shield.attackTarget) {
      shield.root.position.copy(shield.combatAnchor);
      updateIdle(shield, now, 0.45 + shield.slotIndex * 0.19);
      const target = findNearest(shield, this.getLivingEnemies());
      if (target) facePoint(shield, target.root.position);
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
      offset = safeMeleeForwardOffset(shield.combatAnchor, this.tempVector, offset, this.getLivingEnemies());
    }
    shield.root.position.copy(shield.combatAnchor).addScaledVector(this.tempVector, offset);
    facePoint(shield, target.root.position);
    applyUnitDeformation(shield, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(shield, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (u >= SLIME_MOTION_THRESHOLDS.shieldContactU && shield.hitsApplied === 0 && target.alive) {
      shield.hitsApplied = 1;
      this.applyDamage(target, 1, 'melee', shield.root.position);
    }
    if (u >= 1 || !target.alive) {
      shield.attackStartedAt = -Infinity;
      shield.attackTarget = null;
      shield.hitsApplied = 0;
      shield.root.position.copy(shield.combatAnchor);
      setEquipmentSwing(shield, 0);
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
      const target = findNearest(dagger, this.getLivingEnemies());
      if (target) {
        dagger.attackStartedAt = now;
        dagger.attackTarget = target;
        dagger.hitsApplied = 0;
      }
    }
    if (dagger.attackStartedAt === -Infinity || !dagger.attackTarget) {
      dagger.root.position.copy(dagger.combatAnchor);
      updateIdle(dagger, now, 1.65 + dagger.slotIndex * 0.27);
      const target = findNearest(dagger, this.getLivingEnemies());
      if (target) facePoint(dagger, target.root.position);
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
      offset = safeMeleeForwardOffset(dagger.combatAnchor, this.tempVector, offset, this.getLivingEnemies());
    }
    dagger.root.position.copy(dagger.combatAnchor).addScaledVector(this.tempVector, offset);
    facePoint(dagger, target.root.position);
    applyUnitDeformation(dagger, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(dagger, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (u >= SLIME_MOTION_THRESHOLDS.daggerContactU && dagger.hitsApplied === 0 && target.alive) {
      dagger.hitsApplied = 1;
      this.applyDamage(target, 1, 'melee', dagger.root.position);
    }
    if (u >= 1 || !target.alive) {
      dagger.attackStartedAt = -Infinity;
      dagger.attackTarget = null;
      dagger.hitsApplied = 0;
      dagger.root.position.copy(dagger.combatAnchor);
      setEquipmentSwing(dagger, 0);
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
      const target = findNearest(wand, this.getLivingEnemies());
      if (target) {
        wand.attackStartedAt = now;
        wand.attackTarget = target;
        wand.shotApplied = false;
      }
    }
    if (wand.attackStartedAt === -Infinity || !wand.attackTarget) {
      wand.root.position.copy(wand.home);
      updateIdle(wand, now, 2.05 + wand.slotIndex * 0.29);
      const target = findNearest(wand, this.getLivingEnemies());
      if (target) facePoint(wand, target.root.position);
      return;
    }
    const target = wand.attackTarget;
    const u = clamp01((now - wand.attackStartedAt) / SLIME_MOTION_TIMING.wandAttack);
    const pose = getWandAttackMotion(u);
    facePoint(wand, target.root.position);
    this.tempVector.copy(target.root.position).sub(wand.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    wand.root.position.copy(wand.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(wand, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(wand, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (!wand.shotApplied && u >= SLIME_MOTION_THRESHOLDS.wandReleaseU) {
      wand.shotApplied = true;
      this.fireMagicOrb(wand, target);
    }
    if (u >= 1) {
      wand.attackStartedAt = -Infinity;
      wand.attackTarget = null;
      wand.root.position.copy(wand.home);
      wand.nextAttackAt = now + 0.92;
      setEquipmentSwing(wand, 0);
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
      const target = findNearest(gun, this.getLivingEnemies());
      if (target) {
        gun.attackStartedAt = now;
        gun.attackTarget = target;
        gun.shotApplied = false;
      }
    }
    if (gun.attackStartedAt === -Infinity || !gun.attackTarget) {
      gun.root.position.copy(gun.home);
      updateIdle(gun, now, 2.65 + gun.slotIndex * 0.21);
      const target = findNearest(gun, this.getLivingEnemies());
      if (target) facePoint(gun, target.root.position);
      return;
    }
    const target = gun.attackTarget;
    const u = clamp01((now - gun.attackStartedAt) / SLIME_MOTION_TIMING.gunAttack);
    const pose = getGunAttackMotion(u);
    facePoint(gun, target.root.position);
    this.tempVector.copy(target.root.position).sub(gun.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    gun.root.position.copy(gun.home).addScaledVector(this.tempVector, pose.bodyOffset);
    applyUnitDeformation(gun, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(gun, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (!gun.shotApplied && u >= SLIME_MOTION_THRESHOLDS.gunReleaseU) {
      gun.shotApplied = true;
      this.fireBullet(gun, target);
    }
    if (u >= 1) {
      gun.attackStartedAt = -Infinity;
      gun.attackTarget = null;
      gun.root.position.copy(gun.home);
      gun.nextAttackAt = now + 0.78;
      setEquipmentSwing(gun, 0);
    }
  }

  private fireMagicOrb(
    wand: AllyUnit,
    target: EnemyUnit,
    splashRadius = 0,
    enhanced = false,
    slowEffect?: Readonly<{ durationSec: number; multiplier: number; radius: number }>,
    damage = 1,
    splashDamage = splashRadius > 0 ? 1 : 0,
  ): void {
    const root = enhanced ? createMageOrbVfx() : createMagicOrbMesh();
    (wand.spellOrigin ?? wand.equipmentAnchor).getWorldPosition(this.tempVector);
    const start = this.tempVector.clone();
    const end = target.root.position.clone().add(new THREE.Vector3(0, 0.28, 0));
    root.position.copy(start);
    root.visible = true;
    this.addSceneObject(root);
    this.projectiles.push({
      root, start, end, target, startedAt: this.simulationNow,
      duration: SLIME_MOTION_TIMING.magicOrbFlight, hitApplied: false,
      damage, splashRadius, splashDamage, arcHeightScale: enhanced ? 0.58 : 0.45, orientToTravel: false, hitU: 0.92,
      ...(slowEffect === undefined ? {} : { slowEffect }),
    });
  }

  private fireBullet(
    gun: AllyUnit,
    target: EnemyUnit,
    enhanced = false,
    options: Readonly<{ damage?: number; splashRadius?: number; splashDamage?: number; arcHeightScale?: number; durationScale?: number }> = {},
  ): void {
    const root = createGunBulletMesh();
    (gun.projectileOrigin ?? gun.equipmentAnchor).getWorldPosition(this.tempVector);
    const start = this.tempVector.clone();
    const end = target.root.position.clone().add(new THREE.Vector3(0, 0.25, 0));
    root.position.copy(start);
    root.visible = true;
    this.addSceneObject(root);
    this.projectiles.push({
      root, start, end, target, startedAt: this.simulationNow,
      duration: SLIME_MOTION_TIMING.bulletFlight * (options.durationScale ?? 1), hitApplied: false,
      damage: options.damage ?? 1,
      splashRadius: options.splashRadius ?? 0,
      splashDamage: options.splashDamage ?? 0,
      arcHeightScale: options.arcHeightScale ?? 0, orientToTravel: false, hitU: 0.88,
    });

    const flash = createMuzzleFlashMesh();
    flash.visible = true;
    flash.position.copy(start);
    this.tempVector2.copy(end).sub(start).normalize();
    flash.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.tempVector2);
    flash.material.opacity = 0.95;
    this.addSceneObject(flash);
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
        this.addSceneObject(tracer);
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
      const target = findNearest(bow, this.getLivingEnemies());
      if (target) {
        bow.attackStartedAt = now;
        bow.attackTarget = target;
        bow.shotApplied = false;
      }
    }
    if (bow.attackStartedAt === -Infinity || !bow.attackTarget) {
      bow.root.position.copy(bow.home);
      updateIdle(bow, now, 1.1 + bow.slotIndex * 0.31);
      const target = findNearest(bow, this.getLivingEnemies());
      if (target) facePoint(bow, target.root.position);
      return;
    }

    const u = clamp01((now - bow.attackStartedAt) / SLIME_MOTION_TIMING.bowAttack);
    facePoint(bow, bow.attackTarget.root.position);
    const pose = getBowAttackMotion(u);
    applyUnitDeformation(bow, pose.deformation.squash, pose.deformation.stretch, pose.deformation.lean, pose.deformation.wobble, pose.deformation.jump);
    setEquipmentSwing(bow, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (!bow.shotApplied && u >= SLIME_MOTION_THRESHOLDS.bowReleaseU) {
      bow.shotApplied = true;
      this.fireArrow(bow, bow.attackTarget);
    }
    if (u >= 1) {
      bow.attackStartedAt = -Infinity;
      bow.attackTarget = null;
      bow.nextAttackAt = now + 1.0;
      setEquipmentSwing(bow, 0);
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
      const target = findNearest(ranger, this.getLivingEnemies());
      if (target) {
        ranger.attackStartedAt = now;
        ranger.attackTarget = target;
        ranger.hitsApplied = 0;
      }
    }
    if (ranger.attackStartedAt === -Infinity || !ranger.attackTarget) {
      ranger.root.position.copy(ranger.home);
      updateIdle(ranger, now, 1.32 + ranger.slotIndex * 0.27);
      const target = findNearest(ranger, this.getLivingEnemies());
      if (target) facePoint(ranger, target.root.position);
      return;
    }

    const target = ranger.attackTarget;
    const u = clamp01((now - ranger.attackStartedAt) / SLIME_MOTION_TIMING.rangerAttack);
    const pose = getRangerAttackMotion(u);
    facePoint(ranger, target.root.position);
    this.tempVector.copy(target.root.position).sub(ranger.home).setY(0);
    if (this.tempVector.lengthSq() > 0.0001) this.tempVector.normalize();
    this.tempVector2.set(-this.tempVector.z, 0, this.tempVector.x);
    ranger.root.position.copy(ranger.home).addScaledVector(this.tempVector2, pose.lateralOffset);
    applyUnitDeformation(
      ranger,
      pose.deformation.squash,
      pose.deformation.stretch,
      pose.deformation.lean,
      pose.deformation.wobble,
      pose.deformation.jump,
    );
    setEquipmentSwing(ranger, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
    if (
      pose.shotProgress >= SLIME_MOTION_THRESHOLDS.bowReleaseU
      && ranger.hitsApplied === pose.shotIndex
      && target.alive
    ) {
      ranger.hitsApplied += 1;
      ranger.root.updateMatrixWorld(true);
      this.fireArrow(ranger, target);
    }
    if (u >= 1) {
      ranger.attackStartedAt = -Infinity;
      ranger.attackTarget = null;
      ranger.hitsApplied = 0;
      ranger.root.position.copy(ranger.home);
      setEquipmentSwing(ranger, 0);
      ranger.nextAttackAt = now + 0.68;
    }
  }

  private fireArrowProfile(
    bow: AllyUnit,
    target: EnemyUnit,
    duration: number,
    damage: number,
    arcHeightScale: number,
    hitU: number,
  ): void {
    this.fireArrow(bow, target, {
      damage,
      durationScale: duration / SLIME_MOTION_TIMING.arrowFlight,
      arcHeightScale,
      hitU,
    });
  }

  private fireArrow(
    bow: AllyUnit,
    target: EnemyUnit,
    options: Readonly<{
      damage?: number;
      durationScale?: number;
      arcHeightScale?: number;
      hitU?: number;
      pierceDamage?: number;
      pierceWidth?: number;
    }> = {},
  ): void {
    const root = this.createArrowMesh();
    (bow.projectileOrigin ?? bow.equipmentAnchor).getWorldPosition(this.tempVector);
    const start = this.tempVector.clone();
    const end = target.root.position.clone().add(new THREE.Vector3(0, 0.28, 0));
    root.position.copy(start);
    this.addSceneObject(root);
    this.projectiles.push({
      root,
      start,
      end,
      target,
      startedAt: this.simulationNow,
      duration: SLIME_MOTION_TIMING.arrowFlight * (options.durationScale ?? 1),
      hitApplied: false,
      damage: options.damage ?? 1,
      splashRadius: 0,
      splashDamage: 0,
      arcHeightScale: options.arcHeightScale ?? 1,
      orientToTravel: true,
      hitU: options.hitU ?? SLIME_MOTION_THRESHOLDS.arrowHitU,
      ...(options.pierceDamage === undefined ? {} : { pierceDamage: options.pierceDamage }),
      ...(options.pierceWidth === undefined ? {} : { pierceWidth: options.pierceWidth }),
    });
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
          if (projectile.pierceDamage !== undefined && projectile.pierceWidth !== undefined) {
            const widthSq = projectile.pierceWidth ** 2;
            for (const enemy of this.getLivingEnemies()) {
              if (enemy === projectile.target) continue;
              const distanceSq = distanceSqToSegment2D(
                enemy.root.position.x, enemy.root.position.z,
                projectile.start.x, projectile.start.z,
                projectile.end.x, projectile.end.z,
              );
              if (distanceSq <= widthSq) this.applyDamage(enemy, projectile.pierceDamage, 'projectile', projectile.start);
            }
            this.createImpact(projectile.target.root.position.clone().add(new THREE.Vector3(0, 0.22, 0)), '#e8fbff', 0.10);
          }
          if (projectile.slowEffect !== undefined) {
            const radiusSq = projectile.slowEffect.radius ** 2;
            for (const enemy of this.getLivingEnemies()) {
              this.tempVector.copy(enemy.root.position).sub(projectile.target.root.position).setY(0);
              if (this.tempVector.lengthSq() > radiusSq) continue;
              enemy.moveSpeedEffect = applyTimedMultiplier(
                enemy.moveSpeedEffect,
                now,
                projectile.slowEffect.durationSec,
                projectile.slowEffect.multiplier,
              );
            }
            this.createImpact(projectile.target.root.position.clone().add(new THREE.Vector3(0, 0.16, 0)), '#9cecff', 0.16);
          }
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
        this.removeSceneObject(projectile.root);
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
        this.removeSceneObject(flash.mesh);
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
        this.removeSceneObject(tracer.mesh);
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
    this.addSceneObject(root);
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
        this.removeSceneObject(spore.root);
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
        this.removeSceneObject(impact.group);
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
    const bossPresentation = enemy.scaleClass === 'boss'
      ? getBossApproachPresentation(now - this.phaseStartedAt)
      : null;
    const bossSquash = bossPresentation?.squash ?? 0;
    enemy.root.scale.set(
      enemy.baseScale * pose.scaleX * entry.scale * (1 + bossSquash * 0.055),
      enemy.baseScale * pose.scaleY * entry.scale * (1 - bossSquash * 0.12),
      enemy.baseScale * pose.scaleZ * entry.scale * (1 + bossSquash * 0.055),
    );
    const target = findNearest(enemy, this.getLivingAllies());
    if (target) facePoint(enemy, enemyTargetPosition(target, this.phase));
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
    const target = enemy.attackTarget?.alive ? enemy.attackTarget : findNearest(enemy, this.getLivingAllies());
    if (!target) return;

    if (enemy.attackStartedAt !== -Infinity) {
      this.updateEnemyAttack(enemy, now);
      return;
    }

    const targetPosition = enemyTargetPosition(target, this.phase);
    facePoint(enemy, targetPosition);
    this.tempVector.copy(targetPosition).sub(enemy.root.position).setY(0);
    const distance = this.tempVector.length();
    if (distance > enemy.attackRange) {
      this.tempVector.normalize();
      const moveMultiplier = resolveTimedMultiplier(enemy.moveSpeedEffect, now);
      let step = Math.min(distance - enemy.attackRange, enemy.moveSpeed * moveMultiplier * dt);
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
        enemy.attackTelegraphPosition.copy(target.root.position);
        enemy.attackTelegraphPosition.y = 0.014;
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
      if (enemy.attackTelegraph) enemy.attackTelegraph.visible = false;
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
    facePoint(enemy, targetPosition);
    enemy.root.rotation.z = pose.wobbleZ;
    applyEnemySecondaryPose(enemy.rigParts, enemy.rigRest, pose.secondary);

    const attackVfx = enemy.motionProfile.attackVfx;
    if (attackVfx !== undefined && enemy.attackTelegraph !== null) {
      const vfxPose = attackVfx.pose(u);
      enemy.attackTelegraph.visible = vfxPose.telegraphOpacity > 0.001 && u < 1;
      enemy.attackTelegraph.position.copy(enemy.attackTelegraphPosition);
      enemy.attackTelegraph.position.y = 0.014;
      enemy.attackTelegraph.scale.setScalar(vfxPose.telegraphScale);
      enemy.attackTelegraph.material.opacity = vfxPose.telegraphOpacity;
      enemy.attackTelegraph.rotation.z = now * 0.22;
    }

    if (!enemy.attackHitApplied && u >= enemy.motionProfile.contactU) {
      enemy.attackHitApplied = true;
      if (attackVfx !== undefined) {
        const impactPosition = enemy.attackTelegraphPosition.clone();
        impactPosition.y = 0.10;
        this.createImpact(impactPosition, attackVfx.impactColor, attackVfx.impactSize, 0.34);
        this.startCameraShake(attackVfx.cameraShakeDuration, attackVfx.cameraShakeAmplitude);
      }
      if (enemy.motionProfile.projectile) this.fireEnemyProjectile(enemy, target);
      else this.applyDamage(target, enemy.attackDamage, 'enemy', enemy.root.position);
    }
    if (u >= 1) {
      enemy.attackStartedAt = -Infinity;
      enemy.attackTarget = null;
      enemy.attackHitApplied = false;
      if (enemy.attackTelegraph) enemy.attackTelegraph.visible = false;
      enemy.root.position.copy(enemy.attackOrigin);
      enemy.root.position.y = 0;
      enemy.root.rotation.z = 0;
    }
  }

  private enforceAuthoritativeResult(now: number): void {
    if (this.authoritativeResult === null || this.authoritativeResultDelaySec === null) return;
    // Analytical idle progress can complete in one second. Presentation must never kill
    // an encounter while it is still entering the screen.
    if (this.phase !== 'combat') return;
    const triggerDelay = authoritativeResultTriggerDelay(
      this.authoritativeResult,
      this.authoritativeResultDelaySec,
      this.bossEncounter,
    );
    if (now - this.battleStartedAt < triggerDelay) return;

    if (this.authoritativeResult === 'defeat') {
      const livingAllies = this.getLivingAllies();
      if (livingAllies.length === 0) return;
      livingAllies.forEach((ally) => {
        ally.hp = 0;
        this.beginAllyDefeat(ally);
      });
      this.enterResult('defeat', now);
      return;
    }

    const livingEnemies = this.getLivingEnemies();
    if (livingEnemies.length === 0) return;
    livingEnemies.forEach((enemy) => {
      enemy.hp = 0;
      this.beginEnemyDefeat(enemy);
    });
    this.enterResult('victory', now);
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
        clearMorphs(ally);
        setEquipmentSwing(ally, 0);
        resetBranchAccents(ally);
      }
    });
    this.enemies.forEach((enemy) => {
      enemy.attackStartedAt = -Infinity;
      enemy.attackTarget = null;
    });
    this.clearFlightVfx();
    if (this.environmentSceneryRoot) this.environmentSceneryRoot.position.z = 0;
    this.environmentTravel?.(0);
    this.emitSnapshot(true);
  }

  private updateResult(now: number): void {
    const elapsed = Math.max(0, now - this.phaseStartedAt);
    this.enemies.forEach((enemy) => this.updateEnemyDefeat(enemy, now));
    if (this.result === 'victory') {
      const presentationElapsed = getVictoryPresentationElapsed(elapsed, this.bossEncounter);
      const transition = getVictoryTransitionPose(presentationElapsed, 0);
      this.allies.forEach((ally) => this.updateVictoryMarch(ally, now));
      this.environmentTravel?.(transition.sceneryTravel);
      return;
    }
    this.allies.forEach((ally) => {
      if (ally.alive) updateIdle(ally, now, ally.slotIndex * 0.31);
    });
    // Domain-owned results stay visible until the Domain advances/remounts the encounter.
    if (this.authoritativeResult !== null) return;
    if (elapsed >= RESULT_HOLD_SECONDS) this.resetWave(now);
  }

  private resetWave(now: number): void {
    this.continuationEntryPending = false;
    this.clearProjectiles();
    this.allies.forEach((ally) => {
      this.resetAlly(ally);
      facePoint(ally, TARGET_HOME);
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
    clearMorphs(unit);
    setEquipmentSwing(unit, 0);
    resetBranchAccents(unit);
    setAllyDefeatEyes(unit, false);
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
    if (enemy.attackTelegraph) enemy.attackTelegraph.visible = false;
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
    setEnemyDefeatEyes(enemy.normalEyes, enemy.xEyes, false);
    enemy.shadow.visible = true;
    enemy.shadow.position.set(enemy.home.x, 0.011, enemy.home.z);
    enemy.shadow.scale.set(1.35, 0.68, 1);
    enemy.shadow.material.opacity = 0.22;
  }

  private clearFlightVfx(): void {
    this.projectiles.splice(0).forEach((projectile) => this.removeSceneObject(projectile.root));
    this.muzzleFlashes.splice(0).forEach((flash) => this.removeSceneObject(flash.mesh));
    this.tracers.splice(0).forEach((tracer) => {
      this.removeSceneObject(tracer.mesh);
      tracer.mesh.geometry.dispose();
      tracer.mesh.material.dispose();
    });
    this.enemyProjectiles.splice(0).forEach((spore) => this.removeSceneObject(spore.root));
    this.enemies.forEach((enemy) => {
      if (enemy.attackTelegraph) enemy.attackTelegraph.visible = false;
    });
    this.resetSlash();
    this.resetSpinArc();
  }

  private clearProjectiles(): void {
    this.clearVictoryLootMotes();
    this.clearFlightVfx();
    this.impacts.splice(0).forEach((impact) => this.removeSceneObject(impact.group));
  }

  private startCameraShake(duration: number, amplitude: number): void {
    this.cameraController.startShake(this.rawNow, duration, amplitude);
  }

  private updateCamera(rawNow: number): void {
    this.cameraController.update({
      rawNow,
      simulationNow: this.simulationNow,
      phase: this.phase,
      phaseStartedAt: this.phaseStartedAt,
      result: this.result,
      bossEncounter: this.bossEncounter,
      approachPresentationElapsed: null,
    });
  }

  private emitSnapshot(force = false): void {
    const snapshot = createBattleSnapshot({
      phase: this.phase,
      result: this.result,
      allies: this.allies,
      enemies: this.enemies,
      bossEncounter: this.bossEncounter,
      simulationNow: this.simulationNow,
      phaseStartedAt: this.phaseStartedAt,
    });
    const key = JSON.stringify(snapshot);
    if (force || key !== this.lastSnapshotKey) {
      this.lastSnapshotKey = key;
      this.onSnapshot(snapshot);
    }
  }
}
