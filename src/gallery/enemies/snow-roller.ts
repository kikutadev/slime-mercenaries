import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'snow-roller',order:351,entityKind:'enemy',name:'ゆきころ',
  classification:'Normal / Frost Ruins',
  role:'一個の雪玉が低く転がって勢いを溜め、小さな氷nubだけが遅れて揺れ戻る基本敵。',
  modelKind:'snow-roller',asset:'assets/enemies/snow-roller.glb',accent:'#8ac9e6',productionScale:.35,
  enemyBehaviorId:'frost-snow-roll',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Snow Roll Bump',
  implementationStatus:'implemented',
  notes:'One snowball plus one restrained ice nub. No extra spikes or humanoid anatomy.'
} satisfies SlimeGalleryDefinition;
