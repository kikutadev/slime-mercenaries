import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'magma-crab',order:364,entityKind:'enemy',name:'マグマガニ',
  classification:'Side Melee / Ember Canyon',
  role:'極端に横長のbody。片側の丸clawへ重さを預け、逆方向へbodyを弾いてぶつかり、反対側clawが遅れて戻る。',
  modelKind:'magma-crab',asset:'assets/enemies/magma-crab.glb',accent:'#d94d25',productionScale:.34,
  enemyBehaviorId:'ember-crab-snap',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Side Snap Bump',
  implementationStatus:'implemented',
  notes:'Extremely wide silhouette with exactly two rounded claws; no thin crab legs or pincer teeth.'
} satisfies SlimeGalleryDefinition;
