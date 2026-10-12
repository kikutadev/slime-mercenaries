import type { CampManagementActions, CampManagementModel } from './CampManagementTypes';

export function CampEquipmentEntry({
  model,
  actions,
}: {
  model: CampManagementModel;
  actions: CampManagementActions;
}) {
  const { detail, mode, busy, weaponView } = model;
  if (detail.typeId === 'mimic' || (mode !== 'none' && mode !== 'equipment')) return null;

  return (
    <button
      className={`camp-equipment-entry ${mode === 'equipment' ? 'is-active' : ''}`}
      type="button"
      aria-pressed={mode === 'equipment'}
      disabled={busy}
      onClick={() => actions.setMode(mode === 'equipment' ? 'none' : 'equipment')}
    >
      <div>
        <span>装備</span>
        <strong>{weaponView.current?.name ?? '未装備'}</strong>
      </div>
      <small>
        {weaponView.options.length > 0
          ? `${weaponView.options.length}本から選ぶ`
          : '鍛造で武器を入手'}
      </small>
      <em>›</em>
    </button>
  );
}

export function CampEquipmentPanel({
  model,
  actions,
}: {
  model: CampManagementModel;
  actions: CampManagementActions;
}) {
  const { mode, detail, weaponView, busy } = model;
  if (mode !== 'equipment') return null;

  return (
    <div className="camp-inline-tool camp-equipment-tool">
      <div className="camp-equipment-stage">
        <img src={`${import.meta.env.BASE_URL}${detail.icon}`} alt="" />
        <div>
          <span>{detail.name}</span>
          <strong>{weaponView.current?.name ?? '武器未装備'}</strong>
          <small>{weaponView.current === null ? '装備できる武器がありません' : '現在の装備'}</small>
        </div>
      </div>
      <h2 className="camp-equipment-heading">装備する武器</h2>

      {weaponView.options.length === 0 ? (
        <div className="camp-equipment-empty">
          <span>この職業の武器をまだ持っていません</span>
          <button type="button" onClick={actions.openForge}>鍛造へ</button>
        </div>
      ) : (
        <div className="camp-weapon-strip" aria-label="装備できる武器">
          {weaponView.options.map((weapon) => (
            <button
              key={weapon.instanceId}
              type="button"
              className={weapon.equipped ? 'is-equipped' : ''}
              aria-pressed={weapon.equipped}
              disabled={weapon.equipped || busy}
              onClick={() => actions.equipWeapon(weapon.id)}
            >
              <span className={`camp-weapon-rarity camp-weapon-rarity--${weapon.rarity}`}>
                {weapon.rarity === 'mythic'
                  ? '神話'
                  : weapon.rarity === 'rare'
                    ? '希少'
                    : '一般'}
              </span>
              <strong>{weapon.name}</strong>
              <small>攻撃 ×{weapon.effectiveMultiplier.toFixed(2)} · +{weapon.refinementRank}</small>
              <em>
                {weapon.equipped
                  ? '装備中'
                  : weapon.equippedByName === null
                    ? '装備する'
                    : `${weapon.equippedByName}から移す`}
              </em>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
