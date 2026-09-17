import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'dagger',
  order: 130,
  name: 'Dagger Slime',
  classification: 'Tier 1 / Dagger',
  role: 'Fast melee skirmisher',
  modelKind: 'dagger',
  asset: 'assets/dagger-slime.glb',
  accent: '#6f62a7',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.0,
  equipmentAnchor: 'WeaponAnchor',
  weaponTipName: 'WeaponTip',
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production Dagger Stab: quick hop-in thrust and elastic hop-back with no combat-anchor drift.',
};

export default definition;
