import './CampManagementPanel.css';
import { CampFormationBoard } from './CampFormationBoard';
import { CampEquipmentEntry, CampEquipmentPanel } from './camp/CampEquipmentPanel';
import type { CampManagementActions, CampManagementModel } from './camp/CampManagementTypes';
import { CampMutationEntry, CampMutationPanel } from './camp/CampMutationPanel';
import { CampNextAction } from './camp/CampNextAction';
import { CampPrimaryActions } from './camp/CampPrimaryActions';
import { CampRosterStrip } from './camp/CampRosterStrip';
import { CampTrainPanel } from './camp/CampTrainPanel';
import { campManagementNavigation } from '../game/camp-management-navigation';

export function CampManagementPanel({
  model,
  actions,
}: {
  model: CampManagementModel;
  actions: CampManagementActions;
}) {
  const {
    mode,
    busy,
    detail,
    formation,
    formationCeremony,
    formationBusy,
  } = model;
  const navigation = campManagementNavigation(mode);

  return (
    <div
      id="camp-command-panel"
      className={`camp-command-panel camp-command-panel--${mode}`}
      aria-busy={busy}
    >
      <div className="camp-command-panel__header">
        <div>
          <span>{navigation.eyebrow}</span>
          <strong>{navigation.title}</strong>
        </div>
        <button
          type="button"
          disabled={busy}
          aria-label={navigation.backToMenu ? '仲間・育成メニューへ戻る' : 'キャンプへ戻る'}
          onClick={navigation.backToMenu ? () => actions.setMode('none') : actions.closeManagement}
        >
          {navigation.backLabel}
        </button>
      </div>

      {(mode === 'none' || mode === 'formation') && <CampRosterStrip model={model} actions={actions} />}
      {mode === 'none' && (
        <section className="camp-selected-summary" aria-label="選択中のスライム">
          <img src={`${import.meta.env.BASE_URL}${detail.icon}`} alt="" />
          <div>
            <span>選択中</span>
            <strong>{detail.name}</strong>
            <small>{detail.role} · Lv.{detail.level} · 合成ランク {detail.fusionRank}</small>
          </div>
        </section>
      )}
      {mode === 'none' && <CampNextAction model={model} actions={actions} />}
      {mode === 'none' && <CampPrimaryActions model={model} actions={actions} />}
      {mode === 'none' && <CampEquipmentEntry model={model} actions={actions} />}
      {mode === 'none' && <CampMutationEntry model={model} actions={actions} />}
      <CampEquipmentPanel model={model} actions={actions} />
      <CampMutationPanel model={model} actions={actions} />
      <CampTrainPanel model={model} actions={actions} />

      {mode === 'formation' && (
        <div className="camp-inline-tool">
          <CampFormationBoard
            slots={formation}
            selectedId={model.selected}
            selectedName={detail.name}
            selectedRole={detail.formationRole}
            selectedAssignment={detail.assignment}
            ceremony={formationCeremony}
            disabled={formationBusy || detail.assignment === 'dispatch'}
            onSlot={actions.formationSlot}
            onReserve={actions.formationReserve}
            onClose={() => actions.setMode('none')}
          />
        </div>
      )}
    </div>
  );
}
