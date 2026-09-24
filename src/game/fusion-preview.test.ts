import { describe, expect, it } from 'vitest';
import { fusionStepDefinitions, type SlimeProgress } from '../domain';
import {
  getFusionCeremonyDurationSec,
  getFusionPreviewAttackDurationSec,
  getFusionPreviewAttackStartSec,
  getFusionPreviewPose,
} from './fusion-preview';
import { getSlimePresentation } from './slimes';

function resultPresentation(step: (typeof fusionStepDefinitions)[keyof typeof fusionStepDefinitions][number]) {
  const slime: SlimeProgress = {
    id: `preview.${step.id}`,
    serial: 0,
    typeId: step.slimeId,
    level: Math.max(40, step.minLevel),
    jobTier: step.resultJobTier,
    fusionRank: step.toRank,
    fusionFormId: step.resultFusionFormId,
    mutationId: null,
    assignment: 'reserve',
  };
  return getSlimePresentation(slime);
}

describe('Fusion combat-motion preview', () => {
  it('covers every released Fusion result with finite real-combat poses', () => {
    const steps = Object.values(fusionStepDefinitions).flat();
    expect(steps).toHaveLength(24);

    for (const step of steps) {
      const presentation = resultPresentation(step);
      const attackDuration = getFusionPreviewAttackDurationSec(presentation);
      const ceremonyDuration = getFusionCeremonyDurationSec(presentation);

      expect(Number.isFinite(attackDuration), step.id).toBe(true);
      expect(attackDuration, step.id).toBeGreaterThan(0.4);
      expect(ceremonyDuration, step.id).toBeGreaterThan(
        getFusionPreviewAttackStartSec() + attackDuration,
      );
      expect(ceremonyDuration, step.id).toBeLessThanOrEqual(3.1);

      for (const u of [0, 0.2, 0.5, 0.8, 1]) {
        const pose = getFusionPreviewPose(presentation, u);
        const values = [
          pose.deformation.squash,
          pose.deformation.stretch,
          pose.deformation.lean,
          pose.deformation.wobble,
          pose.deformation.jump,
          pose.equipment.angle,
          pose.equipment.lift,
          pose.equipment.sweep,
          pose.bodyOffset,
          pose.lateralOffset,
          pose.rootYawOffset,
          pose.bodyAlpha,
        ];
        expect(values.every(Number.isFinite), `${step.id} @ ${u}`).toBe(true);
      }
    }
  });

  it('keeps Tier-3 signatures visibly longer than the ordinary family previews they replace', () => {
    const byId = new Map(
      Object.values(fusionStepDefinitions)
        .flat()
        .map((step) => [step.id, resultPresentation(step)] as const),
    );

    expect(getFusionPreviewAttackDurationSec(byId.get('fusion.gun.03-engineer')!))
      .toBeGreaterThan(getFusionPreviewAttackDurationSec(byId.get('fusion.gun.02-gunner')!));
    expect(getFusionPreviewAttackDurationSec(byId.get('fusion.wand.03-archmage')!))
      .toBeGreaterThan(getFusionPreviewAttackDurationSec(byId.get('fusion.wand.02-mage')!));
    expect(getFusionPreviewAttackDurationSec(byId.get('fusion.shield.03-fortress')!))
      .toBeGreaterThan(getFusionPreviewAttackDurationSec(byId.get('fusion.shield.02-guardian')!));
  });

  it('uses the authored equipment anchor from each result presentation', () => {
    const tier3 = Object.values(fusionStepDefinitions)
      .flat()
      .filter((step) => step.resultJobTier === 3)
      .map(resultPresentation);

    expect(tier3.find((item) => item.form === 'fortress')?.battle.equipmentAnchorName)
      .toBe('FortressShieldAnchor');
    expect(tier3.find((item) => item.form === 'frost-mage')?.battle.equipmentAnchorName)
      .toBe('FrostStaffAnchor');
    expect(tier3.find((item) => item.form === 'engineer')?.battle.equipmentAnchorName)
      .toBe('EngineerWrenchAnchor');
  });
});
