import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'meteor-hatchling',order:384,entityKind:'enemy',name:'りゅうせいヒナ',
  classification:'Ranged / Dragon Crater',
  role:'左右に二個だけ星を連れたヒナ竜。本体を止め、二星を内側へ集めて溜めてから小さな流星を一発落とす。',
  modelKind:'meteor-hatchling',asset:'assets/enemies/meteor-hatchling.glb',accent:'#8177ad',productionScale:.30,
  enemyBehaviorId:'dragon-meteor-cast',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Twin-Star Meteor',
  implementationStatus:'implemented',
  notes:'Exactly two orbiting star motes define the wide silhouette and counter-orbit motion.'
} satisfies SlimeGalleryDefinition;