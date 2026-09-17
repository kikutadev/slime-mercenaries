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
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Feather crest, crystal electric tips and energized bow rails establish the wave-clear branch; fan/chained-arrow motion remains production-runtime work.',
};

export default definition;
