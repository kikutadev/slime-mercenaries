import { useEffect, useMemo, useState } from 'react';
import { useGameController, useGameState } from '../app/GameProvider';
import { selectDispatchScreen, selectGlobalHud } from '../application/selectors/ui-selectors';
import { DispatchHomeIcon, DispatchLandmarkIcon } from '../components/DispatchLandmarkIcon';
import { DispatchMapStage, type DispatchTraveler } from '../components/DispatchMapStage';
import { dispatchRoutePresentation } from '../game/dispatch-presentation';
import { getSlimePresentation } from '../game/slimes';
import type { DispatchContractId, SlimeInstanceId } from '../domain';

export function DispatchScreen() {
  const state = useGameState();
  const controller = useGameController();
  const view = selectDispatchScreen(state);
  const validationMode = controller.validationMode;
  const hud = selectGlobalHud(state);
  const [selectedContract, setSelectedContract] = useState<DispatchContractId>('roadEscort');
  const [selectedSlime, setSelectedSlime] = useState<SlimeInstanceId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const activeCount = view.contracts.filter((item) => item.status === 'running').length;
  const selectedPower = contract.eligibleSlimes.find((slime) => slime.id === selectedSlime)?.power ?? 0;
  const canSend = selectedSlime !== null && selectedPower >= contract.requiredPower && contract.status !== 'running';

  const travelers = useMemo<readonly DispatchTraveler[]>(() => view.contracts.flatMap((item) => {
    if (item.status !== 'running' || item.slimeId === null || item.durationSec <= 0) return [];
    const slime = state.gameData.roster.slimes[item.slimeId];
    if (slime === undefined) return [];
    const presentation = getSlimePresentation(slime);
    return [{
      contractId: item.id,
      asset: presentation.asset,
      progress: Math.max(0, Math.min(1, 1 - item.remainingSec / item.durationSec)),
    }];
  }), [state.gameData.roster.slimes, view.contracts]);

  return (
    <section className="screen screen--dispatch-world screen--active" aria-label="派遣">
      <header className="dispatch-world__topbar">
        <div><p className="eyebrow">遠征地図</p><h1>派遣</h1></div>
        <div className="dispatch-world__stats"><span>G {validationMode ? '∞' : hud.gold}</span><strong>{activeCount} / 3</strong></div>
      </header>

      <div className="dispatch-map">
        <DispatchMapStage travelers={travelers} />
        <div className="dispatch-map__home">
          <span><DispatchHomeIcon /></span>
          <small>キャンプ</small>
        </div>

        {view.contracts.map((item) => {
          const meta = dispatchRoutePresentation[item.id];
          return (
            <button
              key={item.id}
              type="button"
              className={`dispatch-map-node ${selectedContract === item.id ? 'is-selected' : ''} ${item.status === 'running' ? 'is-running' : ''}`}
              style={{ left: `${meta.x}%`, top: `${meta.y}%` }}
              onClick={() => setSelectedContract(item.id)}
            >
              <span className="dispatch-map-node__marker"><DispatchLandmarkIcon kind={meta.landmark} /></span>
              <span className="dispatch-map-node__copy">
                <strong>{item.name}</strong>
                <small>{item.status === 'running' ? formatDuration(item.remainingSec) : item.rewardLabel}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className={`dispatch-console ${contract.status === 'running' ? 'is-running' : ''}`}>
        <div className="dispatch-console__head">
          <div><span>{dispatchRoutePresentation[contract.id].subtitle}</span><strong>{contract.name}</strong></div>
          <div className="dispatch-console__reward"><span>報酬</span><strong>{contract.rewardLabel}</strong></div>
        </div>

        {contract.status === 'running' ? (
          <RunningDispatch contract={contract} state={state} />
        ) : (
          <>
            <div className="dispatch-console__mission">
              <span><small>時間</small><strong>{formatDuration(contract.durationSec)}</strong></span>
              <span><small>必要戦力</small><strong>{contract.requiredPower}</strong></span>
              <span><small>状態</small><strong>{contract.eligibleSlimes.length > 0 ? '出発可能' : '人員不足'}</strong></span>
            </div>

            {contract.eligibleSlimes.length > 0 ? (
              <div className="dispatch-crew-strip">
                {contract.eligibleSlimes.map((slime) => (
                  <button key={slime.id} type="button" className={selectedSlime === slime.id ? 'is-selected' : ''} onClick={() => setSelectedSlime(slime.id)}>
                    <img src={`${import.meta.env.BASE_URL}${slime.icon}`} alt="" />
                    <span><strong>{slime.name}</strong><small>戦力 {Math.floor(slime.power)}</small></span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="dispatch-console__empty">控えのスライムが必要です。キャンプで主力から外すと派遣できます。</div>
            )}

            <button
              className="dispatch-send-button"
              type="button"
              disabled={!canSend}
              onClick={() => {
                if (selectedSlime === null) return;
                const result = controller.startDispatch(contract.id, selectedSlime);
                setNotice(result.accepted ? `${contract.name}へ出発しました` : rejectionLabel(result.reason));
              }}
            >
              <strong>出発させる</strong>
            </button>
          </>
        )}
      </div>

      {notice !== null && <button className="toast-notice" type="button" onClick={() => setNotice(null)}>{notice}</button>}
    </section>
  );
}

function RunningDispatch({ contract, state }: { contract: ReturnType<typeof selectDispatchScreen>['contracts'][number]; state: ReturnType<typeof useGameState> }) {
  const slime = contract.slimeId === null ? null : state.gameData.roster.slimes[contract.slimeId];
  const presentation = slime === undefined || slime === null ? null : getSlimePresentation(slime);
  const progress = contract.durationSec <= 0 ? 0 : Math.max(0, Math.min(1, 1 - contract.remainingSec / contract.durationSec));
  return (
    <div className="dispatch-running-panel">
      <div className="dispatch-running-panel__slime">
        {presentation !== null && <img src={`${import.meta.env.BASE_URL}${presentation.icon}`} alt="" />}
        <span><strong>{presentation?.name ?? 'スライム'}</strong><small>任務遂行中</small></span>
      </div>
      <div className="dispatch-running-panel__time"><span>帰還まで</span><strong>{formatDuration(contract.remainingSec)}</strong></div>
      <div className="dispatch-running-panel__track"><i style={{ transform: `scaleX(${progress})` }} /></div>
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
