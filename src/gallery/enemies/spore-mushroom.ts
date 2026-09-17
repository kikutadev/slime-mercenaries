import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'spore-mushroom',
  order: 203,
  entityKind: 'enemy',
  name: 'ほうしキノコ',
  classification: 'Enemy / Clover Road / Ranged',
  role: '縦長ベル帽＋細身ランタン体型＋左右の胞子球。通常2種と輪郭だけで区別できる遠距離敵。',
  modelKind: 'spore-mushroom',
  asset: 'assets/enemies/spore-mushroom.glb',
  accent: '#b574bd',
  productionScale: 0.31,
  enemyBehaviorId: 'mushroom-spore',
  inspectionFacingYawDegrees: 0,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'hit', 'defeat'],
  implementationStatus: 'implemented',
  notes: '紫の傘と小さな胞子袋だけで遠隔型を区別する。Routine VFXは小さく、味方の攻撃演出より強く見せない。',
};

export default definition;
