import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'assassin',
  order: 280,
  name: 'Assassin Slime',
  classification: 'Tier 3 / Dagger',
  role: 'Execute DPS',
  modelKind: 'dagger',
  asset: 'assets/assassin-slime.glb',
  accent: '#382e45',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.32,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Narrow mask and curved blades establish Assassin; low-HP execute behavior remains production-runtime work.',
};

export default definition;
