import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'sniper',
  order: 245,
  name: 'Sniper Slime',
  classification: 'Tier 3 / Bow',
  role: 'Boss killer / piercing shot',
  modelKind: 'bow',
  asset: 'assets/sniper-slime.glb',
  accent: '#8c6a38',
  inspectionFacingYawDegrees: -20,
  inspectionSideDistance: 1.58,
  equipmentAnchor: 'SniperBowAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production precision signature: still aim, sight lock, instantaneous piercing-line release and heavy recoil.',
};

export default definition;
