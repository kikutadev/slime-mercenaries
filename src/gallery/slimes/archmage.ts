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
  equipmentAnchor: 'WandAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production grand-spell signature: rune convergence, giant ritual circle, meteor descent and screen-dominant impact.',
};

export default definition;
