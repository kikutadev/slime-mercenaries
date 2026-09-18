import { describe, expect, it } from 'vitest';
import { dispatchContractDefinitions } from '../domain';
import { dispatchRoutePresentation } from './dispatch-presentation';

describe('dispatch presentation', () => {
  it('authors one visible route for every released dispatch contract', () => {
    const released = Object.keys(dispatchContractDefinitions).sort();
    const presented = Object.keys(dispatchRoutePresentation).sort();

    expect(presented).toEqual(released);
  });

  it('gives every route distinct start and destination positions', () => {
    for (const route of Object.values(dispatchRoutePresentation)) {
      expect(route.start).not.toEqual(route.end);
      expect(route.start).toHaveLength(3);
      expect(route.end).toHaveLength(3);
    }
  });
});
