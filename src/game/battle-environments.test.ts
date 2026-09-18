import { describe, expect, it } from 'vitest';
import { getBattleEnvironmentPresentation } from './battle-environments';

describe('battle environment presentation', () => {
  it('resolves the authored Clover Road environment', () => {
    const view = getBattleEnvironmentPresentation('area.clover-road');

    expect(view.asset).toBe('assets/environments/clover-road-battlefield.glb');
    expect(view.cameraPosition).toHaveLength(3);
    expect(view.cameraLookAt).toHaveLength(3);
    expect(view.fogFar).toBeGreaterThan(view.fogNear);
  });

  it('fails fast when a playable area has no authored environment', () => {
    expect(() => getBattleEnvironmentPresentation('area.unreleased')).toThrow(
      'No battle environment presentation authored for area.unreleased',
    );
  });
});
