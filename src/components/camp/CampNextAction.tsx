import type { CampManagementActions, CampManagementModel } from './CampManagementTypes';

export function CampNextAction({
  model,
  actions,
}: {
  model: CampManagementModel;
  actions: CampManagementActions;
}) {
  const {
    mode,
    retryFarmClearsRemaining,
    primaryUpgrade,
    primaryUpgradeName,
    primaryMutation,
    primaryMutationName,
    cue,
  } = model;

  if (
    mode === 'none'
    && retryFarmClearsRemaining > 0
    && primaryUpgrade !== null
    && primaryUpgradeName !== null
  ) {
    return (
      <button
        className="camp-next-action"
        type="button"
        onClick={() => {
          actions.selectSlime(primaryUpgrade.slimeId);
          actions.setMode(
            primaryUpgrade.kind === 'mutation'
              ? 'mutation'
              : primaryUpgrade.kind === 'fusion'
                ? 'fusion'
                : 'train',
          );
        }}
      >
        <span>再出撃準備</span>
        <strong>{primaryUpgradeName} · {primaryUpgrade.label}</strong>
        <em>›</em>
      </button>
    );
  }

  if (mode === 'none' && primaryMutation !== null && primaryMutationName !== null) {
    return (
      <button
        className="camp-next-action"
        type="button"
        onClick={() => {
          actions.selectSlime(primaryMutation.slimeId);
          actions.setMode('mutation');
        }}
      >
        <span>レア変異</span>
        <strong>{primaryMutationName} · {primaryMutation.label}</strong>
        <em>›</em>
      </button>
    );
  }

  if (mode !== 'none' || cue === null) return null;

  return (
    <button
      className="camp-next-action"
      type="button"
      onClick={() => {
        if (cue.action === 'Battle') actions.openBattle();
        else if (cue.action === 'Fuse') actions.setMode('fusion');
        else actions.openCreate();
      }}
    >
      <span>次にやること</span>
      <strong>{cue.title}</strong>
      <em>›</em>
    </button>
  );
}
