import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'sword',
  order: 20,
  name: 'Sword Slime',
  classification: 'Tier 1 / Sword',
  role: 'Reliable frontline damage',
  modelKind: 'sword',
  asset: 'assets/sword-slime.glb',
  accent: '#f28b69',
  equipmentAnchor: 'WeaponAnchor',
  availableMotions: ['idle', 'move', 'attack', 'hit', 'defeat', 'celebrate'],
  implementationStatus: 'implemented',
  notes: 'Forward squash into a crisp single slash. The blade should read clearly in the gameplay 3/4 camera.',
};

export default definition;
