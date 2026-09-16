import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'greatsword',
  order: 25,
  name: 'Greatsword Slime',
  classification: 'Sword / Fusion Form',
  role: 'Frontline area cleave',
  modelKind: 'greatsword',
  asset: 'assets/greatsword-slime.glb',
  accent: '#ffd36c',
  inspectionFacingYawDegrees: 90,
  equipmentAnchor: 'WeaponAnchor',
  weaponTipName: 'Sword_Tip',
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  signatureLabel: 'Half-turn Cleave',
  implementationStatus: 'implemented',
  notes: 'Same slime body scale as Sword. The oversized blade drives a fast, nearly horizontal half-turn sweep rather than a slow full spin.',
};

export default definition;
