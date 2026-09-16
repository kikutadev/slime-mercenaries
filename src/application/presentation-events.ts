import type { DomainEvent, PresentationQueueItem } from 'idle-game-kit';
import { jobCreationDefinitions, type JobSlimeId } from '../domain';

export type PresentationTone = 'reward' | 'milestone' | 'warning' | 'system';

export type SlimePresentationNotice = PresentationQueueItem & Readonly<{
  id: string;
  title: string;
  body?: string;
  tone: PresentationTone;
}>;

/**
 * Convert durable DomainEvents into transient UI notices. Presentation policy lives here rather
 * than inside Domain commands or individual screens.
 */
export function toPresentationNotices(events: readonly DomainEvent[]): readonly SlimePresentationNotice[] {
  return events.flatMap((event) => {
    switch (event.type) {
      case 'combatWaveCleared':
        return [notice(event, 'Wave Clear', randomDropLabel(event) ?? '報酬を獲得', 'reward', 10, 'combat-reward')];
      case 'stageCleared':
        return [notice(event, `Stage ${numberPayload(event, 'stageNumber') ?? ''} Clear`, '次の戦場へ進みます', 'milestone', 45, 'stage-progress')];
      case 'bossDefeated':
        return [notice(event, 'Boss Defeated', '大きな報酬を獲得', 'milestone', 65, 'boss-state')];
      case 'bossBlocked':
        return [{
          ...notice(event, 'Bossで進行停止', 'Slimesで強化して再挑戦できます', 'warning', 70, 'boss-state'),
          presentationPreemption: 'discard-current' as const,
        }];
      case 'slimeJobDiscovered': {
        const jobId = stringPayload(event, 'jobId') as JobSlimeId | null;
        const name = jobId === null ? 'New Slime' : jobCreationDefinitions[jobId]?.displayName ?? 'New Slime';
        return [{
          ...notice(event, `NEW · ${name}`, '新しい職業を発見しました', 'milestone', 90),
          presentationPreemption: 'resume-current' as const,
        }];
      }
      case 'slimeFusionCoreCreated': {
        const jobId = stringPayload(event, 'jobId') as JobSlimeId | null;
        const name = jobId === null ? 'Slime' : jobCreationDefinitions[jobId]?.displayName ?? 'Slime';
        return [notice(event, `${name} Core`, '同じ職業を再生成し、Fusion素材へ変換', 'reward', 30, `fusion-core:${jobId ?? 'unknown'}`)];
      }
      case 'slimeFused':
        return [{
          ...notice(event, 'Fusion Complete', '新しい戦闘挙動を解放しました', 'milestone', 85),
          presentationPreemption: 'resume-current' as const,
        }];
      case 'slimePromoted':
        return [{
          ...notice(event, 'Promotion Complete', 'Tierが上昇しました', 'milestone', 85),
          presentationPreemption: 'resume-current' as const,
        }];
      case 'dispatchCompleted':
        return [notice(event, 'Dispatch Returned', '派遣報酬は自動で反映済みです', 'reward', 42, 'dispatch-return')];
      case 'weaponEquipped':
        return [notice(event, 'Weapon Equipped', '次の戦闘から装備を反映', 'system', 22, 'weapon-equipped')];
      default:
        return [];
    }
  });
}

export function presentationNoticeDurationMs(notice: SlimePresentationNotice): number {
  return notice.presentationPriority >= 80 ? 2_600 : notice.presentationPriority >= 40 ? 2_100 : 1_500;
}

function notice(
  event: DomainEvent,
  title: string,
  body: string | undefined,
  tone: PresentationTone,
  presentationPriority: number,
  presentationCoalescingKey?: string,
): SlimePresentationNotice {
  return {
    id: event.id,
    title,
    ...(body === undefined ? {} : { body }),
    tone,
    presentationPriority,
    ...(presentationCoalescingKey === undefined ? {} : { presentationCoalescingKey }),
  };
}

function stringPayload(event: DomainEvent, key: string): string | null {
  const value = event.payload?.[key];
  return typeof value === 'string' ? value : null;
}

function numberPayload(event: DomainEvent, key: string): number | null {
  const value = event.payload?.[key];
  return typeof value === 'number' ? value : null;
}

function randomDropLabel(event: DomainEvent): string | null {
  const drops = event.payload?.randomDrops;
  if (!Array.isArray(drops) || drops.length === 0) return null;
  const count = drops.reduce((sum, item) => {
    if (typeof item !== 'object' || item === null || !('count' in item) || typeof item.count !== 'number') return sum;
    return sum + item.count;
  }, 0);
  return count > 0 ? `素材 +${count}` : null;
}


export type OfflineReturnView = Readonly<{
  elapsedLabel: string;
  furthestStage: number;
  stageClearCount: number;
  bossDefeatedCount: number;
  dispatchCompletedCount: number;
  materialDropCount: number;
}>;

/** Aggregate potentially many offline DomainEvents into one return sheet. */
export function buildOfflineReturnView(
  offlineSec: number,
  events: readonly DomainEvent[],
  currentStage: number,
): OfflineReturnView {
  let stageClearCount = 0;
  let bossDefeatedCount = 0;
  let dispatchCompletedCount = 0;
  let materialDropCount = 0;
  let furthestStage = currentStage;

  for (const event of events) {
    if (event.type === 'stageCleared') {
      stageClearCount += 1;
      const nextStage = numberPayload(event, 'nextStageNumber');
      if (nextStage !== null) furthestStage = Math.max(furthestStage, nextStage);
    } else if (event.type === 'bossDefeated') {
      bossDefeatedCount += 1;
    } else if (event.type === 'dispatchCompleted') {
      dispatchCompletedCount += 1;
    } else if (event.type === 'combatWaveCleared') {
      const drops = event.payload?.randomDrops;
      if (!Array.isArray(drops)) continue;
      for (const item of drops) {
        if (typeof item !== 'object' || item === null || !('count' in item) || typeof item.count !== 'number') continue;
        materialDropCount += item.count;
      }
    }
  }

  return {
    elapsedLabel: formatElapsed(offlineSec),
    furthestStage,
    stageClearCount,
    bossDefeatedCount,
    dispatchCompletedCount,
    materialDropCount,
  };
}

function formatElapsed(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  if (hours > 0) return `${hours}時間 ${minutes}分`;
  if (minutes > 0) return `${minutes}分 ${rest}秒`;
  return `${rest}秒`;
}
