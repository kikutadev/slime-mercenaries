import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'gun',
  order: 140,
  name: 'Gun Slime',
  classification: 'Tier 1 / Gun',
  role: 'Ranged firearm attacker',
  modelKind: 'gun',
  asset: 'assets/gun-slime.glb',
  accent: '#b98755',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.22,
  equipmentAnchor: 'GunAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production Gun Shot: short aim, crisp recoil, muzzle flash and Bullet from the authored ProjectileOrigin.',
};

export default definition;
