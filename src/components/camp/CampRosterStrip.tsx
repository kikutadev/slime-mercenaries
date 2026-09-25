import { getSlimePresentation } from '../../game/slimes';
import { CampStationIcon } from '../CampStationIcon';
import type { CampManagementActions, CampManagementModel } from './CampManagementTypes';

export function CampRosterStrip({
  model,
  actions,
}: {
  model: CampManagementModel;
  actions: CampManagementActions;
}) {
  const {
    roster,
    ownedIds,
    selected,
    codexNewCount,
    strengthenCeremony,
    busy,
  } = model;

  return (
    <div className="camp-roster-block">
      <div className="camp-roster-title">
        <strong>仲間</strong>
        <div className="camp-roster-meta">
          <span>{ownedIds.length}匹</span>
          <button
            type="button"
            className={codexNewCount > 0 ? 'is-new' : ''}
            disabled={busy}
            onClick={actions.openCodex}
            aria-haspopup="dialog"
          >
            図鑑
            {codexNewCount > 0 && <em>{codexNewCount}</em>}
          </button>
        </div>
      </div>

      <div className="camp-roster" aria-label="仲間のスライム">
        {ownedIds.map((id) => {
          const slime = roster[id]!;
          const presentation = getSlimePresentation(slime);
          const displayedLevel = strengthenCeremony?.phase === 'charging' && id === selected
            ? strengthenCeremony.fromLevel
            : slime.level;

          return (
            <button
              key={id}
              className={id === selected ? 'is-selected' : ''}
              type="button"
              aria-pressed={id === selected}
              aria-label={`${presentation.name} Lv.${displayedLevel}`}
              disabled={busy}
              onClick={() => {
                actions.selectSlime(id);
                actions.resetFeedback();
              }}
            >
              <img src={`${import.meta.env.BASE_URL}${presentation.icon}`} alt="" />
              <strong>{presentation.name.replace('スライム', '')}</strong>
              <small>Lv.{displayedLevel}</small>
            </button>
          );
        })}

        <button
          className="camp-roster__add"
          type="button"
          disabled={busy}
          onClick={actions.openCreate}
          aria-label="仲間を増やす"
        >
          <span aria-hidden="true"><CampStationIcon kind="nursery" /></span>
          <strong>追加</strong>
        </button>
      </div>
    </div>
  );
}
