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
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. The finished round shield keeps the face visible and points toward the combat front; shield-bash/body-block motion is not published until production runtime owns it.',
};

export default definition;
