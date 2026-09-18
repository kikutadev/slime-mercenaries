import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'frost-mage',
  order: 260,
  name: 'Frost Mage Slime',
  classification: 'Tier 3 / Wand',
  role: 'Control caster',
  modelKind: 'wand',
  asset: 'assets/frost-mage-slime.glb',
  accent: '#77b8d7',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.38,
  equipmentAnchor: 'FrostStaffAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production frost signature: staff plant, rigid cold stillness, ice lance, freeze field and crystal eruption.',
};

export default definition;
