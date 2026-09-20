import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'scarf-snowman',order:353,entityKind:'enemy',name:'マフラー雪だるま',
  classification:'Melee / Frost Ruins',
  role:'横へ大きく張り出す短いマフラーが先に後方へ流れ、その直後に一個の雪bodyがダッシュする。',
  modelKind:'scarf-snowman',asset:'assets/enemies/scarf-snowman.glb',accent:'#c9505b',productionScale:.34,
  enemyBehaviorId:'frost-scarf-dash',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Scarf Dash',
  implementationStatus:'implemented',
  notes:'Single snow mass only; the oversized short scarf owns anticipation and follow-through.'
} satisfies SlimeGalleryDefinition;
