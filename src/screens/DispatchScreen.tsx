import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameController, useGameState } from '../app/GameProvider';
import { useManagedTimeouts } from '../app/useManagedTimeouts';
import type { DispatchReturnCue } from '../application/presentation-events';
import { selectDispatchScreen, selectGlobalHud } from '../application/selectors/ui-selectors';
import { DispatchHomeIcon, DispatchLandmarkIcon } from '../components/DispatchLandmarkIcon';
import {
  DispatchMapStage,
  type DispatchMapAnchorPositions,
  type DispatchTraveler,
} from '../components/DispatchMapStage';
import { dispatchRoutePresentation } from '../game/dispatch-presentation';
import { getSlimePresentation } from '../game/slimes';
import type { DispatchContractId, SlimeInstanceId } from '../domain';
import styles from './DispatchScreen.module.css';

const DISPATCH_DEPARTURE_CEREMONY_MS = 1_200;

type DispatchContractView = ReturnType<typeof selectDispatchScreen>['contracts'][number];

export function DispatchScreen({
  onOpenCampFormation,
  returnCue: pendingReturnCue,
  onReturnCuePresented,
}: {
  onOpenCampFormation: () => void;
  returnCue: DispatchReturnCue | null;
  onReturnCuePresented: (cueId: string) => void;
}) {
  const state = useGameState();
  const controller = useGameController();
  const view = selectDispatchScreen(state);
  const validationMode = controller.validationMode;
  const hud = selectGlobalHud(state);
  const [selectedContract, setSelectedContract] = useState<DispatchContractId>('roadEscort');
  const [selectedSlime, setSelectedSlime] = useState<SlimeInstanceId | null>(null);
  const [mapAnchors, setMapAnchors] = useState<DispatchMapAnchorPositions | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [departure, setDeparture] = useState<Readonly<{
    contractId: DispatchContractId;
    key: number;
    label: string;
  }> | null>(null);
  const [returnCue, setReturnCue] = useState<Readonly<{
    key: number;
    label: string;
    reward: string;
  }> | null>(null);
  const departureSerial = useRef(0);
  const departureLockRef = useRef(false);
  const returnSerial = useRef(0);
  const activeReturnCueId = useRef<string | null>(null);
  const { schedule } = useManagedTimeouts();

  const contract = view.contracts.find((item) => item.id === selectedContract) ?? view.contracts[0]!;
  const selectedCandidate = contract.candidates.find((slime) => slime.id === selectedSlime) ?? null;
  const selectedDeparture = departure?.contractId === contract.id;
  const canSend = selectedCandidate?.eligible === true
    && contract.status !== 'running'
    && departure === null;

  useEffect(() => {
    if (contract.status === 'running') {
      setSelectedSlime(null);
      return;
    }
    setSelectedSlime((current) => {
      if (current !== null && contract.candidates.some((slime) => slime.id === current)) return current;
      return contract.candidates.find((slime) => slime.eligible)?.id ?? contract.candidates[0]?.id ?? null;
    });
  }, [contract.id, contract.status, contract.candidates]);

  useEffect(() => {
    if (pendingReturnCue === null || activeReturnCueId.current === pendingReturnCue.id) return;
    const contractView = view.contracts.find((item) => item.id === pendingReturnCue.contractId);
    if (contractView === undefined) return;

    activeReturnCueId.current = pendingReturnCue.id;
    const returningSlime = pendingReturnCue.slimeId === null
      ? null
      : state.gameData.roster.slimes[pendingReturnCue.slimeId] ?? null;
    const key = ++returnSerial.current;

    setReturnCue({
      key,
      label: returningSlime === null
        ? contractView.name
        : `${getSlimePresentation(returningSlime).name}が帰還`,
      reward: `${contractView.reward.label} ×${contractView.reward.amount}`,
    });

    schedule(() => {
      setReturnCue((current) => current?.key === key ? null : current);
      activeReturnCueId.current = null;
      onReturnCuePresented(pendingReturnCue.id);
    }, 1_280);
  }, [
    onReturnCuePresented,
    pendingReturnCue,
    schedule,
    state.gameData.roster.slimes,
    view.contracts,
  ]);

  const handleAnchorPositionsChange = useCallback((positions: DispatchMapAnchorPositions) => {
    setMapAnchors(positions);
  }, []);

  const activeCount = view.contracts.filter((item) => item.status === 'running').length;
  const travelers = useMemo<readonly DispatchTraveler[]>(() => view.contracts.flatMap((item) => {
    if (item.status !== 'running' || item.slimeId === null || item.durationSec <= 0) return [];
    const slime = state.gameData.roster.slimes[item.slimeId];
    if (slime === undefined) return [];
    const presentation = getSlimePresentation(slime);
    return [{
      contractId: item.id,
      asset: presentation.asset,
      mutationId: presentation.mutationId,
      progress: Math.max(0, Math.min(1, 1 - item.remainingSec / item.durationSec)),
      ...(departure?.contractId === item.id ? { departureKey: departure.key } : {}),
    }];
  }), [departure, state.gameData.roster.slimes, view.contracts]);

  return (
    <section className={`screen screen--active ${styles.root}`} aria-label="派遣">
      <header className={styles.topbar}>
        <div><p className="eyebrow">遠征地図</p><h1>派遣</h1></div>
        <div className={styles.stats}>
          <span>G {validationMode ? '∞' : hud.gold}</span>
          <strong>{activeCount} / 3</strong>
        </div>
      </header>

      <div className={`${styles.map} ${departure !== null ? styles.mapDeparting : ''}`}>
        <DispatchMapStage
          travelers={travelers}
          onAnchorPositionsChange={handleAnchorPositionsChange}
        />
        <div className={styles.home}>
          <span><DispatchHomeIcon /></span>
          <small>キャンプ</small>
        </div>

        {departure !== null && (
          <div className={styles.departureCue} key={departure.key}>
            <span>出発</span><strong>{departure.label}</strong>
          </div>
        )}
        {returnCue !== null && (
          <div className={styles.returnCue} key={returnCue.key}>
            <span>帰還</span>
            <strong>{returnCue.label}</strong>
            <small>{returnCue.reward}</small>
          </div>
        )}

        {view.contracts.map((item) => {
          const anchor = mapAnchors?.[item.id];
          const meta = dispatchRoutePresentation[item.id];
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.node} ${selectedContract === item.id ? styles.selected : ''} ${item.status === 'running' ? styles.running : ''}`}
              style={anchor === undefined ? { opacity: 0 } : { left: `${anchor.x}%`, top: `${anchor.y}%` }}
              onClick={() => setSelectedContract(item.id)}
              aria-pressed={selectedContract === item.id}
              disabled={departure !== null}
            >
              <span className={styles.nodeMarker}><DispatchLandmarkIcon kind={meta.landmark} /></span>
              <span className={styles.nodeCopy}>
                <strong>{item.name}</strong>
                <small>
                  {item.status === 'running'
                    ? formatDuration(item.remainingSec)
                    : `${item.reward.label} ×${item.reward.amount}`}
                </small>
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.console}>
        <div className={styles.consoleHead}>
          <div className={styles.destination}>
            <span>{dispatchRoutePresentation[contract.id].subtitle}</span>
            <strong>{contract.name}</strong>
          </div>
          <RewardBadge contract={contract} />
        </div>

        {selectedDeparture ? (
          <div className={styles.departurePanel} aria-busy="true">
            <span>キャンプを出発</span>
            <strong>{contract.name}へ移動中</strong>
            <button className={styles.sendButton} type="button" aria-busy="true" disabled>
              <strong>出発中…</strong>
            </button>
          </div>
        ) : contract.status === 'running' ? (
          <RunningDispatch contract={contract} state={state} />
        ) : (
          <>
            <div className={styles.missionSummary}>
              <span>約 {formatDuration(contract.durationSec)}</span>
              <i aria-hidden="true" />
              <span>戦力 {contract.requiredPower} 以上</span>
            </div>

            {contract.candidates.length > 0 ? (
              <div className={styles.crew} aria-label="派遣するスライム">
                {contract.candidates.map((slime) => (
                  <button
                    key={slime.id}
                    type="button"
                    className={[
                      selectedSlime === slime.id ? styles.crewSelected : '',
                      slime.eligible ? '' : styles.crewUnderpowered,
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedSlime(slime.id)}
                    aria-pressed={selectedSlime === slime.id}
                    disabled={departure !== null}
                  >
                    <img src={`${import.meta.env.BASE_URL}${slime.icon}`} alt="" />
                    <span>
                      <strong>{slime.name}</strong>
                      <small>
                        戦力 {Math.floor(slime.power)}
                        {slime.eligible ? ' · 派遣可' : ` · あと ${Math.ceil(slime.powerGap)}`}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <span>控えのスライムが必要です。戦闘編成から1匹外すと派遣できます。</span>
                <button type="button" onClick={onOpenCampFormation}>
                  キャンプで編成を変更
                </button>
              </div>
            )}

            <button
              className={styles.sendButton}
              type="button"
              aria-busy={departure !== null}
              disabled={!canSend}
              onClick={() => {
                if (selectedSlime === null || departureLockRef.current) return;
                departureLockRef.current = true;
                const result = controller.startDispatch(contract.id, selectedSlime);
                if (!result.accepted) {
                  departureLockRef.current = false;
                  setNotice(rejectionLabel(result.reason));
                  return;
                }

                setNotice(null);
                const key = ++departureSerial.current;
                setDeparture({ contractId: contract.id, key, label: contract.name });
                schedule(() => {
                  departureLockRef.current = false;
                  setDeparture((current) => current?.key === key ? null : current);
                }, DISPATCH_DEPARTURE_CEREMONY_MS);
              }}
            >
              <strong>{departure !== null ? '出発中…' : sendButtonLabel(selectedCandidate)}</strong>
            </button>
          </>
        )}
      </div>

      {notice !== null && (
        <button className={styles.toast} type="button" onClick={() => setNotice(null)}>
          {notice}
        </button>
      )}
    </section>
  );
}

function RewardBadge({ contract }: { contract: DispatchContractView }) {
  return (
    <div className={styles.rewardBadge}>
      <RewardMark kind={contract.reward.kind} />
      <span>
        <small>持ち帰るもの</small>
        <strong>{contract.reward.label} ×{contract.reward.amount}</strong>
      </span>
    </div>
  );
}

function RewardMark({ kind }: { kind: DispatchContractView['reward']['kind'] }) {
  if (kind === 'gold') {
    return (
      <svg className={styles.rewardMark} viewBox="0 0 28 28" aria-hidden="true">
        <ellipse cx="14" cy="8" rx="8" ry="4" />
        <path d="M6 8v5c0 2.2 3.6 4 8 4s8-1.8 8-4V8M6 13v5c0 2.2 3.6 4 8 4s8-1.8 8-4v-5" />
      </svg>
    );
  }
  if (kind === 'forge-key') {
    return (
      <svg className={styles.rewardMark} viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="10" cy="10" r="5" />
        <path d="M13.5 13.5 23 23M18.5 18.5l2.5-2.5M21 21l2.5-2.5" />
      </svg>
    );
  }
  return (
    <svg className={styles.rewardMark} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 3 22 10 18 23H10L6 10Z" />
      <path d="m10 12 4-3 4 3-1.5 6h-5Z" />
    </svg>
  );
}

function RunningDispatch({
  contract,
  state,
}: {
  contract: DispatchContractView;
  state: ReturnType<typeof useGameState>;
}) {
  const slime = contract.slimeId === null ? null : state.gameData.roster.slimes[contract.slimeId];
  const presentation = slime === undefined || slime === null ? null : getSlimePresentation(slime);
  return (
    <div className={styles.runningPanel}>
      <div>
        <span className={styles.runningLabel}>{presentation?.name ?? 'スライム'}が移動中</span>
        <strong>{formatDuration(contract.remainingSec)}</strong>
        <small>帰還まで</small>
      </div>
      <div className={styles.runningReward}>
        <RewardMark kind={contract.reward.kind} />
        <span>{contract.reward.label} ×{contract.reward.amount}</span>
      </div>
    </div>
  );
}

function sendButtonLabel(candidate: DispatchContractView['candidates'][number] | null): string {
  if (candidate === null) return '派遣するスライムを選ぶ';
  if (!candidate.eligible) return `戦力があと ${Math.ceil(candidate.powerGap)} 必要`;
  return 'このスライムを派遣';
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function rejectionLabel(reason: string | undefined): string {
  switch (reason) {
    case 'not-reserve': return '控えのスライムだけ派遣できます';
    case 'insufficient-power': return '戦力が足りません';
    case 'contract-running': return 'この依頼はすでに進行中です';
    default: return reason === undefined ? '派遣できませんでした' : `派遣できません: ${reason}`;
  }
}
