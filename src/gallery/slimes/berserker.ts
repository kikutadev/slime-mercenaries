import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'berserker',
  order: 220,
  name: 'Berserker Slime',
  classification: 'Tier 3 / Sword',
  role: 'Heavy melee',
  modelKind: 'sword',
  asset: 'assets/berserker-slime.glb',
  accent: '#9f5545',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.5,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Chipped heavy blade and wild brow accents establish the Berserker branch; rage-speed heavy sweep remains production-runtime work.',
};

export default definition;
