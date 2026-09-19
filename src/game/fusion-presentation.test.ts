import { describe, expect, it } from 'vitest';
import { fusionStepDefinitions } from '../domain/definitions';
import { getFusionIngredientPresentation, getFusionStepPresentation } from './fusion-presentation';

describe('fusion presentation metadata', () => {
  it('covers every released Fusion step and recipe token', () => {
    for (const steps of Object.values(fusionStepDefinitions)) {
      for (const step of steps) {
        expect(() => getFusionStepPresentation(step.id)).not.toThrow();
        for (const requirement of step.recipe) {
          expect(() => getFusionIngredientPresentation(requirement.tokenId)).not.toThrow();
        }
      }
    }
  });

  it('uses the full two-slime ceremony only for first major form changes', () => {
    expect(getFusionStepPresentation('fusion.sword.01-greatsword').ceremony).toBe('major-form');
    expect(getFusionStepPresentation('fusion.sword.02-heavy-impact').ceremony).toBe('enhancement');
    expect(getFusionStepPresentation('fusion.sword.03-whirlwind').ceremony).toBe('major-behavior');
  });
});
