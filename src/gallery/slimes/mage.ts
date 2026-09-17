import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'mage',
  order: 180,
  name: 'Mage Slime',
  classification: 'Tier 2 / Wand',
  role: 'Magic AoE',
  modelKind: 'wand',
  asset: 'assets/mage-slime.glb',
  accent: '#725ac7',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.22,
  equipmentAnchor: 'WandAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production Mage Cast: authored MageRuneAnchor charges and spins, then the shared magic orb resolves as a small AoE in BattleRuntime.',
};

export default definition;
