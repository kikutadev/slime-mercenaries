import type { CampManagementActions, CampManagementModel } from './CampManagementTypes';

export function CampTrainPanel({
  model,
  actions,
}: {
  model: CampManagementModel;
  actions: CampManagementActions;
}) {
  const {
    mode,
    detail,
    busy,
    strengthenCeremony,
    strengthenBusy,
    formationBusy,
    showValidationTools,
  } = model;

  if (mode !== 'train') return null;

  return (
    <div className="camp-inline-tool">
      <div className="camp-inline-tool__heading">
        <div>
          <strong>{detail.name}を強化</strong>
          <small>
            Lv.{strengthenCeremony?.phase === 'charging'
              ? strengthenCeremony.fromLevel
              : detail.level}
          </small>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => actions.setMode('none')}
          aria-label="強化を閉じる"
        >
          ×
        </button>
      </div>

      <div className={`camp-level-buttons ${strengthenBusy ? 'is-busy' : ''}`}>
        {([
          ['one', '+1', detail.levelActions.one],
          ['ten', '+10', detail.levelActions.ten],
          ['max', '最大', detail.levelActions.max],
        ] as const).map(([variant, label, action]) => {
          const running = strengthenCeremony?.variant === variant;
          return (
            <button
              key={variant}
              className={running ? 'is-running' : ''}
              type="button"
              aria-busy={running}
              disabled={
                formationBusy
                || strengthenCeremony?.phase === 'charging'
                || action === null
                || !action.available
              }
              onClick={() => {
                if (action !== null) actions.strengthen(action, variant);
              }}
            >
              <span>{running ? '強化中' : label}</span>
              <strong>
                {running
                  ? `-${strengthenCeremony.cost} G`
                  : `${action?.cost ?? '—'} G`}
              </strong>
              <em>
                {running
                  ? `Lv.${strengthenCeremony.targetLevel}`
                  : action === null
                    ? '—'
                    : `→ Lv.${action.targetLevel}`}
              </em>
            </button>
          );
        })}
      </div>

      {showValidationTools && (
        <div className="camp-validation-tools">
          <span>検証ツール</span>
          <button type="button" onClick={actions.validationSetLevel40}>Lv.40へ</button>
          <button type="button" onClick={actions.validationReset}>初期形態へ戻す</button>
        </div>
      )}
    </div>
  );
}
