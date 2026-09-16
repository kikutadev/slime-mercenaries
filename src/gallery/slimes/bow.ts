import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'bow',
  order: 100,
  name: 'Bow Slime',
  classification: 'Tier 1 / Bow',
  role: 'Safe physical range',
  modelKind: 'bow',
  asset: 'assets/archer-slime.glb',
  accent: '#7bcf83',
  inspectionFacingYawDegrees: -20,
  equipmentAnchor: 'BowAnchor',
  availableMotions: ['idle', 'move', 'attack', 'hit', 'defeat', 'celebrate'],
  implementationStatus: 'implemented',
  notes: 'The body stretches backward under tension, then snaps forward on release. Arrow origin must remain visually attached to the bow.',
};

export default definition;
