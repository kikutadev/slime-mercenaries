import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'fortress',
  order: 240,
  name: 'Fortress Slime',
  classification: 'Tier 3 / Shield',
  role: 'Pure tank',
  modelKind: 'shield',
  asset: 'assets/fortress-slime.glb',
  accent: '#8b8174',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.46,
  equipmentAnchor: 'FortressShieldAnchor',
  weaponTipName: 'FortressShieldAnchor',
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production fortress signature: deep brace, pavise plant, ground wave and persistent fortify lock.',
};

export default definition;
