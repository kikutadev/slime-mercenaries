import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'snow-statue-guardian',order:355,entityKind:'enemy',name:'雪像の番人',
  classification:'Boss / Frost Ruins',
  role:'上段雪massが先に回り、下段が遅れて追従。全身spin後に雪圧と氷柱を放ち、幅広crestだけが遅れて揺れ戻るBoss。',
  modelKind:'snow-statue-guardian',asset:'assets/enemies/snow-statue-guardian.glb',accent:'#5cb9dc',productionScale:.50,
  enemyBehaviorId:'frost-guardian-boss',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Frozen Statue Spin',
  implementationStatus:'implemented',
  notes:'Non-humanoid two-mass snow statue. Broad ice crest and delayed upper/lower inertia separate it from normal snow enemies.'
} satisfies SlimeGalleryDefinition;
