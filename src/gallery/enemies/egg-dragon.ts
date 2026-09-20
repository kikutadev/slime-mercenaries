import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'egg-dragon',order:381,entityKind:'enemy',name:'たまごドラゴン',
  classification:'Ranged / Dragon Crater',
  role:'大きな頭と横に張った一枚の卵殻。息を吸って止まり、小さな火球を一発だけ吐いたあと殻が遅れて揺れる。',
  modelKind:'egg-dragon',asset:'assets/enemies/egg-dragon.glb',accent:'#7c89a8',productionScale:.30,
  enemyBehaviorId:'dragon-egg-fire',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Held-Breath Fireball',
  implementationStatus:'implemented',
  notes:'Wide shell-first hatchling silhouette with compact head and bounded throat inflation.'
} satisfies SlimeGalleryDefinition;