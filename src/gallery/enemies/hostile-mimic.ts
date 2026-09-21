import type { SlimeGalleryDefinition } from '../types';

export default {
  id: 'hostile-mimic',
  order: 375,
  entityKind: 'enemy',
  name: '化け宝箱',
  classification: 'Special / Moonlit Castle',
  role: '閉じた宝箱として待ち、蓋を大きく跳ね上げて前へ噛みつく特殊遭遇個体。',
  modelKind: 'hostile-mimic',
  asset: 'assets/enemies/hostile-mimic.glb',
  accent: '#a767b8',
  productionScale: .38,
  enemyBehaviorId: 'mimic-chest-snap',
  inspectionFacingYawDegrees: 0,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'hit', 'defeat'],
  signatureLabel: 'Chest Snap',
  implementationStatus: 'implemented',
  notes: 'Purple slime body under a wooden chest shell; lid motion must remain readable at gameplay scale.',
} satisfies SlimeGalleryDefinition;
