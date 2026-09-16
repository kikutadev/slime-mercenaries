import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'plain',
  order: 10,
  name: 'Plain Slime',
  classification: 'Root / Tier 0',
  role: 'Canonical reusable Base Slime',
  modelKind: 'plain',
  asset: 'assets/plain-slime.glb',
  accent: '#7dd6f5',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 0.78,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Canonical shared jelly body. The body-bump attack is intentionally withheld until the production combat behavior is implemented.',
};

export default definition;
