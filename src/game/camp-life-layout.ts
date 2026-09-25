import * as THREE from 'three';

export type CampLifeStationId =
  | 'home-left'
  | 'home-right'
  | 'home-back-left'
  | 'home-back-right'
  | 'training'
  | 'rest'
  | 'chat-left'
  | 'chat-right';

export interface CampLifeStation {
  id: CampLifeStationId;
  position: THREE.Vector3;
  facingTarget: THREE.Vector3;
}

/**
 * Authored points intentionally sit inside the phone-safe part of the Camp diorama.
 * They relate to the existing environment props rather than forming a generic navmesh.
 */
export const CAMP_LIFE_STATIONS: Readonly<Record<CampLifeStationId, CampLifeStation>> = {
  'home-left': {
    id: 'home-left',
    position: new THREE.Vector3(-1.92, 0.02, -1.30),
    facingTarget: new THREE.Vector3(0, 0.45, 1.8),
  },
  'home-right': {
    id: 'home-right',
    position: new THREE.Vector3(2.08, 0.02, -2.05),
    facingTarget: new THREE.Vector3(0, 0.45, 1.8),
  },
  'home-back-left': {
    id: 'home-back-left',
    position: new THREE.Vector3(-0.72, 0.02, -2.52),
    facingTarget: new THREE.Vector3(0, 0.45, 0.55),
  },
  'home-back-right': {
    id: 'home-back-right',
    position: new THREE.Vector3(0.72, 0.02, -2.50),
    facingTarget: new THREE.Vector3(0, 0.45, 0.55),
  },
  training: {
    id: 'training',
    // The actual dummy lives at x=-2.65. This spot keeps the resident visible on portrait screens.
    position: new THREE.Vector3(-1.98, 0.02, -1.02),
    facingTarget: new THREE.Vector3(-2.65, 0.88, -0.15),
  },
  rest: {
    id: 'rest',
    // In front of the tent rather than inside it so sleepy eyes remain readable.
    position: new THREE.Vector3(2.18, 0.02, -2.26),
    facingTarget: new THREE.Vector3(0.0, 0.48, 1.65),
  },
  'chat-left': {
    id: 'chat-left',
    position: new THREE.Vector3(-0.86, 0.02, -2.34),
    facingTarget: new THREE.Vector3(0.86, 0.45, -2.34),
  },
  'chat-right': {
    id: 'chat-right',
    position: new THREE.Vector3(0.86, 0.02, -2.34),
    facingTarget: new THREE.Vector3(-0.86, 0.45, -2.34),
  },
};

export const CAMP_LIFE_HOME_BY_SLOT = [
  CAMP_LIFE_STATIONS['home-left'],
  CAMP_LIFE_STATIONS['home-right'],
  CAMP_LIFE_STATIONS['home-back-left'],
  CAMP_LIFE_STATIONS['home-back-right'],
] as const;

export function campLifeHomeForSlot(slotIndex: number): CampLifeStation {
  return CAMP_LIFE_HOME_BY_SLOT[slotIndex] ?? CAMP_LIFE_HOME_BY_SLOT[CAMP_LIFE_HOME_BY_SLOT.length - 1]!;
}

export function yawToward(from: THREE.Vector3, target: THREE.Vector3): number {
  return Math.atan2(target.x - from.x, target.z - from.z);
}
