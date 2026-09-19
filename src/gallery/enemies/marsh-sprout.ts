import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'marsh-sprout',order:342,entityKind:'enemy',name:'ぬまメ',
  classification:'Enemy / Sunken Marsh / Ranged',
  role:'雫型のbodyを伸び縮みさせ、二枚葉を閉じて水を集めてから水玉を一発だけ飛ばす。',
  modelKind:'marsh-sprout',asset:'assets/enemies/marsh-sprout.glb',accent:'#65b7a9',productionScale:.41,
  enemyBehaviorId:'marsh-sprout-orb',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],implementationStatus:'implemented',
  notes:'Water-drop lower body plus exactly two broad leaves. Leaf lag, not detail density, carries the character.'
} satisfies SlimeGalleryDefinition;