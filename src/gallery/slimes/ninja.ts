import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'ninja',
  order: 270,
  name: 'Ninja Slime',
  classification: 'Tier 3 / Dagger',
  role: 'Burst skirmisher',
  modelKind: 'dagger',
  asset: 'assets/ninja-slime.glb',
  accent: '#45455d',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.28,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Scarf, forehead plate and shuriken vocabulary establish Ninja; vanish-through multi-hit remains production-runtime work.',
};

export default definition;
