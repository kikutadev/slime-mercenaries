import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'star-eater-lizard',order:383,entityKind:'enemy',name:'星くいトカゲ',
  classification:'Melee / Dragon Crater',
  role:'低い体に一個だけ大きな星結晶を背負う。星の光を吸い切って静止し、蓄えた光で一直線に突進する。',
  modelKind:'star-eater-lizard',asset:'assets/enemies/star-eater-lizard.glb',accent:'#6f6a9a',productionScale:.30,
  enemyBehaviorId:'dragon-star-lizard-charge',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Star-Drain Charge',
  implementationStatus:'implemented',
  notes:'Low bean-lizard with one oversized back star; no realistic long legs, neck, or crystal clutter.'
} satisfies SlimeGalleryDefinition;