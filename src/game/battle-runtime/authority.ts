export const RESULT_HOLD_SECONDS = 1.85;
export const AUTHORITATIVE_DEFEAT_LEAD_SECONDS = 2.2;
export const AUTHORITATIVE_VICTORY_LEAD_SECONDS = 1.0;

export interface PresentationDamageInput {
  hp: number;
  damage: number;
  authoritativeResult: 'victory' | 'defeat' | null;
  isLastLivingUnit: boolean;
}

/**
 * Runtime HP exists only to stage animation. When Domain has authored an
 * encounter result, the last visual unit stays alive until that boundary.
 */
export function resolvePresentationHpAfterDamage(input: PresentationDamageInput): number {
  const nextHp = Math.max(0, input.hp - input.damage);
  if (input.authoritativeResult !== null && input.isLastLivingUnit && nextHp <= 0) return 1;
  return nextHp;
}
export function authoritativePresentationTriggerSec(
  result: 'victory' | 'defeat',
  authoritativeResultDelaySec: number,
): number {
  const safeDelay = Math.max(0, authoritativeResultDelaySec);
  const leadSeconds = result === 'defeat'
    ? AUTHORITATIVE_DEFEAT_LEAD_SECONDS
    : AUTHORITATIVE_VICTORY_LEAD_SECONDS;
  return Math.max(0, safeDelay - leadSeconds);
}

export function readableAuthoritativeResultSec(
  preferredTriggerSec: number,
  combatEnteredAtSec: number,
  minimumCombatPreviewSec: number,
): number {
  return Math.max(
    Math.max(0, preferredTriggerSec),
    Math.max(0, combatEnteredAtSec) + Math.max(0, minimumCombatPreviewSec),
  );
}
