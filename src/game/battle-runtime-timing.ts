import { BOSS_APPROACH_SECONDS, NORMAL_APPROACH_SECONDS } from './battle-approach';

export const MIN_VISIBLE_COMBAT_SECONDS = 0.7;

const AUTHORITATIVE_DEFEAT_LEAD_SECONDS = 2.2;
const AUTHORITATIVE_VICTORY_LEAD_SECONDS = 1.0;

/**
 * Authoritative idle progress may complete a wave before the visible battle has even
 * finished its entrance. Clamp result presentation so every rendered encounter gets
 * an approach plus a readable combat beat before victory/defeat is forced.
 */
export function authoritativeResultTriggerDelay(
  result: 'victory' | 'defeat',
  authoritativeDelaySec: number,
  bossEncounter: boolean,
): number {
  const approachSeconds = bossEncounter ? BOSS_APPROACH_SECONDS : NORMAL_APPROACH_SECONDS;
  const leadSeconds = result === 'defeat'
    ? AUTHORITATIVE_DEFEAT_LEAD_SECONDS
    : AUTHORITATIVE_VICTORY_LEAD_SECONDS;
  return Math.max(
    approachSeconds + MIN_VISIBLE_COMBAT_SECONDS,
    authoritativeDelaySec - leadSeconds,
  );
}
