import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'fighter',
  order: 150,
  name: 'Fighter Slime',
  classification: 'Tier 2 / Sword',
  role: 'Melee bruiser',
  modelKind: 'sword',
  asset: 'assets/fighter-slime.glb',
  accent: '#c7654e',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.18,
  equipmentAnchor: null,
  weaponTipName: null,
  availableMotions: ['idle'],
  implementationStatus: 'model',
  notes: 'Model review only. Broader sword and delayed headband tails establish the Tier-2 bruiser silhouette; the connected two-hit combo remains withheld until production combat motion is shared by game and gallery.',
};

export default definition;
