import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'gunner',
  order: 200,
  name: 'Gunner Slime',
  classification: 'Tier 2 / Gun',
  role: 'Sustained ranged',
  modelKind: 'gun',
  asset: 'assets/gunner-slime.glb',
  accent: '#9a6b3c',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.34,
  equipmentAnchor: 'GunAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production Gunner Burst: three authored muzzle releases with individual recoil and shared bullet/muzzle-flash VFX.',
};

export default definition;
