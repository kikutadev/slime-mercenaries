import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'ember-gecko',order:361,entityKind:'enemy',name:'ひのこヤモリ',
  classification:'Fast Melee / Ember Canyon',
  role:'低い丸ヤモリ。尻尾先の一個の火種を育てて突進し、本体停止後に尻尾だけが遅れて振り切る。',
  modelKind:'ember-gecko',asset:'assets/enemies/ember-gecko.glb',accent:'#ef6a2a',productionScale:.35,
  enemyBehaviorId:'ember-tail-dash',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Ember Tail Dash',
  implementationStatus:'implemented',
  notes:'Low bean gecko with one controlled flame tip; no back spikes or particle plume.'
} satisfies SlimeGalleryDefinition;
