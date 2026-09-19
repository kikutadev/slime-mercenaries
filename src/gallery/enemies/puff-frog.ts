import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'puff-frog',order:341,entityKind:'enemy',name:'ぷくガエル',
  classification:'Enemy / Sunken Marsh / Melee',
  role:'小さく喉を膨らませ、溜めてから大きく跳び、腹でぺたんと着地する基本敵。',
  modelKind:'puff-frog',asset:'assets/enemies/puff-frog.glb',accent:'#79a95f',productionScale:.37,
  enemyBehaviorId:'marsh-frog-hop',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],implementationStatus:'implemented',
  notes:'Wide round body and tiny feet. Throat inflation is the single readable hook; no realistic frog anatomy.'
} satisfies SlimeGalleryDefinition;