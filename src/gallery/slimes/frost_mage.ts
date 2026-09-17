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
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Crystal crown and frost staff establish the control-caster branch; freeze field remains production-runtime work.',
};

export default definition;
