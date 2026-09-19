import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'bubble-snail',order:343,entityKind:'enemy',name:'あわタニシ',
  classification:'Enemy / Sunken Marsh / Support',
  role:'小さなbodyの後ろから巨大bubble shellが遅れて追従し、圧縮した泡の反動でぶつかる。',
  modelKind:'bubble-snail',asset:'assets/enemies/bubble-snail.glb',accent:'#7fc9c5',productionScale:.45,
  enemyBehaviorId:'marsh-bubble-pulse',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],implementationStatus:'implemented',
  notes:'The translucent bubble shell dominates silhouette. Body settles first; shell keeps moving for the delayed cute reaction.'
} satisfies SlimeGalleryDefinition;