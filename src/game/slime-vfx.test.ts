import { describe, expect, it } from 'vitest';
import { createGreatswordSpinArc, createSwordSlashArc } from './slime-vfx';

describe('melee slash silhouette', () => {
  it('uses an open greatsword sweep, not a full-screen enclosing ring', () => {
    const greatsword = createGreatswordSpinArc();
    const sword = createSwordSlashArc();
    expect(greatsword.geometry.parameters.arc).toBeGreaterThan(Math.PI);
    expect(greatsword.geometry.parameters.arc).toBeLessThan(Math.PI * 1.5);
    expect(greatsword.geometry.parameters.radius).toBeLessThan(0.45);
    expect(greatsword.geometry.parameters.radius).toBeGreaterThan(sword.geometry.parameters.radius);
    greatsword.geometry.dispose();
    greatsword.material.dispose();
    sword.geometry.dispose();
    sword.material.dispose();
  });
});
