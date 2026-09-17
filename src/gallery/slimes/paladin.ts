import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'paladin',
  order: 230,
  name: 'Paladin Slime',
  classification: 'Tier 3 / Shield',
  role: 'Sustain tank',
  modelKind: 'shield',
  asset: 'assets/paladin-slime.glb',
  accent: '#d8c77c',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.34,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Platinum aegis and halo establish the sacred sustain-tank silhouette; barrier pulse remains production-runtime work.',
};

export default definition;
