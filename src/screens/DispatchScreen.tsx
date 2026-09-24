import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameController, useGameState } from '../app/GameProvider';
import { useManagedTimeouts } from '../app/useManagedTimeouts';
import type { DispatchReturnCue } from '../application/presentation-events';
import { selectDispatchScreen, selectGlobalHud } from '../application/selectors/ui-selectors';
import { DispatchHomeIcon, DispatchLandmarkIcon } from '../components/DispatchLandmarkIcon';
import { DispatchMapStage, type DispatchTraveler } from '../components/DispatchMapStage';
import { dispatchRoutePresentation } from '../game/dispatch-presentation';
import { getSlimePresentation } from '../game/slimes';
import type { DispatchContractId, SlimeInstanceId } from '../domain';
import styles from './DispatchScreen.module.css';

const DISPATCH_DEPARTURE_CEREMONY_MS = 1_200;

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
  const [notice, setNotice] = useState<string | null>(null);
  const [departure, setDeparture] = useState<Readonly<{ contractId: DispatchContractId; key: number; label: string }> | null>(null);
  const [returnCue, setReturnCue] = useState<Readonly<{ key: number; label: string; reward: string }> | null>(null);
  const departureSerial = useRef(0);
  const departureLockRef = useRef(false);
  const returnSerial = useRef(0);
  const activeReturnCueId = useRef<string | null>(null);
  const { schedule } = useManagedTimeouts();

  const contract = view.contracts.find((item) => item.id === selectedContract) ?? view.contracts[0]!;

  useEffect(() => {
    if (contract.status === 'running') {
      setSelectedSlime(null);
      return;
    }
    setSelectedSlime((current) => {
      if (current !== null && contract.eligibleSlimes.some((slime) => slime.id === current)) return current;
      return contract.eligibleSlimes[0]?.id ?? null;
    });
  }, [contract.id, contract.status, contract.eligibleSlimes]);

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
      reward: contractView.rewardLabel,
    });
    schedule(() => {
      setReturnCue((current) => current?.key === key ? null : current);
      activeReturnCueId.current = null;
      onReturnCuePresented(pendingReturnCue.id);
    }, 1280);
  }, [onReturnCuePresented, pendingReturnCue, schedule, state.gameData.roster.slimes, view.contracts]);

  const activeCount = view.contracts.filter((item) => item.status === 'running').length;
  const selectedPower = contract.eligibleSlimes.find((slime) => slime.id === selectedSlime)?.power ?? 0;
  const selectedDeparture = departure?.contractId === contract.id;
  const canSend = selectedSlime !== null
    && selectedPower >= contract.requiredPower
    && contract.status !== 'running'
    && departure === null;

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
        <div className={styles.stats}><span>G {validationMode ? '∞' : hud.gold}</span><strong>{activeCount} / 3</strong></div>
      </header>

      <div className={`${styles.map} ${departure !== null ? styles.mapDeparting : ''}`}>
        <DispatchMapStage travelers={travelers} />
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
            <span>帰還</span><strong>{returnCue.label}</strong><small>{returnCue.reward} を獲得</small>
          </div>
        )}

        {view.contracts.map((item) => {
          const meta = dispatchRoutePresentation[item.id];
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.node} ${selectedContract === item.id ? styles.selected : ''} ${item.status === 'running' ? styles.running : ''}`}
              style={{ left: `${meta.x}%`, top: `${meta.y}%` }}
              aria-pressed={selectedContract === item.id}
              disabled={departure !== null}
              onClick={() => setSelectedContract(item.id)}
            >
              <span className={styles.nodeMarker}><DispatchLandmarkIcon kind={meta.landmark} /></span>
              <span className={styles.nodeCopy}>
                <strong>{item.name}</strong>
                <small>{item.status === 'running' ? formatDuration(item.remainingSec) : item.rewardLabel}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.console}>
        <div className={styles.consoleHead}>
          <div><span>{dispatchRoutePresentation[contract.id].subtitle}</span><strong>{contract.name}</strong></div>
          <div className={styles.reward}><span>報酬</span><strong>{contract.rewardLabel}</strong></div>
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
            <div className={styles.mission}>
              <span><small>時間</small><strong>{formatDuration(contract.durationSec)}</strong></span>
              <span><small>必要戦力</small><strong>{contract.requiredPower}</strong></span>
              <span><small>状態</small><strong>{contract.eligibleSlimes.length > 0 ? '出発可能' : '人員不足'}</strong></span>
            </div>

            {contract.eligibleSlimes.length > 0 ? (
              <div className={styles.crew}>
                {contract.eligibleSlimes.map((slime) => (
                  <button
                    key={slime.id}
                    type="button"
                    className={selectedSlime === slime.id ? styles.selected : ''}
                    aria-pressed={selectedSlime === slime.id}
                    disabled={departure !== null}
                    onClick={() => setSelectedSlime(slime.id)}
                  >
                    <img src={`${import.meta.env.BASE_URL}${slime.icon}`} alt="" />
                    <span><strong>{slime.name}</strong><small>戦力 {Math.floor(slime.power)}</small></span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <span>控えのスライムが必要です。戦闘編成から1匹外すと派遣できます。</span>
                <button type="button" onClick={onOpenCampFormation}>キャンプで編成を変更</button>
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
              <strong>{departure !== null ? '出発中…' : '出発させる'}</strong>
            </button>
          </>
        )}
      </div>

      {notice !== null && <button className={styles.toast} type="button" onClick={() => setNotice(null)}>{notice}</button>}
    </section>
  );
}

function RunningDispatch({ contract, state }: { contract: ReturnType<typeof selectDispatchScreen>['contracts'][number]; state: ReturnType<typeof useGameState> }) {
  const slime = contract.slimeId === null ? null : state.gameData.roster.slimes[contract.slimeId];
  const presentation = slime === undefined || slime === null ? null : getSlimePresentation(slime);
  const progress = contract.durationSec <= 0 ? 0 : Math.max(0, Math.min(1, 1 - contract.remainingSec / contract.durationSec));
  return (
    <div className={styles.runningPanel}>
      <div className={styles.runningSlime}>
        {presentation !== null && <img src={`${import.meta.env.BASE_URL}${presentation.icon}`} alt="" />}
        <span><strong>{presentation?.name ?? 'スライム'}</strong><small>任務遂行中</small></span>
      </div>
      <div className={styles.runningTime}><span>帰還まで</span><strong>{formatDuration(contract.remainingSec)}</strong></div>
      <div className={styles.runningTrack}><i style={{ transform: `scaleX(${progress})` }} /></div>
      <small>帰還時に報酬は自動で受け取ります。</small>
    </div>
  );
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