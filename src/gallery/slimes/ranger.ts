import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'ranger',
  order: 170,
  name: 'Ranger Slime',
  classification: 'Tier 2 / Bow',
  role: 'Mobile ranged',
  modelKind: 'bow',
  asset: 'assets/ranger-slime.glb',
  accent: '#4e9e62',
  inspectionFacingYawDegrees: -20,
  inspectionSideDistance: 1.34,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Recurved bow, green hood and rear quiver establish the Ranger branch; the connected double-shot and evasive sidestep are not faked in the gallery.',
};

export default definition;
