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

  it('uses form-change ceremonies for form Fusion and signature ceremonies for Tier-3 branches', () => {
    expect(getFusionStepPresentation('fusion.sword.01-greatsword').ceremony).toBe('major-form');
    expect(getFusionStepPresentation('fusion.sword.02-fighter').ceremony).toBe('major-form');
    expect(getFusionStepPresentation('fusion.sword.03-blademaster').ceremony).toBe('major-behavior');
    expect(getFusionStepPresentation('fusion.sword.03-berserker').ceremony).toBe('major-behavior');
  });
});
