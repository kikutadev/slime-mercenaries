import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'guardian',
  order: 160,
  name: 'Guardian Slime',
  classification: 'Tier 2 / Shield',
  role: 'Tank / ally guard',
  modelKind: 'shield',
  asset: 'assets/guardian-slime.glb',
  accent: '#c39a53',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.28,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Tower shield and compact helm create the Tier-2 defensive read; shield bash and guard pulse remain production-runtime work.',
};

export default definition;
