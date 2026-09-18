import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'ninja',
  order: 270,
  name: 'Ninja Slime',
  classification: 'Tier 3 / Dagger',
  role: 'Burst skirmisher',
  modelKind: 'dagger',
  asset: 'assets/ninja-slime.glb',
  accent: '#45455d',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.28,
  equipmentAnchor: 'WeaponAnchor',
  weaponTipName: 'WeaponTip',
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production ninja signature: smoke vanish, repeated afterimage passes, reappearance and clustered delayed slash lines.',
};

export default definition;
