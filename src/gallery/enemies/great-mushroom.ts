import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'great-mushroom',
  order: 204,
  entityKind: 'enemy',
  name: 'オオキノコ',
  classification: 'Enemy / Clover Road / Boss',
  role: '多層の棚菌/reishi型帽と帽子上の小キノコ2本を持つボス。ちびキノコの単純拡大は禁止。',
  modelKind: 'great-mushroom',
  asset: 'assets/enemies/great-mushroom.glb',
  accent: '#cf5148',
  productionScale: 0.46,
  enemyBehaviorId: 'mushroom-boss',
  inspectionFacingYawDegrees: 0,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'hit', 'defeat'],
  signatureLabel: 'FIRST BOSS',
  implementationStatus: 'implemented',
  notes: '通常キノコのbody grammarを保ったまま約2倍の高さへ拡大。大きな傘を少し奥へずらし、実戦の3/4カメラでも目が隠れないことを優先する。',
};

export default definition;
