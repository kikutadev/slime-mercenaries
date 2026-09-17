import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'shield',
  order: 110,
  name: 'Shield Slime',
  classification: 'Tier 1 / Shield',
  role: 'Frontline defender',
  modelKind: 'shield',
  asset: 'assets/shield-slime.glb',
  accent: '#d9bd72',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.05,
  equipmentAnchor: 'ShieldAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production Shield Bash: protected wind-up, compact body-check, then stable return to combat anchor.',
};

export default definition;
