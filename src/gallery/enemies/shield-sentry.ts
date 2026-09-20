import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'shield-sentry',order:372,entityKind:'enemy',name:'たて兵',
  classification:'Guard / Moonlit Castle',
  role:'前面を一枚の大盾が占める玩具兵。盾を植えて静止し、短い一歩だけでbashする。',
  modelKind:'shield-sentry',asset:'assets/enemies/shield-sentry.glb',accent:'#69738f',productionScale:.31,
  enemyBehaviorId:'castle-shield-bash',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Plant & Bash',
  implementationStatus:'implemented',
  notes:'One wide shield owns the silhouette; body and helmet only peek above it.'
} satisfies SlimeGalleryDefinition;