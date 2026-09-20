import type * as THREE from 'three';
import type { TimedMultiplierEffect } from '../combat-effects';
import type { EnemyMotionProfile, EnemyRigParts, EnemyRigRestPose } from '../enemy-motion';
import type { EnemyBehaviorId, EnemyId, EnemyScaleClass } from '../enemies';
import type { EnemyFormationSlot } from '../encounters';
import type { MorphMesh } from '../slime-motion';
import type { BattleBehaviorId } from '../slimes';

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
  presentationReady: boolean;
  allies: Readonly<Record<string, BattleSnapshotAlly>>;
}

export type UnitState = 'idle' | 'defeat' | 'dead';
export type BasicMaterial = THREE.MeshBasicMaterial;

export type HealthBarGroup = THREE.Group & {
  userData: {
    fill?: THREE.Mesh;
    fillWidth?: number;
  };
};

export interface AllyUnit {
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
  signatureVfx: THREE.Group | null;
  auxiliaryRoot: THREE.Object3D | null;
  auxiliaryMuzzle: THREE.Object3D | null;
  auxiliaryBasePosition: THREE.Vector3;
  auxiliaryBaseQuaternion: THREE.Quaternion;
  auxiliaryBaseScale: THREE.Vector3;
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
  damageTakenEffect: TimedMultiplierEffect | null;
}

export interface EnemyUnit {
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
  attackTelegraph: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | null;
  attackTelegraphPosition: THREE.Vector3;
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
  moveSpeedEffect: TimedMultiplierEffect | null;
}

export interface ProjectileRuntime {
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
  slowEffect?: Readonly<{ durationSec: number; multiplier: number; radius: number }>;
  pierceDamage?: number;
  pierceWidth?: number;
}

export interface TracerRuntime {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  startedAt: number;
  duration: number;
}

export interface MuzzleFlashRuntime {
  mesh: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>;
  startedAt: number;
  duration: number;
}

export interface EnemyProjectileRuntime {
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

export interface ImpactRuntime {
  group: THREE.Group;
  materials: THREE.MeshBasicMaterial[];
  startedAt: number;
  duration: number;
}

export interface VictoryLootMoteRuntime {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  start: THREE.Vector3;
  end: THREE.Vector3;
  delay: number;
  startedAt: number;
  duration: number;
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
  /** Domain-authored encounter result. Runtime presents it but never owns progression. */
  authoritativeResult: 'victory' | 'defeat' | null;
  authoritativeResultDelaySec: number | null;
  onSnapshot: (snapshot: BattleSnapshot) => void;
}

export type BattleRuntimeEncounterUpdate = Readonly<{
  stageNumber: number;
  waveIndex: number;
  enemies: readonly BattleRuntimeEnemyConfig[];
  authoritativeResult: 'victory' | 'defeat' | null;
  authoritativeResultDelaySec: number | null;
}>;
