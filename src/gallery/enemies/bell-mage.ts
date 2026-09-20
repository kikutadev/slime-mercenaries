import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'bell-mage',order:373,entityKind:'enemy',name:'ベル魔導兵',
  classification:'Ranged / Moonlit Castle',
  role:'足のないbell body。左右に一往復して中央で止まり、clapperの遅れとともに音輪を一発放つ。',
  modelKind:'bell-mage',asset:'assets/enemies/bell-mage.glb',accent:'#8176a9',productionScale:.36,
  enemyBehaviorId:'castle-bell-ring',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Center-Stop Chime',
  implementationStatus:'implemented',
  notes:'Tall flared bell silhouette; no feet, robe, wand, or extra held prop.'
} satisfies SlimeGalleryDefinition;