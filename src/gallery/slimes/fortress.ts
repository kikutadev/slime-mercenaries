import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'fortress',
  order: 240,
  name: 'Fortress Slime',
  classification: 'Tier 3 / Shield',
  role: 'Pure tank',
  modelKind: 'shield',
  asset: 'assets/fortress-slime.glb',
  accent: '#8b8174',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.46,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Wide planted pavise establishes the pure-tank silhouette; plant-and-lock behavior remains production-runtime work.',
};

export default definition;
