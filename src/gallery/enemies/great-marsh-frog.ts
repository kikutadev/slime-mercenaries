import type { SlimeGalleryDefinition } from '../types';
export default {
  id:'great-marsh-frog',order:345,entityKind:'enemy',name:'おおぬまガエル',
  classification:'Boss / Sunken Marsh',
  role:'巨大な喉袋を三段階で膨らませ、静止してから一気に圧を放ち、喉だけが遅れて揺れ戻るBoss。',
  modelKind:'great-marsh-frog',asset:'assets/enemies/great-marsh-frog.glb',accent:'#91ad4c',productionScale:.50,
  enemyBehaviorId:'marsh-frog-boss',inspectionFacingYawDegrees:0,equipmentAnchor:null,weaponTipName:null,
  availableMotions:['idle','move','attack','hit','defeat'],signatureLabel:'Triple Throat Shockwave',
  implementationStatus:'implemented',
  notes:'Boss hook is the enormous throat sac. The attack reads as three inflation beats, still hold, release, delayed throat oscillation.'
} satisfies SlimeGalleryDefinition;
