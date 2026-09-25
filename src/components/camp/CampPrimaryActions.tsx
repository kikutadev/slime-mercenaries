import { CampStationIcon } from '../CampStationIcon';
import type { CampManagementActions, CampManagementModel } from './CampManagementTypes';

export function CampPrimaryActions({
  model,
  actions,
}: {
  model: CampManagementModel;
  actions: CampManagementActions;
}) {
  const {
    mode,
    busy,
    retryFarmClearsRemaining,
    selectedUpgrades,
    detail,
  } = model;

  const levelReady = retryFarmClearsRemaining > 0
    && selectedUpgrades.some((opportunity) => opportunity.kind === 'level');
  const fusionReady = detail.fusionOptions.some((option) => option.canFuse);

  return (
    <div className="camp-primary-actions" aria-label="キャンプの操作">
      <button
        className={`camp-primary-action ${mode === 'train' ? 'is-active' : ''} ${levelReady ? 'is-ready' : ''}`}
        type="button"
        aria-pressed={mode === 'train'}
        disabled={busy}
        onClick={() => actions.setMode(mode === 'train' ? 'none' : 'train')}
      >
        <span><CampStationIcon kind="train" /></span>
        <strong>強化</strong>
      </button>

      <button
        className={`camp-primary-action ${fusionReady ? 'is-ready' : ''}`}
        type="button"
        aria-pressed={mode === 'fusion'}
        disabled={busy}
        onClick={() => actions.setMode('fusion')}
      >
        <span><CampStationIcon kind="fusion" /></span>
        <strong>合成</strong>
      </button>

      <button
        className={`camp-primary-action ${mode === 'formation' ? 'is-active' : ''}`}
        type="button"
        aria-pressed={mode === 'formation'}
        disabled={busy}
        onClick={() => actions.setMode(mode === 'formation' ? 'none' : 'formation')}
      >
        <span><CampStationIcon kind="formation" /></span>
        <strong>編成</strong>
      </button>

      <button
        className="camp-primary-action"
        type="button"
        aria-haspopup="dialog"
        disabled={busy}
        onClick={actions.openCreate}
      >
        <span><CampStationIcon kind="nursery" /></span>
        <strong>仲間</strong>
      </button>
    </div>
  );
}
