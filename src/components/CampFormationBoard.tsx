import type { CSSProperties } from 'react';
import type { SlimeInstanceId } from '../domain';

export type CampFormationSlotView = Readonly<{
  slotIndex: number;
  slimeId: SlimeInstanceId | null;
  name: string | null;
  icon: string | null;
  assignment: string | null;
  formationRole: 'front' | 'back' | null;
}>;

export type CampFormationCeremonyKind = 'move' | 'swap' | 'replace' | 'reserve';

export type CampFormationCeremony = Readonly<{
  key: number;
  kind: CampFormationCeremonyKind;
  fromSlot: number | null;
  toSlot: number | null;
  selectedIcon: string;
  displacedIcon?: string;
}>;

interface Props {
  slots: readonly CampFormationSlotView[];
  selectedId: SlimeInstanceId;
  selectedName: string;
  selectedRole: 'front' | 'back';
  selectedAssignment: 'battle' | 'reserve' | 'dispatch';
  ceremony: CampFormationCeremony | null;
  disabled: boolean;
  onSlot: (slotIndex: number) => void;
  onReserve: () => void;
  onClose: () => void;
}

type GhostStyle = CSSProperties & Readonly<Record<'--formation-from-left' | '--formation-from-top' | '--formation-to-left' | '--formation-to-top', string>>;

function slotPoint(slotIndex: number | null, reserve: boolean): Readonly<{ left: string; top: string }> {
  if (reserve || slotIndex === null) return { left: '50%', top: '112%' };
  const column = slotIndex % 3;
  const row = slotIndex < 3 ? 0 : 1;
  return {
    left: String(16.666 + column * 33.333) + '%',
    top: row === 0 ? '25%' : '75%',
  };
}

function ghostStyle(fromSlot: number | null, toSlot: number | null): GhostStyle {
  const from = slotPoint(fromSlot, fromSlot === null);
  const to = slotPoint(toSlot, toSlot === null);
  return {
    '--formation-from-left': from.left,
    '--formation-from-top': from.top,
    '--formation-to-left': to.left,
    '--formation-to-top': to.top,
  };
}

function shortName(name: string | null): string {
  if (name === null) return '';
  return name.replace('スライム', '');
}

function isRecommended(slotIndex: number, role: 'front' | 'back'): boolean {
  return role === 'front' ? slotIndex < 3 : slotIndex >= 3;
}

function FormationMoveEffect({ ceremony }: { ceremony: CampFormationCeremony | null }) {
  if (ceremony === null) return null;

  const selectedStyle = ghostStyle(ceremony.fromSlot, ceremony.toSlot);
  const secondTarget = ceremony.kind === 'swap'
    ? ceremony.fromSlot
    : ceremony.kind === 'replace'
      ? null
      : undefined;
  const secondStyle = secondTarget === undefined
    ? null
    : ghostStyle(ceremony.toSlot, secondTarget);

  return (
    <div className={'camp-formation-move camp-formation-move--' + ceremony.kind} key={ceremony.key} aria-hidden="true">
      <img className="camp-formation-move__ghost camp-formation-move__ghost--selected" style={selectedStyle} src={ceremony.selectedIcon} alt="" />
      {ceremony.displacedIcon !== undefined && secondStyle !== null && (
        <img className="camp-formation-move__ghost camp-formation-move__ghost--displaced" style={secondStyle} src={ceremony.displacedIcon} alt="" />
      )}
    </div>
  );
}

export function CampFormationBoard({
  slots,
  selectedId,
  selectedName,
  selectedRole,
  selectedAssignment,
  ceremony,
  disabled,
  onSlot,
  onReserve,
  onClose,
}: Props) {
  const selectedSlot = slots.find((slot) => slot.slimeId === selectedId)?.slotIndex ?? null;
  const hiddenSlots = ceremony === null
    ? new Set<number>()
    : new Set([ceremony.fromSlot, ceremony.toSlot].filter((value): value is number => value !== null));

  return (
    <div className="camp-formation-board">
      <div className="camp-formation-board__summary">
        <div>
          <span>選択中</span>
          <strong>{selectedName}</strong>
        </div>
        <div>
          <span>おすすめ</span>
          <strong>{selectedRole === 'front' ? '前衛' : '後衛'}</strong>
        </div>
        <button className="camp-formation-board__done" type="button" disabled={disabled} onClick={onClose}>完了</button>
      </div>

      <div className="camp-formation-board__field">
        <div className="camp-formation-board__enemy"><i />敵側<i /></div>
        <div className="camp-formation-board__row-label camp-formation-board__row-label--front">前衛</div>
        <div className="camp-formation-board__row-label camp-formation-board__row-label--back">後衛</div>

        <div className="camp-formation-board__grid">
          {slots.map((slot) => {
            const current = slot.slimeId === selectedId;
            const recommended = isRecommended(slot.slotIndex, selectedRole);
            const hidden = hiddenSlots.has(slot.slotIndex);
            const occupantOffRole = slot.formationRole !== null && !isRecommended(slot.slotIndex, slot.formationRole);
            return (
              <button
                key={slot.slotIndex}
                type="button"
                className={[
                  'camp-formation-slot',
                  current ? 'is-current' : '',
                  recommended ? 'is-recommended' : '',
                  occupantOffRole ? 'is-off-role' : '',
                  hidden ? 'is-transition-hidden' : '',
                ].filter(Boolean).join(' ')}
                disabled={disabled || current}
                aria-label={
                  current
                    ? String(slot.slotIndex + 1) + '番 ' + (slot.name ?? '空き') + ' 現在位置'
                    : String(slot.slotIndex + 1) + '番 ' + (slot.name ?? '空き') + 'へ配置'
                }
                onClick={() => onSlot(slot.slotIndex)}
              >
                <span className="camp-formation-slot__number">{slot.slotIndex + 1}</span>
                <span className="camp-formation-slot__body">
                  {slot.icon !== null
                    ? <img src={import.meta.env.BASE_URL + slot.icon} alt="" />
                    : <i className="camp-formation-slot__empty-mark" aria-hidden="true" />}
                </span>
                <strong>{slot.name === null ? '空き' : shortName(slot.name)}</strong>
                {current && <em>ここ</em>}
              </button>
            );
          })}
          <FormationMoveEffect ceremony={ceremony} />
        </div>
      </div>

      <div className="camp-formation-board__footer">
        <span>
          {selectedAssignment === 'battle'
            ? '現在: ' + (selectedSlot === null ? '戦闘編成' : String(selectedSlot + 1) + '番')
            : selectedAssignment === 'reserve'
              ? '現在: 控え'
              : '現在: 派遣中'}
        </span>
        <button
          type="button"
          disabled={disabled || selectedAssignment !== 'battle' || selectedSlot === null}
          onClick={onReserve}
        >
          控えへ戻す
        </button>
      </div>
    </div>
  );
}
