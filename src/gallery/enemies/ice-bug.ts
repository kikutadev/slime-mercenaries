import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'ice-bug',order:352,entityKind:'enemy',name:'こおりムシ',
  classification:'Ranged / Frost Ruins',
  role:'背中の太い氷棘3本をいったん後ろへ倒し、静止してから前へ弾いて氷片を一発だけ飛ばす。',
  modelKind:'ice-bug',asset:'assets/enemies/ice-bug.glb',accent:'#63b9df',productionScale:.35,
  enemyBehaviorId:'frost-ice-spike-shot',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Triple Spike Snap',
  implementationStatus:'implemented',
  notes:'Exactly three broad spikes; the ranged tell is their group lean rather than eye or VFX size.'
} satisfies SlimeGalleryDefinition;
