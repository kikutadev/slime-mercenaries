import type { DispatchContractId } from '../domain';

export type DispatchRoutePresentation = Readonly<{
  subtitle: string;
  landmark: 'road' | 'forest' | 'quarry';
  /**
   * World-space route authored to match the visible road mesh.
   * Keeping the traveler on these points prevents the 3D world and UI animation from drifting apart.
   */
  waypoints: readonly (readonly [number, number, number])[];
  /** World-space point above the landmark used to anchor the accessible DOM destination control. */
  labelAnchor: readonly [number, number, number];
}>;

export const dispatchRoutePresentation: Readonly<Record<DispatchContractId, DispatchRoutePresentation>> = {
  roadEscort: {
    subtitle: '街道の護衛',
    landmark: 'road',
    waypoints: [
      [0, 0.26, 0.45],
      [-1.35, 0.26, -0.40],
      [-2.85, 0.26, -1.45],
    ],
    labelAnchor: [-2.85, 1.16, -1.45],
  },
  forestExploration: {
    subtitle: '森の探索',
    landmark: 'forest',
    waypoints: [
      [0, 0.26, 0.45],
      [1.25, 0.26, -0.70],
      [2.75, 0.26, -2.15],
    ],
    labelAnchor: [2.75, 1.42, -2.15],
  },
  materialGathering: {
    subtitle: '素材採集',
    landmark: 'quarry',
    waypoints: [
      [0, 0.26, 0.45],
      [1.15, 0.26, 1.20],
      [2.35, 0.26, 2.25],
    ],
    labelAnchor: [2.35, 0.98, 2.25],
  },
};
