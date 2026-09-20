import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'charcoal-roller',order:362,entityKind:'enemy',name:'すみころ',
  classification:'Bruiser / Ember Canyon',
  role:'ほぼ静止した炭球。太い3本の亀裂が赤→橙→黄へ熱を上げ、静止を挟んで重いburst bumpを出す。',
  modelKind:'charcoal-roller',asset:'assets/enemies/charcoal-roller.glb',accent:'#e65324',productionScale:.36,
  enemyBehaviorId:'ember-charcoal-burst',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Three-Stage Coal Burst',
  implementationStatus:'implemented',
  notes:'One charcoal ball, exactly three broad emissive cracks, no limbs or flame decoration.'
} satisfies SlimeGalleryDefinition;
