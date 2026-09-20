import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'star-eater-dragon',order:385,entityKind:'enemy',name:'星喰らい竜',
  classification:'Boss / Dragon Crater',
  role:'巨大な頭・広い翼・短い胴の最終Boss。翼と星光を内側へ畳んで止まり、解放突進のあと遅れて尾と星輪が追いつく。',
  modelKind:'star-eater-dragon',asset:'assets/enemies/star-eater-dragon.glb',accent:'#74659c',productionScale:.46,
  enemyBehaviorId:'dragon-star-eater-boss',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Star-Eater Charge',
  implementationStatus:'implemented',
  notes:'Final toy-dragon boss: enormous head, broad wings, one tail, one horn pair, and a seven-beat signature attack.'
} satisfies SlimeGalleryDefinition;