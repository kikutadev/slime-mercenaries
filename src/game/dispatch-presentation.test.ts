import { describe, expect, it } from 'vitest';
import { dispatchContractDefinitions } from '../domain';
import { dispatchRoutePresentation } from './dispatch-presentation';

describe('dispatch presentation', () => {
  it('authors one visible route for every released dispatch contract', () => {
    const released = Object.keys(dispatchContractDefinitions).sort();
    const presented = Object.keys(dispatchRoutePresentation).sort();

    expect(presented).toEqual(released);
  });

  it('authors a world-space path and landmark anchor for every route', () => {
    for (const route of Object.values(dispatchRoutePresentation)) {
      expect(route.waypoints.length).toBeGreaterThanOrEqual(2);
      expect(route.waypoints[0]).not.toEqual(route.waypoints.at(-1));
      expect(route.waypoints.every((point) => point.length === 3 && point[1] > 0)).toBe(true);
      expect(route.labelAnchor).toHaveLength(3);
    }
  });
});
