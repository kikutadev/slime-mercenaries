import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'engineer',
  order: 300,
  name: 'Engineer Slime',
  classification: 'Tier 3 / Gun',
  role: 'Summoner / support ranged',
  modelKind: 'gun',
  asset: 'assets/engineer-slime.glb',
  accent: '#a06938',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.5,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Goggles, wrench and independent turret establish Engineer; deployable turret behavior remains production-runtime work.',
};

export default definition;
