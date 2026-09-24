import { useRef, useState } from 'react';
import { BottomSheet } from 'idle-game-kit/react';
import { useGameController } from '../app/GameProvider';
import { slimeSaveFilename } from '../application/save-transfer';
import type { EconomyMode } from '../application/runtime-settings';
import styles from './SettingsSheet.module.css';

type PendingAction =
  | Readonly<{ kind: 'delete' }>
  | Readonly<{ kind: 'import'; filename: string; contents: string }>
  | null;

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const controller = useGameController();
  const [mode, setMode] = useState<EconomyMode>(controller.economyMode);
  const [soundEnabled, setSoundEnabled] = useState(controller.soundEnabled);
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const commitLockRef = useRef(false);

  const changeMode = async (next: EconomyMode) => {
    if (busy || commitLockRef.current || next === mode) return;
    commitLockRef.current = true;
    setBusy(true);
    setMessage(null);
    try {
      await controller.setEconomyMode(next);
      setMode(next);
      setMessage(next === 'development'
        ? '開発用モードに切り替えました。通常モードとは別のセーブで、GOLDと素材は∞として扱われます。'
        : '通常モードに切り替えました。開発用モードの育成・進行は持ち越しません。');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'プレイモードを切り替えられませんでした。');
    } finally {
      commitLockRef.current = false;
      setBusy(false);
    }
  };

  const exportData = () => {
    try {
      const data = controller.exportSaveData();
      const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = slimeSaveFilename();
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setMessage('現在のセーブデータを書き出しました。');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'データを書き出せませんでした。');
    }
  };

  const chooseImportFile = () => {
    setPending(null);
    fileInputRef.current?.click();
  };

  const onImportFile = async (file: File | undefined) => {
    if (file === undefined) return;
    try {
      const contents = await file.text();
      setPending({ kind: 'import', filename: file.name, contents });
      setMessage(null);
    } catch {
      setMessage('ファイルを読み込めませんでした。');
    } finally {
      if (fileInputRef.current !== null) fileInputRef.current.value = '';
    }
  };

  const confirmPending = async () => {
    if (pending === null || busy || commitLockRef.current) return;
    commitLockRef.current = true;
    setBusy(true);
    setMessage(null);
    try {
      if (pending.kind === 'import') {
        await controller.importSaveData(pending.contents);
      } else {
        await controller.deleteSaveData();
      }
      window.location.reload();
    } catch (cause) {
      commitLockRef.current = false;
      setBusy(false);
      setMessage(cause instanceof Error ? cause.message : 'データを更新できませんでした。');
    }
  };

  return (
    <BottomSheet
      title="設定"
      onClose={busy ? () => undefined : onClose}
      backdropClassName={styles.backdrop}
      sheetClassName={styles.sheet}
      headerClassName={styles.header}
      closeButtonClassName={styles.close}
    >
      <div className={styles.content} aria-busy={busy}>
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <span>プレイモード</span>
            <small>いつでも切り替えられます</small>
          </div>
          <div className={styles.modeGrid} role="radiogroup" aria-label="プレイモード">
            <ModeButton
              active={mode === 'normal'}
              title="通常モード"
              description="GOLDと素材を獲得・消費して遊ぶ通常のモードです。"
              disabled={busy}
              onClick={() => void changeMode('normal')}
            />
            <ModeButton
              active={mode === 'development'}
              title="開発用モード"
              description="GOLDと素材が∞になり、合成・鍛造・育成を自由に試せます。"
              badge="∞"
              disabled={busy}
              onClick={() => void changeMode('development')}
            />
          </div>
          <div className={styles.modeNote}>
            通常モードと開発用モードは別々に保存されます。開発用モードの資源・育成・ステージ進行は通常モードへ反映されません。
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <span>サウンド</span>
            <small>戦闘SE</small>
          </div>
          <button
            className={styles.soundRow}
            type="button"
            role="switch"
            aria-checked={soundEnabled}
            onClick={() => {
              const next = !soundEnabled;
              controller.setSoundEnabled(next);
              setSoundEnabled(next);
            }}
          >
            <span>
              <strong>効果音</strong>
              <small>攻撃・被弾・勝敗の音を再生します。</small>
            </span>
            <i className={soundEnabled ? styles.soundSwitchOn : ''} aria-hidden="true"><b /></i>
          </button>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <span>セーブデータ</span>
            <small>{mode === 'development' ? '開発用モード' : '通常モード'}のデータを管理</small>
          </div>
          <div className={styles.dataActions}>
            <button type="button" onClick={exportData} disabled={busy}>
              <DataIcon kind="export" />
              <span><strong>データを書き出す</strong><small>バックアップを端末に保存</small></span>
            </button>
            <button type="button" onClick={chooseImportFile} disabled={busy}>
              <DataIcon kind="import" />
              <span><strong>データを読み込む</strong><small>バックアップから復元</small></span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            accept=".json,application/json"
            onChange={(event) => void onImportFile(event.target.files?.[0])}
          />

          <button
            className={styles.deleteButton}
            type="button"
            onClick={() => { setPending({ kind: 'delete' }); setMessage(null); }}
            disabled={busy}
          >
            セーブデータを削除
          </button>
        </section>

        {pending !== null && (
          <section className={styles.confirmBox} role="alert">
            <strong>{pending.kind === 'delete' ? 'セーブデータを削除しますか？' : 'このデータを読み込みますか？'}</strong>
            <p>
              {pending.kind === 'delete'
                ? (mode === 'development'
                    ? '開発用モードの進行データだけを削除して、最初から開始します。通常モードのデータには影響しません。'
                    : '通常モードの進行データだけを削除して、最初から開始します。開発用モードのデータには影響しません。')
                : '「' + pending.filename + '」で現在の' + (mode === 'development' ? '開発用モード' : '通常モード') + 'データを上書きします。'}
            </p>
            <div>
              <button type="button" onClick={() => setPending(null)} disabled={busy}>キャンセル</button>
              <button
                className={styles.confirmDanger}
                type="button"
                onClick={() => void confirmPending()}
                disabled={busy}
              >
                {busy ? '処理中…' : pending.kind === 'delete' ? '削除して最初から' : '読み込んで上書き'}
              </button>
            </div>
          </section>
        )}

        {message !== null && <div className={styles.message} role="status">{message}</div>}
      </div>
    </BottomSheet>
  );
}

function ModeButton({
  active,
  title,
  description,
  badge,
  onClick,
  disabled = false,
}: {
  active: boolean;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={styles.modeButton + ' ' + (active ? styles.modeActive : '')}
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={styles.modeCheck}>{active ? '✓' : ''}</span>
      <span className={styles.modeCopy}><strong>{title}</strong><small>{description}</small></span>
      {badge !== undefined && <em>{badge}</em>}
    </button>
  );
}

function DataIcon({ kind }: { kind: 'export' | 'import' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 3.75h9l5 5v11.5H5z" />
      <path d="M14 3.75v5h5" />
      {kind === 'export'
        ? <><path d="M12 16V9.5" /><path d="m9.5 12 2.5-2.5 2.5 2.5" /></>
        : <><path d="M12 9.5V16" /><path d="m9.5 13.5 2.5 2.5 2.5-2.5" /></>}
    </svg>
  );
}