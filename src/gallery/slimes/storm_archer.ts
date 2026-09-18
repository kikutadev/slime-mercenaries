import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'storm-archer',
  order: 248,
  name: 'Storm Archer Slime',
  classification: 'Tier 3 / Bow',
  role: 'Wave clear / electric volley',
  modelKind: 'bow',
  asset: 'assets/storm-archer-slime.glb',
  accent: '#63c8d7',
  inspectionFacingYawDegrees: -20,
  inspectionSideDistance: 1.48,
  equipmentAnchor: 'StormBowAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production storm signature: charged jump into three explicit electric fan trajectories with chain-lightning aftermath.',
};

export default definition;
