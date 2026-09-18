import type { DispatchContractId } from '../domain';

export type DispatchRoutePresentation = Readonly<{
  x: number;
  y: number;
  subtitle: string;
  landmark: 'road' | 'forest' | 'quarry';
  start: readonly [number, number, number];
  end: readonly [number, number, number];
}>;

export const dispatchRoutePresentation: Readonly<Record<DispatchContractId, DispatchRoutePresentation>> = {
  roadEscort: {
    x: 24,
    y: 35,
    subtitle: '街道の護衛',
    landmark: 'road',
    start: [0, 0.26, 0.45],
    end: [-2.85, 0.26, -1.45],
  },
  forestExploration: {
    x: 73,
    y: 28,
    subtitle: '森の探索',
    landmark: 'forest',
    start: [0, 0.26, 0.45],
    end: [2.75, 0.26, -2.15],
  },
  materialGathering: {
    x: 63,
    y: 68,
    subtitle: '素材採集',
    landmark: 'quarry',
    start: [0, 0.26, 0.45],
    end: [2.35, 0.26, 2.25],
  },
};
