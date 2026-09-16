import { useEffect, useState } from 'react';
import { useGameController, useGameState } from '../app/GameProvider';
import { selectDispatchScreen, selectGlobalHud } from '../application/selectors/ui-selectors';
import { getSlimePresentation } from '../game/slimes';
import type { DispatchContractId, JobSlimeId } from '../domain';

export function DispatchScreen() {
  const state = useGameState();
  const controller = useGameController();
  const view = selectDispatchScreen(state);
  const hud = selectGlobalHud(state);
  const [selection, setSelection] = useState<Partial<Record<DispatchContractId, JobSlimeId>>>({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setSelection((current) => {
      let changed = false;
      const next = { ...current };
      for (const contract of view.contracts) {
        if (contract.status === 'running') continue;
        const selected = next[contract.id];
        const stillEligible = selected !== undefined && contract.eligibleSlimes.some((slime) => slime.id === selected);
        if (!stillEligible) {
          const fallback = contract.eligibleSlimes[0]?.id;
          if (fallback === undefined) {
            if (selected !== undefined) {
              delete next[contract.id];
              changed = true;
            }
          } else if (selected !== fallback) {
            next[contract.id] = fallback;
            changed = true;
          }
        }
      }
      return changed ? next : current;
    });
  }, [view.contracts]);

  const activeCount = view.contracts.filter((contract) => contract.status === 'running').length;

  return (
    <section className="screen screen--menu screen--active" aria-label="Dispatch">
      <header className="menu-header">
        <div><p className="eyebrow">RESERVE WORK</p><h1>Dispatch</h1></div>
        <div className="menu-header__resources"><span>G {hud.gold}</span><span>{activeCount} active</span></div>
      </header>

      <div className="dispatch-intro">
        <div className="dispatch-intro__icon">↗</div>
        <div><strong>控えにも仕事を。</strong><p>主力から外したスライムを護衛・探索・採集へ送り、放置中も傭兵団を働かせます。</p></div>
      </div>

      <div className="dispatch-list">
        {view.contracts.map((contract) => {
          const selected = selection[contract.id];
          const runningSlime = contract.slimeId === null ? null : state.gameData.roster.slimes[contract.slimeId];
          const runningPresentation = runningSlime == null ? null : getSlimePresentation(runningSlime);
          const progress = contract.status !== 'running' || contract.durationSec <= 0
            ? 0
            : Math.max(0, Math.min(1, 1 - contract.remainingSec / contract.durationSec));

          return (
            <article className={`dispatch-card ${contract.status === 'running' ? 'is-running' : ''}`} key={contract.id}>
              <div className="dispatch-card__head">
                <div><span>{contract.rewardLabel}</span><h2>{contract.name}</h2></div>
                <strong>{contract.status === 'running' ? formatDuration(contract.remainingSec) : formatDuration(contract.durationSec)}</strong>
              </div>

              {contract.status === 'running' ? (
                <>
                  <div className="dispatch-running-slime">
                    {runningPresentation !== null && <img src={`${import.meta.env.BASE_URL}${runningPresentation.icon}`} alt="" />}
                    <span><strong>{runningPresentation?.name ?? 'Slime'}</strong><small>派遣中 · 自動帰還</small></span>
                  </div>
                  <div className="dispatch-progress"><i style={{ transform: `scaleX(${progress})` }} /></div>
                  <p className="dispatch-note">帰還時に報酬は自動で反映されます。受取操作は不要です。</p>
                </>
              ) : (
                <>
                  <div className="contract-meta"><span>推奨戦力 {contract.requiredPower}</span><span>報酬: {contract.rewardLabel}</span></div>
                  {contract.eligibleSlimes.length > 0 ? (
                    <div className="dispatch-slime-picker">
                      {contract.eligibleSlimes.map((slime) => (
                        <button
                          type="button"
                          className={selected === slime.id ? 'is-selected' : ''}
                          key={slime.id}
                          onClick={() => setSelection((current) => ({ ...current, [contract.id]: slime.id }))}
                        >
                          <img src={`${import.meta.env.BASE_URL}${slime.icon}`} alt="" />
                          <span><strong>{slime.name}</strong><small>Power {Math.floor(slime.power)}</small></span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="inline-note">条件を満たす控えスライムがいません。戦闘編成から外すか、育成してください。</div>
                  )}
                  <button
                    className="primary-button"
                    type="button"
                    disabled={selected === undefined}
                    onClick={() => {
                      if (selected === undefined) return;
                      const result = controller.startDispatch(contract.id, selected);
                      setNotice(result.accepted ? `${contract.name}へ出発しました` : rejectionLabel(result.reason));
                    }}
                  >
                    Send
                  </button>
                </>
              )}
            </article>
          );
        })}
      </div>

      {notice !== null && <button className="toast-notice" type="button" onClick={() => setNotice(null)}>{notice}</button>}
    </section>
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
