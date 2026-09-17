import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'archmage',
  order: 250,
  name: 'Archmage Slime',
  classification: 'Tier 3 / Wand',
  role: 'Burst AoE caster',
  modelKind: 'wand',
  asset: 'assets/archmage-slime.glb',
  accent: '#6954c5',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.4,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Tall star hat and orbiting-mote vocabulary establish Archmage; meteor/rune burst remains production-runtime work.',
};

export default definition;
