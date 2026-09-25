import { useCallback, useState } from 'react';
import { useGameState } from '../app/GameProvider';
import type { DispatchReturnCue } from '../application/presentation-events';
import { selectDispatchScreen, selectGlobalHud } from '../application/selectors/ui-selectors';
import { DispatchHomeIcon, DispatchLandmarkIcon } from '../components/DispatchLandmarkIcon';
import { DispatchMapStage, type DispatchMapAnchorPositions } from '../components/DispatchMapStage';
import { dispatchRoutePresentation } from '../game/dispatch-presentation';
import styles from './DispatchScreen.module.css';
import { dispatchSendButtonLabel, formatDispatchDuration } from './dispatch/dispatch-view';
import { DispatchRewardBadge, RunningDispatch } from './dispatch/DispatchPresentation';
import { useDispatchInteraction } from './dispatch/useDispatchInteraction';


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
  const view = selectDispatchScreen(state);
  const {
    controller,
    selectedContract,
    setSelectedContract,
    selectedSlime,
    setSelectedSlime,
    notice,
    setNotice,
    departure,
    returnCue,
    contract,
    selectedCandidate,
    selectedDeparture,
    canSend,
    travelers,
    startSelectedDispatch,
  } = useDispatchInteraction({
    state,
    view,
    pendingReturnCue,
    onReturnCuePresented,
  });
  const validationMode = controller.validationMode;
  const hud = selectGlobalHud(state);
  const [mapAnchors, setMapAnchors] = useState<DispatchMapAnchorPositions | null>(null);

  const handleAnchorPositionsChange = useCallback((positions: DispatchMapAnchorPositions) => {
    setMapAnchors(positions);
  }, []);

  const activeCount = view.contracts.filter((item) => item.status === 'running').length;

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
                    ? formatDispatchDuration(item.remainingSec)
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
          <DispatchRewardBadge contract={contract} />
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
          <RunningDispatch contract={contract} roster={state.gameData.roster.slimes} />
        ) : (
          <>
            <div className={styles.missionSummary}>
              <span>約 {formatDispatchDuration(contract.durationSec)}</span>
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
              onClick={startSelectedDispatch}
            >
              <strong>{departure !== null ? '出発中…' : dispatchSendButtonLabel(selectedCandidate)}</strong>
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
