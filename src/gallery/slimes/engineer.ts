import type { SlimeGalleryDefinition } from '../types';

const definition: SlimeGalleryDefinition = {
  id: 'engineer',
  order: 300,
  name: 'Engineer Slime',
  classification: 'Tier 3 / Gun',
  role: 'Summoner / support ranged',
  modelKind: 'gun',
  asset: 'assets/engineer-slime.glb',
  accent: '#a06938',
  inspectionFacingYawDegrees: 90,
  inspectionSideDistance: 1.5,
  equipmentAnchor: 'EngineerWrenchAnchor',
  weaponTipName: null,
  availableMotions: ['idle', 'move', 'attack', 'defeat'],
  implementationStatus: 'implemented',
  notes: 'Production engineer signature: loose-part gathering, jelly-assisted assembly, real model turret deployment, activation and short burst.',
};

export default definition;
