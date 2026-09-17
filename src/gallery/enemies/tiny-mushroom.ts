import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'tiny-mushroom',
  order: 201,
  entityKind: 'enemy',
  name: 'ちびキノコ',
  classification: 'Enemy / Clover Road / Fodder',
  role: '最初に出会う小型の標準キノコ。小さく跳ねて頭突きする。',
  modelKind: 'tiny-mushroom',
  asset: 'assets/enemies/tiny-mushroom.glb',
  accent: '#ed7664',
  productionScale: 0.31,
  enemyBehaviorId: 'mushroom-bump',
  inspectionFacingYawDegrees: 0,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'hit', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'V2基準個体。低いボタン帽＋豆型ボディ＋刺繍サイズの点目。色を消しても最小・軽量の敵として読めること。',
};

export default definition;
