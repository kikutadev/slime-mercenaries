import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'crackle-bug',order:363,entityKind:'enemy',name:'ぱちパチムシ',
  classification:'Ranged / Ember Canyon',
  role:'丸いcharge shellを二度だけ震わせ、短い静止の後に小さな火花を一発だけ放つ。',
  modelKind:'crackle-bug',asset:'assets/enemies/crackle-bug.glb',accent:'#f27c2f',productionScale:.35,
  enemyBehaviorId:'ember-spark-shell',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Double Shake Spark',
  implementationStatus:'implemented',
  notes:'One oversized rounded charge shell and four simple pads; never a realistic six-leg beetle cycle.'
} satisfies SlimeGalleryDefinition;
