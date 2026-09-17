import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'blademaster',
  order: 210,
  name: 'Blademaster Slime',
  classification: 'Tier 3 / Sword',
  role: 'Dash-through melee',
  modelKind: 'sword',
  asset: 'assets/blademaster-slime.glb',
  accent: '#537bb6',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.42,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Long blade and scarf establish the speed-focused Sword branch; dash-through and delayed cut remain production-runtime work.',
};

export default definition;
