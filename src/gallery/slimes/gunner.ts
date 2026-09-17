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
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Protective goggles and a compact repeating carbine establish the sustained-fire branch; the 3–5 shot burst and recoil cadence remain production-runtime work.',
};

export default definition;
