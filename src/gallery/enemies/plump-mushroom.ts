import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'plump-mushroom',
  order: 202,
  entityKind: 'enemy',
  name: 'ぷくキノコ',
  classification: 'Enemy / Clover Road / Elite-lite',
  role: '横長ダンプリング体型＋雲状の低い帽子。眠そうな小さい目で、色より先に重い敵だと分かること。',
  modelKind: 'plump-mushroom',
  asset: 'assets/enemies/plump-mushroom.glb',
  accent: '#ee8f52',
  productionScale: 0.34,
  enemyBehaviorId: 'mushroom-heavy-bump',
  inspectionFacingYawDegrees: 0,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'hit', 'defeat'],
  implementationStatus: 'implemented',
  notes: '通常キノコより厚い傘だけを誇張し、装飾を増やさず耐久型であることをシルエットから読ませる。',
};

export default definition;
