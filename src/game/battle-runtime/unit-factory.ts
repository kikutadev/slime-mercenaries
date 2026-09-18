import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  createGuardPulseVfx,
  createMageCastSigil,
  createRogueSlashArc,
  type MorphMesh,
} from '../slime-motion';
import {
  createBerserkerSignatureVfx,
  createBlademasterSignatureVfx,
} from '../slime-motions/tier3/sword';
import {
  createSniperSignatureVfx,
  createStormSignatureVfx,
} from '../slime-motions/tier3/bow';
import {
  createFortressSignatureVfx,
  createPaladinSignatureVfx,
} from '../slime-motions/tier3/defense';
import {
  createArchmageSignatureVfx,
  createFrostMageSignatureVfx,
} from '../slime-motions/tier3/magic';
import {
  createAssassinSignatureVfx,
  createCannoneerSignatureVfx,
  createEngineerSignatureVfx,
  createNinjaSignatureVfx,
} from '../slime-motions/tier3/effects';
import {
  captureEnemyRigRestPose,
  getEnemyMotionProfile,
  resolveEnemyRigParts,
  type EnemyMotionProfile,
} from '../enemy-motion';
import { getVictoryMarchSlot } from '../battle-transition';
import { allyHome, enemyHome, meleeCombatAnchor, SCALE } from './layout';
import type { BattleSceneOwner } from './scene-owner';
import type {
  AllyUnit,
  BattleRuntimeAllyConfig,
  BattleRuntimeEnemyConfig,
  EnemyUnit,
} from './types';
import {
  createAllyDefeatEyes,
  createEnemyDefeatEyes,
  createShadow,
  createWorldHealthBar,
  setEnemyDefeatEyes,
} from './unit-visuals';

export interface BattleUnitFactoryOptions {
  sceneOwner: BattleSceneOwner;
  baseUrl: string;
  continuationEntryPending: boolean;
}

export class BattleUnitFactory {
  private readonly loader = new GLTFLoader();
  private readonly enemyTemplatePromises = new Map<string, Promise<THREE.Group>>();

  constructor(private readonly options: BattleUnitFactoryOptions) {}

  clearCache(): void {
    this.enemyTemplatePromises.clear();
  }

  async loadAllies(configs: readonly BattleRuntimeAllyConfig[]): Promise<AllyUnit[]> {
    return Promise.all(configs.map((config) => this.loadAlly(config)));
  }

  async loadEnemies(configs: readonly BattleRuntimeEnemyConfig[]): Promise<EnemyUnit[]> {
    return Promise.all(configs.map((config) => this.loadEnemy(config)));
  }

  private makeEnemyAttackTelegraph(
    motionProfile: EnemyMotionProfile,
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
    this.options.sceneOwner.add(mesh);
    return mesh;
  }

  private loadEnemyTemplate(asset: string): Promise<THREE.Group> {
    const cached = this.enemyTemplatePromises.get(asset);
    if (cached !== undefined) return cached;
    const promise = this.loader
      .loadAsync(this.options.baseUrl + asset)
      .then((gltf) => gltf.scene as THREE.Group);
    this.enemyTemplatePromises.set(asset, promise);
    return promise;
  }

  private async loadEnemy(config: BattleRuntimeEnemyConfig): Promise<EnemyUnit> {
    const home = enemyHome(config.formationSlot);
    const template = await this.loadEnemyTemplate(config.asset);
    const root = template.clone(true) as THREE.Group;
    root.name = 'EnemyRuntime:' + config.enemyId + ':' + config.instanceIndex;
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
    const attackTelegraph = this.makeEnemyAttackTelegraph(motionProfile);
    const rigParts = resolveEnemyRigParts(root);
    const rigRest = captureEnemyRigRestPose(rigParts);
    const normalEyes = ['Eye_L', 'Eye_R']
      .map((name) => root.getObjectByName(name))
      .filter((eye): eye is THREE.Object3D => Boolean(eye));
    const xEyes = createEnemyDefeatEyes(normalEyes);
    setEnemyDefeatEyes(normalEyes, xEyes, false);
    this.options.sceneOwner.add(root);
    const shadow = createShadow(this.options.sceneOwner, config.shadowRadius);
    shadow.position.set(home.x, 0.011, home.z);

    return {
      id: 'enemy-' + config.enemyId + '-' + (config.instanceIndex + 1),
      side: 'enemy',
      enemyId: config.enemyId,
      name: config.name,
      behaviorId: config.behaviorId,
      scaleClass: config.scaleClass,
      formationSlot: config.formationSlot,
      index: config.instanceIndex,
      root,
      bodyRoot,
      bodyBaseScale: bodyRoot.scale.clone(),
      faceRoot,
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
      baseScale: config.renderScale,
      maxHp: config.maxHp,
      hp: config.maxHp,
      moveSpeed: config.moveSpeed,
      attackRange: config.attackRange,
      attackInterval: config.attackInterval,
      attackDamage: config.attackDamage,
      initialAttackDelay: config.initialAttackDelay,
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
      normalEyes,
      xEyes,
      moveSpeedEffect: null,
    };
  }

  private async loadAlly(config: BattleRuntimeAllyConfig): Promise<AllyUnit> {
    const home = allyHome(config.slotIndex);
    const combatAnchor = config.formationRole === 'front'
      ? meleeCombatAnchor(config.slotIndex)
      : home.clone();
    const marchSlot = getVictoryMarchSlot(config.slotIndex);
    const approachOrigin = this.options.continuationEntryPending
      ? new THREE.Vector3(marchSlot.x, 0.02, marchSlot.z)
      : home.clone();
    const gltf = await this.loader.loadAsync(this.options.baseUrl + config.asset);
    const root = gltf.scene as THREE.Group;
    root.name = 'SlimeRuntime:' + config.slimeId + ':' + config.slotIndex;
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
    const weaponTip = config.weaponTipName === null
      ? null
      : root.getObjectByName(config.weaponTipName) ?? null;
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
      throw new Error(
        config.slimeId + ' model is missing runtime anchors (' + config.equipmentAnchorName + ').',
      );
    }

    const shadow = createShadow(this.options.sceneOwner, 0.24);
    shadow.position.set(approachOrigin.x, 0.011, approachOrigin.z);
    const healthBar = createWorldHealthBar(this.options.sceneOwner);
    const guardPulseVfx = (
      config.behaviorId === 'guardian-guard'
      || config.behaviorId === 'paladin-barrier'
      || config.behaviorId === 'fortress-plant'
    ) ? createGuardPulseVfx() : null;
    if (guardPulseVfx) this.options.sceneOwner.add(guardPulseVfx);
    const mageCastSigil = (
      config.behaviorId === 'mage-aoe'
      || config.behaviorId === 'archmage-burst'
      || config.behaviorId === 'frost-mage-control'
    ) ? createMageCastSigil() : null;
    if (mageCastSigil) this.options.sceneOwner.add(mageCastSigil);
    const rogueSlashArc = (
      config.behaviorId === 'rogue-twin-strike'
      || config.behaviorId === 'ninja-vanish'
      || config.behaviorId === 'assassin-execute'
    ) ? createRogueSlashArc() : null;
    if (rogueSlashArc) this.options.sceneOwner.add(rogueSlashArc);

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
    if (signatureVfx) this.options.sceneOwner.add(signatureVfx);

    const unit: AllyUnit = {
      id: 'ally-' + config.slimeId + '-' + config.slotIndex,
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
      secondaryEquipmentBaseQuaternion:
        secondaryEquipmentAnchor?.quaternion.clone() ?? new THREE.Quaternion(),
      secondaryEquipmentBasePosition:
        secondaryEquipmentAnchor?.position.clone() ?? new THREE.Vector3(),
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
    const eyes = createAllyDefeatEyes(root);
    unit.normalEyes = eyes.normalEyes;
    unit.xEyes = eyes.xEyes;
    this.options.sceneOwner.add(root);
    return unit;
  }
}
