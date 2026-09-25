import type { CampManagementActions, CampManagementModel } from './CampManagementTypes';

export function CampMutationEntry({
  model,
  actions,
}: {
  model: CampManagementModel;
  actions: CampManagementActions;
}) {
  const { mutationRelevant, mutationReady, mode, detail } = model;
  if (!mutationRelevant || mode !== 'none') return null;

  return (
    <button
      className={`camp-mutation-entry ${mutationReady ? 'is-ready' : ''}`}
      type="button"
      onClick={() => actions.setMode('mutation')}
    >
      <span>✦</span>
      <div>
        <strong>{detail.mutationId === null ? 'レア変異' : detail.name}</strong>
        <small>
          {detail.mutationId !== null
            ? 'この個体は変異済みです'
            : mutationReady
              ? '変異核が反応しています'
              : '欠片を集めると変異核になります'}
        </small>
      </div>
      <em>›</em>
    </button>
  );
}

export function CampMutationPanel({
  model,
  actions,
}: {
  model: CampManagementModel;
  actions: CampManagementActions;
}) {
  const { mode, detail } = model;
  if (mode !== 'mutation') return null;

  return (
    <div className="camp-inline-tool camp-mutation-tool">
      <div className="camp-inline-tool__heading">
        <div>
          <strong>レア変異</strong>
          <small>職業はそのまま。特殊な性質だけを重ねます</small>
        </div>
        <button
          type="button"
          onClick={() => actions.setMode('none')}
          aria-label="レア変異を閉じる"
        >
          ×
        </button>
      </div>

      <div className="camp-mutation-options">
        {detail.mutationOptions
          .filter((option) =>
            option.eligible
            || option.fragments > 0
            || option.catalysts > 0
            || option.alreadyMutated)
          .map((option) => (
            <button
              key={option.id}
              className={`${option.canMutate ? 'is-ready' : ''} ${
                detail.mutationId === option.id ? 'is-current' : ''
              }`}
              type="button"
              disabled={!option.canMutate}
              onClick={() => actions.mutate(option.id)}
            >
              <div>
                <strong>{option.displayName}</strong>
                <small>{option.identity}</small>
              </div>
              <span>
                {detail.mutationId === option.id
                  ? '変異済み'
                  : option.catalysts > 0
                    ? option.eligible
                      ? `変異核 ×${option.catalysts}`
                      : 'この形態は対象外'
                    : `${option.fragmentName} ${option.fragments}/${option.fragmentThreshold}`}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
