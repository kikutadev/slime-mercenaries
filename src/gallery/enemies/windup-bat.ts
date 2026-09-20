import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'windup-bat',order:374,entityKind:'enemy',name:'ぜんまいコウモリ',
  classification:'Ranged / Moonlit Castle',
  role:'横長のtoy batに片側だけ大きなぜんまい。身体を止めたまま巻き戻し、release後に翼が追いつく。',
  modelKind:'windup-bat',asset:'assets/enemies/windup-bat.glb',accent:'#6e789c',productionScale:.27,
  enemyBehaviorId:'castle-windup-burst',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Wind-Up Burst',
  implementationStatus:'implemented',
  notes:'Two broad toy wing plates plus one asymmetric key; never a realistic articulated bat wing.'
} satisfies SlimeGalleryDefinition;