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
        return [notice(event, 'ウェーブ突破', randomDropLabel(event) ?? '報酬を獲得', 'reward', 10, 'combat-reward')];
      case 'stageCleared': {
        const stageNumber = numberPayload(event, 'stageNumber') ?? '';
        const farming = booleanPayload(event, 'farming') === true;
        return [notice(
          event,
          farming ? `ステージ ${stageNumber} 周回完了` : `ステージ ${stageNumber} 突破`,
          farming ? '素材を回収して再編成を続けます' : '次の戦場へ進みます',
          farming ? 'reward' : 'milestone',
          farming ? 28 : 45,
          'stage-progress',
        )];
      }
      case 'bossDefeated':
        return [notice(event, 'ボス撃破', '大きな報酬を獲得', 'milestone', 65, 'boss-state')];
      case 'partyDefeated':
        return [{
          ...notice(event, '敗北 · 撤退', 'ひとつ前のステージで戦力を立て直します', 'warning', 72, 'frontier-state'),
          presentationPreemption: 'discard-current' as const,
        }];
      case 'stageRetreated':
        return [notice(
          event,
          `ステージ ${numberPayload(event, 'farmStageNumber') ?? ''} へ撤退`,
          '報酬を稼ぎながら自動で再挑戦します',
          'system',
          34,
          'frontier-state',
        )];
      case 'frontierRetryStarted':
        return [{
          ...notice(event, '最前線へ再出撃', `ステージ ${numberPayload(event, 'stageNumber') ?? ''} に再挑戦`, 'milestone', 58, 'frontier-state'),
          presentationPreemption: 'resume-current' as const,
        }];
      case 'slimeJobDiscovered': {
        const jobId = stringPayload(event, 'jobId') as JobSlimeId | null;
        const name = jobId === null ? '新しいスライム' : jobCreationDefinitions[jobId]?.displayName ?? '新しいスライム';
        return [{
          ...notice(event, `新発見 · ${name}`, '新しい職業を発見しました', 'milestone', 90),
          presentationPreemption: 'resume-current' as const,
        }];
      }
      case 'slimeFusionCoreCreated': {
        const jobId = stringPayload(event, 'jobId') as JobSlimeId | null;
        const name = jobId === null ? 'スライム' : jobCreationDefinitions[jobId]?.displayName ?? 'スライム';
        return [notice(event, `${name}の核`, '同じ職業を再生成し、合成素材へ変換', 'reward', 30, `fusion-core:${jobId ?? 'unknown'}`)];
      }
      case 'slimeFused':
        return [{
          ...notice(event, '合成完了', '新しい戦闘挙動を解放しました', 'milestone', 85),
          presentationPreemption: 'resume-current' as const,
        }];
      case 'slimePromoted':
        return [{
          ...notice(event, '昇格完了', '職業ランクが上昇しました', 'milestone', 85),
          presentationPreemption: 'resume-current' as const,
        }];
      case 'dispatchCompleted':
        return [notice(event, '派遣帰還', '派遣報酬は自動で反映済みです', 'reward', 42, 'dispatch-return')];
      case 'weaponEquipped':
        return [notice(event, '武器を装備', '次の戦闘から装備を反映', 'system', 22, 'weapon-equipped')];
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

function booleanPayload(event: DomainEvent, key: string): boolean | null {
  const value = event.payload?.[key];
  return typeof value === 'boolean' ? value : null;
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
  frontierStageReached: number | null;
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
  let frontierStageReached: number | null = null;

  for (const event of events) {
    if (event.type === 'stageCleared') {
      stageClearCount += 1;
      const nextStage = numberPayload(event, 'nextStageNumber');
      if (nextStage !== null) furthestStage = Math.max(furthestStage, nextStage);
    } else if (event.type === 'partyDefeated') {
      const stageNumber = numberPayload(event, 'stageNumber');
      if (stageNumber !== null) frontierStageReached = Math.max(frontierStageReached ?? 0, stageNumber);
    } else if (event.type === 'frontierBreakthroughDeferred') {
      const stageNumber = numberPayload(event, 'frontierStageNumber');
      if (stageNumber !== null) frontierStageReached = Math.max(frontierStageReached ?? 0, stageNumber);
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
    frontierStageReached,
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
