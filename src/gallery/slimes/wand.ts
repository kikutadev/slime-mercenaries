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
  equipmentAnchor: 'WandAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production Wand Cast: jelly charge, wand flick, then Magic Orb from the authored SpellOrigin.',
};

export default definition;
