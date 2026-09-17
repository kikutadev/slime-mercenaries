import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'sniper',
  order: 245,
  name: 'Sniper Slime',
  classification: 'Tier 3 / Bow',
  role: 'Boss killer / piercing shot',
  modelKind: 'bow',
  asset: 'assets/sniper-slime.glb',
  accent: '#8c6a38',
  inspectionFacingYawDegrees: -20,
  inspectionSideDistance: 1.58,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Oversized precision longbow, large sight and long-arrow quiver establish a distinct boss-killer silhouette; charged piercing motion remains production-runtime work.',
};

export default definition;
