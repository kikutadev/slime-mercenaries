import * as THREE from 'three';
import {
  SLIME_MOTION_TIMING,
  clamp01,
  easeOutCubic,
  getAllyDefeatMotion,
} from './slime-motion';
import { resolveTimedMultiplier } from './combat-effects';
import { resetEnemySecondaryPose } from './enemy-motion';
import { createBattleEnvironment } from './battle-environment';
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
import {
  battleRewardParticleCount,
  battleRewardVisual,
  type BattleRewardCue,
} from './battle-reward';
import { BattleClock } from './battle-runtime/clock';
import { BattleCameraController } from './battle-runtime/camera';
import {
  AUTHORITATIVE_DEFEAT_LEAD_SECONDS,
  AUTHORITATIVE_VICTORY_LEAD_SECONDS,
  RESULT_HOLD_SECONDS,
  resolvePresentationHpAfterDamage,
} from './battle-runtime/authority';
import { SCALE, TARGET_HOME } from './battle-runtime/layout';
import { BattleSceneOwner } from './battle-runtime/scene-owner';
import { createBattleSnapshot } from './battle-runtime/snapshot';
import { BattleProjectileSystem } from './battle-runtime/projectile-system';
import { BattleAllyCombatSystem } from './battle-runtime/ally-combat-system';
import { BattleEnemyCombatSystem } from './battle-runtime/enemy-combat-system';
import { BattleUnitFactory } from './battle-runtime/unit-factory';
import {
  setAllyDefeatEyes,
  setEnemyDefeatEyes,
  updateWorldHealthBar,
} from './battle-runtime/unit-visuals';
import {
  applyUnitDeformation,
  clearMorphs,
  facePoint,
  findNearest,
  isMeleeBehavior,
  resetBranchAccents,
  setEquipmentSwing,
  setMorph,
  setSecondaryEquipmentSwing,
  updateHopTravel,
  updateIdle,
} from './battle-runtime/unit-presentation';
import type {
  AllyUnit,
  BattleRuntimeAllyConfig,
  BattleRuntimeEnemyConfig,
  BattleRuntimeOptions,
  BattleSnapshot,
  EnemyUnit,
  VictoryLootMoteRuntime,
} from './battle-runtime/types';

export class BattleRuntime {
  private readonly sceneOwner: BattleSceneOwner;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly cameraController: BattleCameraController;
  private readonly clock = new BattleClock();
  private readonly stageNumber: number;
  private readonly waveIndex: number;
  private readonly allyConfigs: readonly BattleRuntimeAllyConfig[];
  private readonly enemyConfigs: readonly BattleRuntimeEnemyConfig[];
  private readonly authoritativeResult: 'victory' | 'defeat' | null;
  private readonly authoritativeResultDelaySec: number | null;
  private readonly onSnapshot: (snapshot: BattleSnapshot) => void;
  private readonly bossEncounter: boolean;
  private readonly tempVector = new THREE.Vector3();
  private readonly tempVector2 = new THREE.Vector3();
  private readonly tempVector3 = new THREE.Vector3();
  private readonly tempVector4 = new THREE.Vector3();
  private readonly tempVector5 = new THREE.Vector3();
  private readonly tempVector6 = new THREE.Vector3();

  private readonly allies: AllyUnit[] = [];
  private readonly enemies: EnemyUnit[] = [];
  private readonly projectileSystem: BattleProjectileSystem;
  private readonly allyCombatSystem: BattleAllyCombatSystem;
  private readonly enemyCombatSystem: BattleEnemyCombatSystem;
  private readonly unitFactory: BattleUnitFactory;
  private readonly victoryLootMotes: VictoryLootMoteRuntime[] = [];
  private pendingRewardCue: BattleRewardCue | null = null;
  private lastRewardCueId: string | null = null;
  private environmentSceneryRoot: THREE.Group | null = null;
  private environmentTravel: ((distance: number) => void) | null = null;
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
    this.sceneOwner = new BattleSceneOwner(options.scene);
    this.camera = options.camera;
    this.cameraController = new BattleCameraController(options.camera);
    this.projectileSystem = new BattleProjectileSystem({
      sceneOwner: this.sceneOwner,
      camera: options.camera,
      now: () => this.simulationNow,
      getLivingEnemies: () => this.getLivingEnemies(),
      applyDamage: (target, amount, source, sourcePosition) =>
        this.applyDamage(target, amount, source, sourcePosition),
    });
    this.allyCombatSystem = new BattleAllyCombatSystem({
      sceneOwner: this.sceneOwner,
      camera: options.camera,
      projectileSystem: this.projectileSystem,
      getLivingEnemies: () => this.getLivingEnemies(),
      applyDamage: (target, amount, source, sourcePosition) =>
        this.applyDamage(target, amount, source, sourcePosition),
      startHitStop: (durationSeconds) => this.clock.startHitStop(durationSeconds),
      startCameraShake: (duration, amplitude) => this.startCameraShake(duration, amplitude),
    });
    this.enemyCombatSystem = new BattleEnemyCombatSystem({
      projectileSystem: this.projectileSystem,
      phase: () => this.phase,
      phaseStartedAt: () => this.phaseStartedAt,
      getLivingAllies: () => this.getLivingAllies(),
      applyDamage: (target, amount, source, sourcePosition) =>
        this.applyDamage(target, amount, source, sourcePosition),
      startCameraShake: (duration, amplitude) => this.startCameraShake(duration, amplitude),
    });
    this.stageNumber = options.stageNumber;
    this.waveIndex = options.waveIndex;
    this.allyConfigs = options.allies;
    this.enemyConfigs = options.enemies;
    this.authoritativeResult = options.authoritativeResult;
    this.authoritativeResultDelaySec = options.authoritativeResultDelaySec;
    this.onSnapshot = options.onSnapshot;
    this.bossEncounter = options.enemies.some((enemy) => enemy.scaleClass === 'boss');
    this.continuationEntryPending = shouldUseMarchEntry(options.stageNumber, options.waveIndex);
    this.unitFactory = new BattleUnitFactory({
      sceneOwner: this.sceneOwner,
      baseUrl: options.baseUrl,
      continuationEntryPending: this.continuationEntryPending,
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized || this.disposed) return;
    this.initialized = true;

    try {
      this.cameraController.reset();

      const environment = this.sceneOwner.captureAddedBy((scene) =>
        createBattleEnvironment(scene, this.stageNumber, this.waveIndex));
      this.environmentSceneryRoot = environment.sceneryRoot;
      this.environmentTravel = environment.setTravelDistance;

      const [allyResult, enemyResult] = await Promise.allSettled([
        this.unitFactory.loadAllies(this.allyConfigs),
        this.unitFactory.loadEnemies(this.enemyConfigs),
      ]);
      if (allyResult.status === 'rejected') throw allyResult.reason;
      if (enemyResult.status === 'rejected') throw enemyResult.reason;

      if (this.disposed) {
        this.cleanupRuntimeResources();
        return;
      }
      const loadedAllies = allyResult.value;
      const loadedEnemies = enemyResult.value;
      this.allies.push(...loadedAllies);
      this.enemies.push(...loadedEnemies);
      this.allies.forEach((ally) => this.facePoint(ally, TARGET_HOME));
      if (this.pendingRewardCue !== null) {
        const cue = this.pendingRewardCue;
        this.pendingRewardCue = null;
        this.createVictoryLootMotes(cue);
      }
      this.startBattle(this.rawNow + 0.15);
      this.emitSnapshot(true);
    } catch (cause) {
      this.cleanupRuntimeResources();
      throw cause;
    }
  }

  tick(rawNow: number): void {
    if (!this.initialized || this.disposed) return;
    const { hitStopActive, simulationNow } = this.clock.advance(rawNow);
    if (this.allies.length === 0) return;

    if (!hitStopActive) {
      if (this.phase === 'approach') this.updateApproach(simulationNow);
      else if (this.phase === 'combat') this.updateCombat(simulationNow);
      else if (this.phase === 'result') this.updateResult(simulationNow);

      this.enforceAuthoritativeResult(simulationNow);
      this.allies.forEach((ally) => this.updateAllyDefeat(ally, simulationNow));
      this.projectileSystem.update(simulationNow);
      this.updateVictoryLootMotes(simulationNow);
      this.evaluateBattleOutcome(simulationNow);
    }
    this.updateHealthBars();
    this.updateCamera(rawNow);
    this.emitSnapshot();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cleanupRuntimeResources();
  }

  private cleanupRuntimeResources(): void {
    this.projectileSystem.clear();
    this.sceneOwner.dispose();
    this.allies.length = 0;
    this.enemies.length = 0;
    this.victoryLootMotes.length = 0;
    this.unitFactory.clearCache();
    this.environmentSceneryRoot = null;
    this.environmentTravel = null;
    this.pendingRewardCue = null;
  }

  private get rawNow(): number {
    return this.clock.rawNow;
  }

  private get simulationNow(): number {
    return this.clock.simulationNow;
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
        this.sceneOwner.add(mesh);
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
      this.sceneOwner.remove(mote.mesh);
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
    this.resetBranchAccents(ally);
    if (ally.faceRoot) ally.faceRoot.position.copy(ally.faceBasePosition);
    this.applyUnitDeformation(ally, 0, pose.stretch, pose.lean, Math.sin(elapsed * 3.9 + ally.slotIndex) * 0.025, pose.bob);
    this.setEquipmentSwing(ally, Math.sin(elapsed * 7.8 + ally.slotIndex * 0.82) * 0.075, pose.bob * 0.18, 0);
    this.tempVector2.set(ally.root.position.x, 0, ally.root.position.z - 1);
    this.facePoint(ally, this.tempVector2);
  }

  private setMorph(unit: AllyUnit, name: string, value: number): void {
    setMorph(unit, name, value);
  }

  private clearMorphs(unit: AllyUnit): void {
    clearMorphs(unit);
  }

  private facePoint(unit: AllyUnit | EnemyUnit, point: THREE.Vector3): void {
    facePoint(unit, point);
  }

  private applyUnitDeformation(
    unit: AllyUnit,
    squash = 0,
    stretch = 0,
    lean = 0,
    wobble = 0,
    jump = 0,
  ): void {
    applyUnitDeformation(unit, squash, stretch, lean, wobble, jump);
  }

  private setEquipmentSwing(unit: AllyUnit, angle: number, lift = 0, sweep = 0): void {
    setEquipmentSwing(unit, angle, lift, sweep);
  }

  private isMeleeBehavior(unit: AllyUnit): boolean {
    return isMeleeBehavior(unit);
  }

  private setSecondaryEquipmentSwing(unit: AllyUnit, angle: number, lift = 0, sweep = 0): void {
    setSecondaryEquipmentSwing(unit, angle, lift, sweep);
  }

  private resetBranchAccents(unit: AllyUnit): void {
    resetBranchAccents(unit);
  }

  private updateIdle(unit: AllyUnit, now: number, phaseOffset = 0): void {
    updateIdle(unit, now, phaseOffset);
  }

  private updateHopTravel(
    unit: AllyUnit,
    now: number,
    startTime: number,
    start: THREE.Vector3,
    end: THREE.Vector3,
    duration: number,
  ): boolean {
    return updateHopTravel(unit, now, startTime, start, end, duration);
  }

  private getLivingEnemies(): EnemyUnit[] {
    return this.enemies.filter((enemy) => enemy.alive);
  }

  private getLivingAllies(): AllyUnit[] {
    return this.allies.filter((ally) => ally.alive);
  }

  private findNearest<T extends AllyUnit | EnemyUnit>(
    source: AllyUnit | EnemyUnit,
    candidates: T[],
  ): T | null {
    return findNearest(source, candidates);
  }

  private updateHealthBars(): void {
    this.allies.forEach((ally) =>
      updateWorldHealthBar(ally, this.camera, this.phase, this.result));
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
    const isLastLivingUnit = target.side === 'enemy'
      ? this.getLivingEnemies().length === 1
      : this.getLivingAllies().length === 1;
    target.hp = resolvePresentationHpAfterDamage({
      hp: target.hp,
      damage: effectiveAmount,
      authoritativeResult: this.authoritativeResult,
      isLastLivingUnit,
    });
    target.hitStartedAt = this.simulationNow;
    this.tempVector.copy(target.root.position);
    this.tempVector.y += target.side === 'enemy' ? 0.28 : 0.22;
    const impactSize = target.side === 'enemy' ? (source === 'melee' ? 0.082 : 0.11) : 0.09;
    this.projectileSystem.createImpact(this.tempVector, target.side === 'enemy' ? '#fff0a0' : '#ffb4a8', impactSize);
    this.startCameraShake(0.12, target.side === 'enemy' ? 0.025 : 0.017);
    if (source !== 'projectile') this.clock.startHitStop(source === 'enemy' ? 0.028 : 0.038);

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
    this.setEquipmentSwing(unit, pose.equipment.angle, pose.equipment.lift, pose.equipment.sweep);
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
      ally.attackStartedAt = -Infinity;
      ally.attackTarget = null;
      ally.hitsApplied = 0;
      ally.shotApplied = false;
      ally.nextAttackAt = now + ((ally.behaviorId === 'bow-ranged' || ally.behaviorId === 'ranger-double-shot' || ally.behaviorId === 'sniper-pierce' || ally.behaviorId === 'storm-archer-volley' || ally.behaviorId === 'mage-aoe' || ally.behaviorId === 'archmage-burst' || ally.behaviorId === 'frost-mage-control' || ally.behaviorId === 'gunner-burst' || ally.behaviorId === 'cannoneer-shell' || ally.behaviorId === 'engineer-turret') ? 0.65 : 1.7) + ally.slotIndex * 0.05;
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
    const duration = this.bossEncounter ? BOSS_APPROACH_SECONDS : NORMAL_APPROACH_SECONDS;
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
    this.enemyCombatSystem.updateApproach(this.enemies, now);
    if (this.bossEncounter && !this.bossLandingTriggered && approachElapsed >= BOSS_LANDING_SECONDS) {
      const boss = this.enemies.find((enemy) => enemy.scaleClass === 'boss');
      if (boss !== undefined) {
        const impactPosition = boss.root.position.clone();
        impactPosition.y += 0.16;
        this.projectileSystem.createImpact(impactPosition, '#ffd58a', 0.22, 0.38);
        this.startCameraShake(0.22, 0.052);
      }
      this.bossLandingTriggered = true;
    }
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
    this.allyCombatSystem.update(this.allies, now);
    this.enemyCombatSystem.updateCombat(this.enemies, now);
  }

  private enforceAuthoritativeResult(now: number): void {
    if (this.authoritativeResult === null || this.authoritativeResultDelaySec === null) return;
    if (this.phase === 'loading' || this.phase === 'result') return;
    const leadSeconds = this.authoritativeResult === 'defeat'
      ? AUTHORITATIVE_DEFEAT_LEAD_SECONDS
      : AUTHORITATIVE_VICTORY_LEAD_SECONDS;
    const triggerDelay = Math.max(0.8, this.authoritativeResultDelaySec - leadSeconds);
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
        this.clearMorphs(ally);
        this.setEquipmentSwing(ally, 0);
        this.resetBranchAccents(ally);
      }
    });
    this.enemies.forEach((enemy) => {
      enemy.attackStartedAt = -Infinity;
      enemy.attackTarget = null;
    });
    this.projectileSystem.clearFlight();
    if (this.environmentSceneryRoot) this.environmentSceneryRoot.position.z = 0;
    this.environmentTravel?.(0);
    this.emitSnapshot(true);
  }

  private updateResult(now: number): void {
    const elapsed = Math.max(0, now - this.phaseStartedAt);
    this.enemyCombatSystem.updateDefeats(this.enemies, now);
    if (this.result === 'victory') {
      const presentationElapsed = getVictoryPresentationElapsed(elapsed, this.bossEncounter);
      const transition = getVictoryTransitionPose(presentationElapsed, 0);
      this.allies.forEach((ally) => this.updateVictoryMarch(ally, now));
      this.environmentTravel?.(transition.sceneryTravel);
      return;
    }
    this.allies.forEach((ally) => {
      if (ally.alive) this.updateIdle(ally, now, ally.slotIndex * 0.31);
    });
    // Domain-owned results stay visible until the Domain advances/remounts the encounter.
    if (this.authoritativeResult !== null) return;
    if (elapsed >= RESULT_HOLD_SECONDS) this.resetWave(now);
  }

  private resetWave(now: number): void {
    this.continuationEntryPending = false;
    this.clearVictoryLootMotes();
    this.projectileSystem.clear();
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

  private startCameraShake(duration: number, amplitude: number): void {
    this.cameraController.startShake(this.rawNow, duration, amplitude);
  }

  private updateCamera(now: number): void {
    this.cameraController.update({
      rawNow: now,
      simulationNow: this.simulationNow,
      phase: this.phase,
      phaseStartedAt: this.phaseStartedAt,
      result: this.result,
      bossEncounter: this.bossEncounter,
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