import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'paladin',
  order: 230,
  name: 'Paladin Slime',
  classification: 'Tier 3 / Shield',
  role: 'Sustain tank',
  modelKind: 'shield',
  asset: 'assets/paladin-slime.glb',
  accent: '#d8c77c',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.34,
  equipmentAnchor: 'PaladinShieldAnchor',
  weaponTipName: 'PaladinShieldAnchor',
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production holy signature: white-gold shield consecration, heavy sacred strike, then sanctuary barrier.',
};

export default definition;
