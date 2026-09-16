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
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. The oversized flintlock, dark bore and readable lock/grip mass define the branch; recoil, muzzle flash and ProjectileOrigin behavior are withheld until production runtime integration.',
};

export default definition;
