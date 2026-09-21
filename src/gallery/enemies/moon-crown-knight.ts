import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'moon-crown-knight',order:376,entityKind:'enemy',name:'月冠の騎士',
  classification:'Boss / Moonlit Castle',
  role:'巨大helmet・広いcape・一個の月冠を持つshort-body Boss。瞬間dash後に止まり、遅れて斬線とcapeが追いつく。',
  modelKind:'moon-crown-knight',asset:'assets/enemies/moon-crown-knight.glb',accent:'#8179a8',productionScale:.48,
  enemyBehaviorId:'castle-moon-knight-boss',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Delayed Moon Slash',
  implementationStatus:'implemented',
  notes:'Short toy knight dominated by helmet and cape; tall humanoid anatomy is intentionally absent.'
} satisfies SlimeGalleryDefinition;