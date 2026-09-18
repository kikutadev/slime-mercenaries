import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'blademaster',
  order: 210,
  name: 'Blademaster Slime',
  classification: 'Tier 3 / Sword',
  role: 'Dash-through melee',
  modelKind: 'sword',
  asset: 'assets/blademaster-slime.glb',
  accent: '#537bb6',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.42,
  equipmentAnchor: 'WeaponAnchor',
  weaponTipName: 'WeaponTip',
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production iaijutsu signature: near-invisible pass-through, behind-target stillness and delayed oversized cut.',
};

export default definition;
