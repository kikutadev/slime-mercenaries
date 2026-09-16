import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'wand',
  order: 120,
  name: 'Wand Slime',
  classification: 'Tier 1 / Wand',
  role: 'Basic magic ranged',
  modelKind: 'wand',
  asset: 'assets/wand-slime.glb',
  accent: '#a688e8',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.05,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Crooked crystal wand and bent cap establish the magic branch; casting motion and SpellOrigin VFX stay hidden until the production runtime implements them.',
};

export default definition;
