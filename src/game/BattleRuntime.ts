import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import {
  SLIME_MOTION_TIMING,
  clamp01,
  getAllyDefeatMotion,
  type MorphMesh,
} from './slime-motion';
import {
  createGuardPulseVfx,
  createMageCastSigil,
  createRogueSlashArc,
} from './slime-vfx';
import {
  createBerserkerSignatureVfx,
  createBlademasterSignatureVfx,
} from './slime-motions/tier3/sword';
import {
  createSniperSignatureVfx,
  createStormSignatureVfx,
} from './slime-motions/tier3/bow';
import {
  createFortressSignatureVfx,
  createPaladinSignatureVfx,
} from './slime-motions/tier3/defense';
import {
  createArchmageSignatureVfx,
  createFrostMageSignatureVfx,
} from './slime-motions/tier3/magic';


import {
  createAssassinSignatureVfx,
  createCannoneerSignatureVfx,
  createEngineerSignatureVfx,
  createNinjaSignatureVfx,
} from './slime-motions/tier3/effects';
import { resolveTimedMultiplier } from './combat-effects';
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
import { createStageEnvironment, type StageEnvironmentRuntime } from './stage-environment';
import { applySlimeMutationVisuals } from './slime-mutation-visuals';
import {
  BOSS_APPROACH_SECONDS,
  BOSS_LANDING_SECONDS,
  NORMAL_APPROACH_SECONDS,
  getSceneryApproachOffset,
} from './battle-approach';
import {
  getVictoryMarchSlot,
  getVictoryPresentationElapsed,
  getVictoryTransitionPose,
  shouldUseMarchEntry,
} from './battle-transition';
import type { BattleRewardCue } from './battle-reward';
import { BattleClock } from './battle-runtime/clock';
import { BattleCameraController } from './battle-runtime/camera';
import { BattleEffectsSystem } from './battle-runtime/effects-system';
import { BattleAllyCombatSystem } from './battle-runtime/ally-combat-system';
import { BattleEnemyCombatSystem } from './battle-runtime/enemy-combat-system';
import {
  MELEE_BODY_GAP,
  SCALE,
  TARGET_HOME,
  allyHome,
  enemyHome,
  meleeCombatAnchor,
} from './battle-runtime/layout';
import { createBattleSnapshot } from './battle-runtime/snapshot';
import { areAllUnitsVisiblyDefeated } from './battle-runtime/outcome';
import {
  disposeObjectMaterials,
  disposeOwnedObjectResources,
} from './battle-runtime/resource-disposal';
import {
  applyUnitDeformation,
  clearMorphs,
  facePoint,
  findNearest,
  isMeleeBehavior,
  resetBranchAccents,
  setEquipmentSwing,
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
  EnemyUnit,
} from './battle-runtime/types';

export type {
  BattleRuntimeAllyConfig,
  BattleRuntimeEncounterUpdate,
  BattleRuntimeEnemyConfig,
  BattleRuntimeOptions,
  BattleSnapshot,
  BattleSnapshotAlly,
} from './battle-runtime/types';

export class BattleRuntime {
  private readonly scene: THREE.Scene;
  private readonly ownedSceneObjects = new Set<THREE.Object3D>();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new BattleClock();
  private readonly cameraController: BattleCameraController;
  private readonly effects: BattleEffectsSystem;
  private readonly allyCombat: BattleAllyCombatSystem;
  private readonly enemyCombat: BattleEnemyCombatSystem;
  private readonly loader = new GLTFLoader();
  private readonly enemyTemplatePromises = new Map<string, Promise<THREE.Group>>();
  private readonly baseUrl: string;
  private areaId: string;
  private stageNumber: number;
  private waveIndex: number;
  private readonly allyConfigs: readonly BattleRuntimeAllyConfig[];
  private enemyConfigs: readonly BattleRuntimeEnemyConfig[];
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
  private environmentSceneryRoot: THREE.Group | null = null;
  private environmentTravel: ((distance: number) => void) | null = null;
  private environmentWave: ((waveIndex: number) => void) | null = null;
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
    this.effects = new BattleEffectsSystem({
      camera: this.camera,
      addSceneObject: (object) => this.addSceneObject(object),
      removeSceneObject: (object) => this.removeSceneObject(object),
      getSimulationNow: () => this.simulationNow,
      getAllies: () => this.allies,
      getLivingEnemies: () => this.getLivingEnemies(),
      applyDamage: (target, amount, source, sourcePosition) => {
        this.applyDamage(target, amount, source, sourcePosition);
      },
    });
    this.allyCombat = new BattleAllyCombatSystem({
      camera: this.camera,
      effects: this.effects,
      addSceneObject: (object) => this.addSceneObject(object),
      getLivingEnemies: () => this.getLivingEnemies(),
      applyDamage: (target, amount, source, sourcePosition) => {
        this.applyDamage(target, amount, source, sourcePosition);
      },
      startCameraShake: (duration, amplitude) => this.startCameraShake(duration, amplitude),
      startHitStop: (durationSeconds) => this.startHitStop(durationSeconds),
    });
    this.enemyCombat = new BattleEnemyCombatSystem({
      effects: this.effects,
      getLivingAllies: () => this.getLivingAllies(),
      updateDefeat: (enemy, now) => this.updateEnemyDefeat(enemy, now),
      applyDamage: (target, amount, source, sourcePosition) => {
        this.applyDamage(target, amount, source, sourcePosition);
      },
      startCameraShake: (duration, amplitude) => this.startCameraShake(duration, amplitude),
    });
    this.baseUrl = options.baseUrl;
    this.areaId = options.areaId;
    this.stageNumber = options.stageNumber;
    this.waveIndex = options.waveIndex;
    this.allyConfigs = options.allies;
    this.enemyConfigs = options.enemies;
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

  private applyEnvironment(environment: StageEnvironmentRuntime): void {
    this.environmentDispose?.();
    environment.activate();
    this.environmentSceneryRoot = environment.sceneryRoot;
    this.environmentTravel = environment.setTravelDistance;
    this.environmentWave = environment.setWaveIndex;
    this.environmentDispose = environment.dispose;
  }

  private async prepareEnvironment(areaId: string, stageNumber: number, waveIndex: number): Promise<StageEnvironmentRuntime> {
    return createStageEnvironment(this.scene, this.baseUrl, areaId, stageNumber, waveIndex);
  }

  public async updateEncounter(update: BattleRuntimeEncounterUpdate): Promise<void> {
    if (this.disposed) return;
    const revision = ++this.encounterUpdateRevision;
    const previousAreaId = this.areaId;
    const previousStageNumber = this.stageNumber;
    const previousWaveIndex = this.waveIndex;
    const previousResult = this.result;
    const environmentChanged = update.areaId !== previousAreaId || update.stageNumber !== previousStageNumber;
    const [loadedEnemies, preparedEnvironment] = await Promise.all([
      Promise.all(update.enemies.map((config) => this.loadEnemy(config, false))),
      environmentChanged
        ? this.prepareEnvironment(update.areaId, update.stageNumber, update.waveIndex)
        : Promise.resolve<StageEnvironmentRuntime | null>(null),
    ]);

    if (this.disposed || revision !== this.encounterUpdateRevision) {
      loadedEnemies.forEach((enemy) => this.disposeEnemy(enemy));
      preparedEnvironment?.dispose();
      return;
    }

    this.clearProjectiles();
    this.enemies.splice(0).forEach((enemy) => this.disposeEnemy(enemy));

    const recoverParty = previousResult === 'defeat'
      || update.areaId !== previousAreaId
      || update.stageNumber !== previousStageNumber
      || update.waveIndex <= previousWaveIndex;

    this.areaId = update.areaId;
    this.stageNumber = update.stageNumber;
    this.waveIndex = update.waveIndex;
    this.enemyConfigs = update.enemies;
    this.bossEncounter = update.enemies.some((enemy) => enemy.scaleClass === 'boss');
    this.continuationEntryPending = shouldUseMarchEntry(update.stageNumber, update.waveIndex);
    if (preparedEnvironment !== null) this.applyEnvironment(preparedEnvironment);
    else this.environmentWave?.(update.waveIndex);

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

    this.allyCombat.initializePresentationVfx();

    const [environment, loadedAllies, loadedEnemies] = await Promise.all([
      this.prepareEnvironment(this.areaId, this.stageNumber, this.waveIndex),
      Promise.all(this.allyConfigs.map((config) => this.loadUnit(config))),
      Promise.all(this.enemyConfigs.map((config) => this.loadEnemy(config))),
    ]);

    if (this.disposed) {
      environment.dispose();
      loadedAllies.forEach((ally) => this.disposeAlly(ally));
      loadedEnemies.forEach((enemy) => this.disposeEnemy(enemy));
      return;
    }
    this.applyEnvironment(environment);
    this.allies.push(...loadedAllies);
    this.enemies.push(...loadedEnemies);
    this.allies.forEach((ally) => facePoint(ally, TARGET_HOME));
    this.effects.flushPendingRewardCue();
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

      this.allies.forEach((ally) => this.updateAllyDefeat(ally, frame.simulationNow));
      this.effects.update(frame.simulationNow);
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
    this.allies.splice(0).forEach((ally) => this.disposeAlly(ally));
    this.environmentDispose?.();
    this.environmentDispose = null;
    this.environmentSceneryRoot = null;
    this.environmentTravel = null;
    this.environmentWave = null;
    for (const object of [...this.ownedSceneObjects]) {
      this.removeSceneObject(object);
      disposeOwnedObjectResources(object);
    }
    for (const templatePromise of this.enemyTemplatePromises.values()) {
      void templatePromise
        .then((template) => disposeOwnedObjectResources(template))
        .catch(() => undefined);
    }
    this.enemyTemplatePromises.clear();
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
    const healthBar = createWorldHealthBar('enemy');
    if (attachToScene) this.addSceneObject(healthBar);

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
      healthBar,
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
    this.addSceneObject(enemy.healthBar);
    if (enemy.attackTelegraph !== null) this.addSceneObject(enemy.attackTelegraph);
  }

  private disposeEnemy(enemy: EnemyUnit): void {
    this.removeSceneObject(enemy.root);
    // Enemy clone geometry is shared with the cached template; only its cloned
    // per-instance materials are owned by this unit.
    disposeObjectMaterials(enemy.root);

    this.removeSceneObject(enemy.shadow);
    disposeOwnedObjectResources(enemy.shadow);

    this.removeSceneObject(enemy.healthBar);
    disposeOwnedObjectResources(enemy.healthBar);

    if (enemy.attackTelegraph !== null) {
      this.removeSceneObject(enemy.attackTelegraph);
      disposeOwnedObjectResources(enemy.attackTelegraph);
    }

    const xEyeGeometries = new Set<THREE.BufferGeometry>();
    enemy.xEyes.forEach((root) => root.traverse((object) => {
      if (object instanceof THREE.Mesh) xEyeGeometries.add(object.geometry);
    }));
    xEyeGeometries.forEach((geometry) => geometry.dispose());
  }

  private disposeAlly(ally: AllyUnit): void {
    const ownedObjects = new Set<THREE.Object3D>([
      ally.root,
      ally.shadow,
      ally.healthBar,
      ...(ally.guardPulseVfx === null ? [] : [ally.guardPulseVfx]),
      ...(ally.mageCastSigil === null ? [] : [ally.mageCastSigil]),
      ...(ally.rogueSlashArc === null ? [] : [ally.rogueSlashArc]),
      ...(ally.signatureVfx === null ? [] : [ally.signatureVfx]),
    ]);
    for (const object of ownedObjects) {
      this.removeSceneObject(object);
      disposeOwnedObjectResources(object);
    }
  }

  public presentRewardCue(cue: BattleRewardCue): void {
    if (this.disposed) return;
    this.effects.presentRewardCue(cue);
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
    applySlimeMutationVisuals(root, config.mutationId);
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
    this.enemies.forEach((enemy) => {
      updateWorldHealthBar(enemy, this.camera, this.phase, this.result);
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
    target.hp = Math.max(0, target.hp - effectiveAmount);
    target.hitStartedAt = this.simulationNow;
    this.tempVector.copy(target.root.position);
    this.tempVector.y += target.side === 'enemy' ? 0.28 : 0.22;
    const impactSize = target.side === 'enemy' ? (source === 'melee' ? 0.082 : 0.11) : 0.09;
    this.effects.createImpact(this.tempVector, target.side === 'enemy' ? '#fff0a0' : '#ffb4a8', impactSize);
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
    if (u >= 1) unit.state = 'dead';
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
    this.effects.clearVictoryLootMotes();
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
    this.enemies.forEach((enemy) => this.enemyCombat.updateApproachIdle(enemy, now, this.phaseStartedAt, this.phase));
    if (this.bossEncounter && !this.bossLandingTriggered && approachElapsed >= BOSS_LANDING_SECONDS) {
      const boss = this.enemies.find((enemy) => enemy.scaleClass === 'boss');
      if (boss !== undefined) {
        const impactPosition = boss.root.position.clone();
        impactPosition.y += 0.16;
        this.effects.createImpact(impactPosition, '#ffd58a', 0.22, 0.38);
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
    this.allies.forEach((ally) => this.allyCombat.update(now, ally));
    this.enemies.forEach((enemy) => this.enemyCombat.update(enemy, now, this.phase));
  }

  private evaluateBattleOutcome(now: number): void {
    if (this.phase === 'result' || this.phase === 'loading') return;
    if (areAllUnitsVisiblyDefeated(this.enemies)) this.enterResult('victory', now);
    else if (areAllUnitsVisiblyDefeated(this.allies)) this.enterResult('defeat', now);
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
    // Hold the completed encounter until Domain accepts the result and supplies the next encounter.
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

  private clearFlightVfx(): void {
    this.effects.clearFlightVfx();
    this.enemies.forEach((enemy) => {
      if (enemy.attackTelegraph) enemy.attackTelegraph.visible = false;
    });
    this.allyCombat.resetTransientVfx();
  }

  private clearProjectiles(): void {
    this.effects.clearAll();
    this.enemies.forEach((enemy) => {
      if (enemy.attackTelegraph) enemy.attackTelegraph.visible = false;
    });
    this.allyCombat.resetTransientVfx();
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