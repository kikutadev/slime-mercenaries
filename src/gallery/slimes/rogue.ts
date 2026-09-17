import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'rogue',
  order: 190,
  name: 'Rogue Slime',
  classification: 'Tier 2 / Dagger',
  role: 'Mobile DPS',
  modelKind: 'dagger',
  asset: 'assets/rogue-slime.glb',
  accent: '#52477c',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.16,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Asymmetric twin daggers and deeper hood folds establish the Rogue branch; sidestep and back-attack behavior remain production-runtime work.',
};

export default definition;
