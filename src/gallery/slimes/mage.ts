import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'mage',
  order: 180,
  name: 'Mage Slime',
  classification: 'Tier 2 / Wand',
  role: 'Magic AoE',
  modelKind: 'wand',
  asset: 'assets/mage-slime.glb',
  accent: '#725ac7',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.22,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Taller hat, stronger wand and independent floating rune establish the Mage branch; splash casting and rune motion remain production-runtime work.',
};

export default definition;
