import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'cannoneer',
  order: 290,
  name: 'Cannoneer Slime',
  classification: 'Tier 3 / Gun',
  role: 'Heavy AoE ranged',
  modelKind: 'gun',
  asset: 'assets/cannoneer-slime.glb',
  accent: '#725840',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.58,
  equipmentAnchor: 'CannoneerCannonAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production artillery signature: long brace and charge, single giant cannon blast, violent recoil and target-side explosion.',
};

export default definition;
