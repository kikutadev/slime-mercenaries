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
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Large side cannon establishes the artillery silhouette; shell arc and blast AoE remain production-runtime work.',
};

export default definition;
