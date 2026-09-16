import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'dagger',
  order: 130,
  name: 'Dagger Slime',
  classification: 'Tier 1 / Dagger',
  role: 'Fast melee skirmisher',
  modelKind: 'dagger',
  asset: 'assets/dagger-slime.glb',
  accent: '#6f62a7',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.0,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. A broad short dagger and low open-face cowl identify the skirmisher branch; hop-in stab and recoil are withheld until production combat motion is integrated.',
};

export default definition;
