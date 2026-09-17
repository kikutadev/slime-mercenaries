import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'berserker',
  order: 220,
  name: 'Berserker Slime',
  classification: 'Tier 3 / Sword',
  role: 'Heavy melee',
  modelKind: 'sword',
  asset: 'assets/berserker-slime.glb',
  accent: '#9f5545',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.5,
  equipmentAnchor: 'WeaponAnchor',
  weaponTipName: 'WeaponTip',
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production heavy signature: deep coil, explosive release, impact shards/ring, strong hit-stop and camera impulse.',
};

export default definition;
