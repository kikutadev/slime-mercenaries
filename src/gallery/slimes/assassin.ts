import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'assassin',
  order: 280,
  name: 'Assassin Slime',
  classification: 'Tier 3 / Dagger',
  role: 'Execute DPS',
  modelKind: 'dagger',
  asset: 'assets/assassin-slime.glb',
  accent: '#382e45',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.32,
  equipmentAnchor: 'WeaponAnchor',
  weaponTipName: 'WeaponTip',
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production assassin signature: low stillness, instant behind-target relocation, cross hit-stop and delayed execution line.',
};

export default definition;
