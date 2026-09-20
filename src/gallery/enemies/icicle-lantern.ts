import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'icicle-lantern',order:354,entityKind:'enemy',name:'つららランタン',
  classification:'Caster / Frost Ruins',
  role:'浮遊する縦長ランタン。内部coreを膨らませて淡く発光し、細い氷rayを一発だけ放つ。',
  modelKind:'icicle-lantern',asset:'assets/enemies/icicle-lantern.glb',accent:'#72d6ef',productionScale:.36,
  enemyBehaviorId:'frost-lantern-ray',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Icicle Ray',
  implementationStatus:'implemented',
  notes:'No feet, hands or staff. Float + one lower icicle + bounded internal glow are the identity.'
} satisfies SlimeGalleryDefinition;