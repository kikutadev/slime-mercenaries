import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'ranger',
  order: 170,
  name: 'Ranger Slime',
  classification: 'Tier 2 / Bow',
  role: 'Mobile ranged',
  modelKind: 'bow',
  asset: 'assets/ranger-slime.glb',
  accent: '#4e9e62',
  inspectionFacingYawDegrees: -20,
  inspectionSideDistance: 1.34,
  equipmentAnchor: 'RangerBowAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production double-shot: two connected releases with a restrained lateral step, using the same shared motion and arrow timing as battle runtime.',
};

export default definition;
