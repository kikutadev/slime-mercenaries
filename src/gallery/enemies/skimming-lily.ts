import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'skimming-lily',order:344,entityKind:'enemy',name:'すいすいハス',
  classification:'Enemy / Sunken Marsh / Harasser',
  role:'極端に薄いハスのbodyを傾け、左右の予備動作から水面を斜めに高速skimする。',
  modelKind:'skimming-lily',asset:'assets/enemies/skimming-lily.glb',accent:'#4f9d58',productionScale:.36,
  enemyBehaviorId:'marsh-lily-skim',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],implementationStatus:'implemented',
  notes:'Almost-flat horizontal silhouette. Movement stays glide-led and avoids a walking or hopping read.'
} satisfies SlimeGalleryDefinition;
