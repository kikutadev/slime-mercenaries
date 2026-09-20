import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'furnace-turtle',order:365,entityKind:'enemy',name:'炉心ガメ',
  classification:'Boss / Ember Canyon',
  role:'縦厚の亀massに中央炉心を埋め込んだBoss。炉を開いて三段階加熱し、重い着地の後に遅れてfire ringを放つ。',
  modelKind:'furnace-turtle',asset:'assets/enemies/furnace-turtle.glb',accent:'#ff6b22',productionScale:.50,
  enemyBehaviorId:'ember-furnace-boss',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Furnace Impact Ring',
  implementationStatus:'implemented',
  notes:'Vertical furnace-shell turtle; not an amber-turtle recolor. One central core owns the controlled glow.'
} satisfies SlimeGalleryDefinition;
