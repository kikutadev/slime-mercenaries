import type { DomainEvent, PresentationQueueItem } from 'idle-game-kit';
import { OFFLINE_PROGRESS_AGGREGATED_EVENT_TYPE, WORLD_AREA_IDS, ids, jobCreationDefinitions, resolveAreaDefinition, type JobSlimeId, type SlimeMutationId } from '../domain';
import type { BattleRewardCue, BattleRewardItem, BattleRewardTarget } from '../game/battle-reward';

export type PresentationTone = 'reward' | 'milestone' | 'warning' | 'system';

const MUTATION_DISPLAY_NAMES: Readonly<Record<SlimeMutationId, string>> = {
  king: 'キングスライム',
  golden: 'ゴールデンスライム',
  dragon: 'ドラゴンスライム',
  prism: 'プリズムスライム',
};


export type SlimePresentationNotice = PresentationQueueItem & Readonly<{
  id: string;
  title: string;
  body?: string;
  tone: PresentationTone;
}>;


export type RoutedPresentationEvents = Readonly<{
  notices: readonly SlimePresentationNotice[];
  battleRewardCue: BattleRewardCue | null;
}>;

/**
 * Route one authoritative event batch to exactly one routine reward surface.
 * Battle keeps its compact receipt; non-battle screens keep the global notice.
 * Milestones/warnings remain global on every screen.
 */
export function routePresentationEvents(
  events: readonly DomainEvent[],
  battleVisible: boolean,
): RoutedPresentationEvents {
  const notices = toPresentationNotices(events);
  return {
    notices: battleVisible
      ? notices.filter((notice) => notice.presentationCoalescingKey !== 'combat-reward')
      : notices,
    battleRewardCue: battleVisible ? toBattleRewardCue(events) : null,
  };
}


const BATTLE_REWARD_LABELS: Readonly<Record<string, string>> = {
  [ids.currency.gold]: 'G',
  [ids.token.slimeGel]: 'スライムジェル',
  [ids.token.lifeWater]: '生命の水',
  [ids.token.trainingSword]: '訓練剣',
  [ids.token.trainingBow]: '訓練弓',
  [ids.token.greatswordBlank]: '大剣素材',
  [ids.token.reinforcedBow]: '強化弓素材',
  [ids.token.hardeningGel]: '硬化ジェル',
  [ids.token.temperedSteel]: '鍛鋼',
  [ids.token.forgeKey]: '鍛造鍵',
  [ids.token.mimicHeart]: 'ミミックハート',
  [ids.token.swordWeaponMaterial]: '剣素材',
  [ids.token.bowWeaponMaterial]: '弓素材',
};

export function toBattleRewardCue(events: readonly DomainEvent[]): BattleRewardCue | null {
  const aggregated = new Map<string, BattleRewardItem>();
  const contributingIds: string[] = [];
  let target: BattleRewardTarget | null = null;

  for (const event of events) {
    if (event.type === 'combatWaveCleared') {
      const stageNumber = numberPayload(event, 'stageNumber');
      const waveNumber = numberPayload(event, 'waveNumber');
      if (stageNumber !== null && waveNumber !== null) {
        target = {
          kind: 'wave',
          stageNumber,
          waveIndex: Math.max(0, Math.floor(waveNumber) - 1),
        };
      }
    } else if (event.type === 'bossDefeated') {
      const stageNumber = numberPayload(event, 'stageNumber');
      if (stageNumber !== null) target = { kind: 'boss', stageNumber };
    }
    if (event.type !== 'combatWaveCleared'
      && event.type !== 'bossDefeated'
      && event.type !== 'stageCleared'
      && event.type !== OFFLINE_PROGRESS_AGGREGATED_EVENT_TYPE) continue;
    const rewards = event.payload?.grantedRewards;
    if (!Array.isArray(rewards)) continue;
    let contributed = false;

    for (const reward of rewards) {
      if (typeof reward !== 'object' || reward === null) continue;
      if (!('kind' in reward) || !('id' in reward) || !('amount' in reward)) continue;
      if ((reward.kind !== 'currency'
          && reward.kind !== 'token'
          && reward.kind !== 'mutation-fragment'
          && reward.kind !== 'mutation-catalyst')
        || typeof reward.id !== 'string'
        || typeof reward.amount !== 'number'
        || !Number.isFinite(reward.amount)
        || reward.amount <= 0) continue;

      const kind = reward.kind === 'currency' && reward.id === ids.currency.gold ? 'gold' : 'material';
      const rewardId = reward.kind === 'mutation-fragment' || reward.kind === 'mutation-catalyst'
        ? `${reward.kind}:${reward.id}`
        : reward.id;
      const mutationName = MUTATION_DISPLAY_NAMES[reward.id as SlimeMutationId] ?? 'レア変異';
      const label = reward.kind === 'mutation-fragment'
        ? `${mutationName}の欠片`
        : reward.kind === 'mutation-catalyst'
          ? `${mutationName}の核`
          : BATTLE_REWARD_LABELS[reward.id] ?? (kind === 'gold' ? 'G' : '素材');
      const key = `${kind}:${rewardId}`;
      const previous = aggregated.get(key);
      aggregated.set(key, {
        kind,
        id: rewardId,
        label,
        amount: (previous?.amount ?? 0) + reward.amount,
      });
      contributed = true;
    }

    if (contributed) contributingIds.push(event.id);
  }

  const items = [...aggregated.values()];
  if (items.length === 0) return null;
  return {
    id: `battle-reward:${contributingIds.join('|')}`,
    importance: events.some((event) => event.type === 'bossDefeated') ? 'boss' : 'normal',
    target,
    items,
  };
}

/**
 * Convert durable DomainEvents into transient UI notices. Presentation policy lives here rather
 * than inside Domain commands or individual screens.
 */
export function toPresentationNotices(events: readonly DomainEvent[]): readonly SlimePresentationNotice[] {
  return events.flatMap((event) => {
    switch (event.type) {
      case 'combatWaveCleared':
        return [notice(event, 'ウェーブ突破', eventRewardLabel(event) ?? randomDropLabel(event) ?? '報酬を獲得', 'reward', 10, 'combat-reward')];
      case 'stageCleared': {
        const stageNumber = numberPayload(event, 'stageNumber') ?? '';
        const farming = booleanPayload(event, 'farming') === true;
        const rewardLabel = eventRewardLabel(event);
        return [notice(
          event,
          farming ? 'ステージ ' + stageNumber + ' 周回完了' : 'ステージ ' + stageNumber + ' 突破',
          farming ? (rewardLabel ?? '素材を回収して再編成を続けます') : (rewardLabel ?? '次の戦場へ進みます'),
          farming ? 'reward' : 'milestone',
          farming ? 28 : 45,
          'stage-progress',
        )];
      }
      case 'bossDefeated':
        return [notice(event, 'ボス撃破', '大きな報酬を獲得', 'milestone', 65, 'boss-state')];
      case 'areaUnlocked':
        return [{
          ...notice(event, '新エリア解放', '次のエリアへ進みます', 'milestone', 88, 'area-progress'),
          presentationPreemption: 'resume-current' as const,
        }];
      case 'areaStageEntered':
        return [notice(
          event,
          'ステージ ' + (numberPayload(event, 'stageNumber') ?? '') + ' へ移動',
          '解放済みの戦場へ戻りました',
          'system',
          20,
          'area-navigation',
        )];
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
      case 'slimeMutated': {
        const mutationId = stringPayload(event, 'mutationId') as SlimeMutationId | null;
        const mutationName = mutationId === null ? 'レア変異' : MUTATION_DISPLAY_NAMES[mutationId] ?? 'レア変異';
        return [{
          ...notice(event, '変異完了 · ' + mutationName, '特殊な形態を獲得しました', 'milestone', 92, 'slime-mutation'),
          presentationPreemption: 'resume-current' as const,
        }];
      }
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

function eventRewardLabel(event: DomainEvent): string | null {
  const cue = toBattleRewardCue([event]);
  if (cue === null) return null;
  return cue.items
    .map((item) => item.label + ' +' + Math.floor(item.amount).toLocaleString('ja-JP'))
    .join(' · ');
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


const BATTLE_ACTIVITY_EVENT_TYPES = new Set([
  'combatWaveCleared',
  'stageCleared',
  'bossDefeated',
  'partyDefeated',
  'stageRetreated',
  'frontierRetryStarted',
  'frontierBreakthroughDeferred',
  'areaUnlocked',
]);

export function isBattleActivityEvent(event: DomainEvent): boolean {
  return BATTLE_ACTIVITY_EVENT_TYPES.has(event.type);
}

export type BattleActivityCursor = Readonly<{
  areaId: string;
  stageNumber: number;
  waveIndex: number;
}>;

export type WorldStagePosition = Readonly<{
  areaId: string;
  stageNumber: number;
}>;

export type BattleActivityReport = Readonly<{
  elapsedSec: number;
  start: BattleActivityCursor;
  current: BattleActivityCursor;
  furthest: WorldStagePosition;
  waveClearCount: number;
  stageClearCount: number;
  farmClearCount: number;
  bossDefeatedCount: number;
  defeatCount: number;
  retryCount: number;
  rewards: readonly BattleRewardItem[];
}>;

export function buildBattleActivityReport(args: Readonly<{
  events: readonly DomainEvent[];
  elapsedSec: number;
  from: BattleActivityCursor;
  to: BattleActivityCursor;
}>): BattleActivityReport {
  let furthest = maxWorldStagePosition(toWorldStagePosition(args.from), toWorldStagePosition(args.to));
  let waveClearCount = 0;
  let stageClearCount = 0;
  let farmClearCount = 0;
  let bossDefeatedCount = 0;
  let defeatCount = 0;
  let retryCount = 0;

  for (const event of args.events) {
    for (const candidate of worldStagePositionsFromEvent(event)) {
      furthest = maxWorldStagePosition(furthest, candidate);
    }

    switch (event.type) {
      case 'combatWaveCleared':
        waveClearCount += 1;
        break;
      case 'stageCleared':
        if (booleanPayload(event, 'farming') === true) farmClearCount += 1;
        else stageClearCount += 1;
        break;
      case 'bossDefeated':
        bossDefeatedCount += 1;
        break;
      case 'partyDefeated':
        defeatCount += 1;
        break;
      case 'frontierRetryStarted':
        retryCount += 1;
        break;
      default:
        break;
    }
  }

  return {
    elapsedSec: Math.max(0, args.elapsedSec),
    start: args.from,
    current: args.to,
    furthest,
    waveClearCount,
    stageClearCount,
    farmClearCount,
    bossDefeatedCount,
    defeatCount,
    retryCount,
    rewards: toBattleRewardCue(args.events)?.items ?? [],
  };
}

export function mergeBattleActivityReports(
  previous: BattleActivityReport | null,
  next: BattleActivityReport,
): BattleActivityReport {
  if (previous === null) return next;

  const rewards = new Map<string, BattleRewardItem>();
  for (const item of [...previous.rewards, ...next.rewards]) {
    const key = item.kind + ':' + item.id;
    const current = rewards.get(key);
    rewards.set(key, {
      ...item,
      amount: (current?.amount ?? 0) + item.amount,
    });
  }

  return {
    elapsedSec: previous.elapsedSec + next.elapsedSec,
    start: previous.start,
    current: next.current,
    furthest: maxWorldStagePosition(previous.furthest, next.furthest),
    waveClearCount: previous.waveClearCount + next.waveClearCount,
    stageClearCount: previous.stageClearCount + next.stageClearCount,
    farmClearCount: previous.farmClearCount + next.farmClearCount,
    bossDefeatedCount: previous.bossDefeatedCount + next.bossDefeatedCount,
    defeatCount: previous.defeatCount + next.defeatCount,
    retryCount: previous.retryCount + next.retryCount,
    rewards: [...rewards.values()],
  };
}

export function battleActivityReportIsMeaningful(report: BattleActivityReport): boolean {
  return report.elapsedSec >= 5
    || report.start.areaId !== report.current.areaId
    || report.start.stageNumber !== report.current.stageNumber
    || report.start.waveIndex !== report.current.waveIndex
    || report.waveClearCount > 0
    || report.stageClearCount > 0
    || report.farmClearCount > 0
    || report.bossDefeatedCount > 0
    || report.defeatCount > 0
    || report.retryCount > 0
    || report.rewards.length > 0;
}

export function battleActivityProgressLabel(report: BattleActivityReport): string {
  const currentPosition = toWorldStagePosition(report.current);
  if (compareWorldStagePositions(currentPosition, report.furthest) < 0) {
    return '最前線 ' + formatWorldStagePosition(report.furthest)
      + ' · 現在 ' + formatWorldStagePosition(currentPosition);
  }

  const startPosition = toWorldStagePosition(report.start);
  if (compareWorldStagePositions(startPosition, currentPosition) !== 0) {
    if (startPosition.areaId === currentPosition.areaId) {
      return areaDisplayName(currentPosition.areaId) + ' Stage ' + startPosition.stageNumber
        + ' → ' + currentPosition.stageNumber;
    }
    return formatWorldStagePosition(startPosition) + ' → ' + formatWorldStagePosition(currentPosition);
  }

  const startWave = report.start.waveIndex + 1;
  const currentWave = report.current.waveIndex + 1;
  if (startWave !== currentWave) {
    return formatWorldStagePosition(currentPosition)
      + ' · ウェーブ ' + startWave + ' → ' + currentWave;
  }
  return formatWorldStagePosition(currentPosition) + ' · ウェーブ ' + currentWave;
}

export function formatBattleActivityElapsed(seconds: number): string {
  return formatElapsed(seconds);
}

export function formatWorldStagePosition(position: WorldStagePosition): string {
  return areaDisplayName(position.areaId) + ' Stage ' + position.stageNumber;
}

export type OfflineReturnView = Readonly<{
  elapsedLabel: string;
  furthest: WorldStagePosition;
  stageClearCount: number;
  bossDefeatedCount: number;
  dispatchCompletedCount: number;
  materialDropCount: number;
  frontier: WorldStagePosition | null;
  battleRewards: readonly BattleRewardItem[];
}>;

/** Aggregate potentially many offline DomainEvents into one return sheet. */
export function buildOfflineReturnView(
  offlineSec: number,
  events: readonly DomainEvent[],
  current: WorldStagePosition,
): OfflineReturnView {
  let stageClearCount = 0;
  let bossDefeatedCount = 0;
  let dispatchCompletedCount = 0;
  let materialDropCount = 0;
  let furthest = current;
  let frontier: WorldStagePosition | null = null;

  for (const event of events) {
    if (event.type === OFFLINE_PROGRESS_AGGREGATED_EVENT_TYPE) {
      stageClearCount += nonNegativeIntegerPayload(event, 'stageClearCount');
      bossDefeatedCount += nonNegativeIntegerPayload(event, 'bossDefeatedCount');
      dispatchCompletedCount += nonNegativeIntegerPayload(event, 'dispatchCompletedCount');
      materialDropCount += nonNegativeIntegerPayload(event, 'materialDropCount');

      const compactedFurthest = explicitWorldPositionFromEvent(event, 'furthestAreaId', 'furthestStageNumber');
      if (compactedFurthest !== null) furthest = maxWorldStagePosition(furthest, compactedFurthest);
      const compactedFrontier = explicitWorldPositionFromEvent(event, 'frontierAreaId', 'frontierStageNumber');
      if (compactedFrontier !== null) {
        frontier = frontier === null ? compactedFrontier : maxWorldStagePosition(frontier, compactedFrontier);
        furthest = maxWorldStagePosition(furthest, compactedFrontier);
      }
      continue;
    }

    if (event.type === 'stageCleared') {
      stageClearCount += 1;
      for (const candidate of worldStagePositionsFromEvent(event)) {
        furthest = maxWorldStagePosition(furthest, candidate);
      }
    } else if (event.type === 'partyDefeated') {
      const candidate = eventStagePosition(event, 'stageNumber');
      if (candidate !== null) {
        frontier = frontier === null ? candidate : maxWorldStagePosition(frontier, candidate);
        furthest = maxWorldStagePosition(furthest, candidate);
      }
    } else if (event.type === 'frontierBreakthroughDeferred') {
      const candidate = eventStagePosition(event, 'frontierStageNumber');
      if (candidate !== null) {
        frontier = frontier === null ? candidate : maxWorldStagePosition(frontier, candidate);
        furthest = maxWorldStagePosition(furthest, candidate);
      }
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
    furthest,
    stageClearCount,
    bossDefeatedCount,
    dispatchCompletedCount,
    materialDropCount,
    frontier,
    battleRewards: toBattleRewardCue(events)?.items ?? [],
  };
}

function toWorldStagePosition(cursor: Pick<BattleActivityCursor, 'areaId' | 'stageNumber'>): WorldStagePosition {
  return { areaId: cursor.areaId, stageNumber: cursor.stageNumber };
}

/**
 * Project event payload coordinates into world positions. This keeps report ordering correct when
 * a normal Area transition resets the local Stage number from 5 back to 1.
 */
function worldStagePositionsFromEvent(event: DomainEvent): readonly WorldStagePosition[] {
  const positions: WorldStagePosition[] = [];
  const areaId = stringPayload(event, 'areaId');
  if (areaId !== null) {
    for (const key of ['stageNumber', 'frontierStageNumber', 'failedStageNumber', 'farmStageNumber'] as const) {
      const stageNumber = numberPayload(event, key);
      if (stageNumber !== null) positions.push({ areaId, stageNumber });
    }
  }

  const nextStageNumber = numberPayload(event, 'nextStageNumber');
  if (nextStageNumber !== null) {
    const nextAreaId = stringPayload(event, 'nextAreaId') ?? areaId;
    if (nextAreaId !== null) positions.push({ areaId: nextAreaId, stageNumber: nextStageNumber });
  }
  return positions;
}

function nonNegativeIntegerPayload(event: DomainEvent, key: string): number {
  const value = numberPayload(event, key);
  return value === null ? 0 : Math.max(0, Math.floor(value));
}

function explicitWorldPositionFromEvent(
  event: DomainEvent,
  areaKey: string,
  stageKey: string,
): WorldStagePosition | null {
  const areaId = stringPayload(event, areaKey);
  const stageNumber = numberPayload(event, stageKey);
  return areaId === null || stageNumber === null ? null : { areaId, stageNumber };
}

function eventStagePosition(event: DomainEvent, stageKey: string): WorldStagePosition | null {
  const areaId = stringPayload(event, 'areaId');
  const stageNumber = numberPayload(event, stageKey);
  return areaId === null || stageNumber === null ? null : { areaId, stageNumber };
}

function maxWorldStagePosition(left: WorldStagePosition, right: WorldStagePosition): WorldStagePosition {
  return compareWorldStagePositions(left, right) >= 0 ? left : right;
}

function compareWorldStagePositions(left: WorldStagePosition, right: WorldStagePosition): number {
  const leftOrdinal = worldStageOrdinal(left);
  const rightOrdinal = worldStageOrdinal(right);
  if (leftOrdinal !== null && rightOrdinal !== null) return leftOrdinal - rightOrdinal;
  if (left.areaId === right.areaId) return left.stageNumber - right.stageNumber;
  // Unknown authored content should not crash presentation. Keep ordering deterministic.
  return left.areaId.localeCompare(right.areaId) || left.stageNumber - right.stageNumber;
}

function worldStageOrdinal(position: WorldStagePosition): number | null {
  let offset = 0;
  for (const areaId of WORLD_AREA_IDS) {
    const area = resolveAreaDefinition(areaId);
    if (area === undefined) continue;
    if (areaId === position.areaId) return offset + position.stageNumber;
    offset += area.stages.length;
  }
  return null;
}

function areaDisplayName(areaId: string): string {
  return resolveAreaDefinition(areaId)?.displayName ?? areaId;
}

function formatElapsed(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  if (hours > 0) return hours + '時間 ' + minutes + '分';
  if (minutes > 0) return minutes + '分 ' + rest + '秒';
  return rest + '秒';
}
