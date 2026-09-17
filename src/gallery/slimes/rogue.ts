import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'rogue',
  order: 190,
  name: 'Rogue Slime',
  classification: 'Tier 2 / Dagger',
  role: 'Mobile DPS',
  modelKind: 'dagger',
  asset: 'assets/rogue-slime.glb',
  accent: '#52477c',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.16,
  equipmentAnchor: 'WeaponAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production Rogue Twin Strike: primary and OffhandAnchor alternate across a fast two-hit sidestep combo.',
};

export default definition;
