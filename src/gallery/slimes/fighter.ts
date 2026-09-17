import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'fighter',
  order: 150,
  name: 'Fighter Slime',
  classification: 'Tier 2 / Sword',
  role: 'Melee bruiser',
  modelKind: 'sword',
  asset: 'assets/fighter-slime.glb',
  accent: '#c7654e',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.18,
  equipmentAnchor: 'WeaponAnchor',
  weaponTipName: 'WeaponTip',
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production two-hit combo: forward slash into a faster body-assisted return cut using the same shared motion as battle runtime.',
};

export default definition;
