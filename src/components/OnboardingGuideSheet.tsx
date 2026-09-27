import { lazy, Suspense, useState } from 'react';
import { BottomSheet } from 'idle-game-kit/react';
import { useManagedTimeouts } from '../app/useManagedTimeouts';
import { SlimeMark } from './SlimeMark';
import styles from './OnboardingGuideSheet.module.css';

const CampPlainTrialStage = lazy(async () => {
  const module = await import('./CampPlainTrialStage');
  return { default: module.CampPlainTrialStage };
});

const STEPS = [
  {
    label: '1 / 5',
    title: '何もできないスライムから始まる',
    speech: '……効いてない。',
    body: '素材から生まれたプレーンスライムは、木人へ体当たりしても0ダメージ。まず「何もできない」を実際に見てから仕事を与えます。',
  },
  {
    label: '2 / 5',
    title: '道具を渡すと、仕事が生まれる',
    speech: 'これ、ぼくに？',
    body: '剣や弓などの仕事道具を渡すと職業が生まれ、攻撃モーションや役割そのものが変わります。',
  },
  {
    label: '3 / 5',
    title: '負けても戦いは止まらない',
    speech: 'まだ終わりじゃないみたい。',
    body: '最前線で負けたら一つ前へ撤退。そこで稼ぎ続け、準備ができたら自動で再挑戦します。',
  },
  {
    label: '4 / 5',
    title: '合成で「戦い方」が進化する',
    speech: 'もっと強くなれる？',
    body: '体を大きくするのではなく、武器・攻撃回数・VFX・必殺の挙動が強くなります。',
  },
  {
    label: '5 / 5',
    title: '控えの仲間も働く',
    speech: 'こっちの仕事、行ってくる。',
    body: '主力から外れたスライムも派遣へ。傭兵団全体がそれぞれの仕事で報酬を持ち帰ります。',
  },
] as const;

export function OnboardingGuideSheet({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [trialAttemptKey, setTrialAttemptKey] = useState(0);
  const [trialRunning, setTrialRunning] = useState(false);
  const [trialDone, setTrialDone] = useState(false);
  const { schedule } = useManagedTimeouts();
  const step = STEPS[index]!;
  const last = index === STEPS.length - 1;

  const runTrial = () => {
    if (trialRunning) return;
    setTrialRunning(true);
    setTrialDone(false);
    setTrialAttemptKey((current) => current + 1);
    schedule(() => {
      setTrialRunning(false);
      setTrialDone(true);
    }, 1900);
  };

  return (
    <BottomSheet
      title="はじめてガイド"
      onClose={onClose}
      backdropClassName={styles.backdrop}
      sheetClassName={styles.sheet}
      headerClassName={styles.header}
      closeButtonClassName={styles.close}
    >
      <div className={styles.content}>
        {index === 0 ? (
          <div className={`${styles.scene} ${styles.trialScene}`}>
            <Suspense fallback={<div className={styles.trialLoading} aria-hidden="true" />}>
              <CampPlainTrialStage attemptKey={trialAttemptKey} completed={trialDone} />
            </Suspense>
            <div className={styles.trialHp} aria-label="木人の体力は100パーセントのまま">
              <span>木人</span><i><b /></i><em>100%</em>
            </div>
            {trialRunning && <div className={styles.trialZero}>0</div>}
            {trialDone ? (
              <div className={styles.trialSpeech}>……効いてない。</div>
            ) : (
              <button className={styles.trialButton} type="button" disabled={trialRunning} onClick={runTrial}>
                {trialRunning ? '体当たり中…' : '木人を叩いてみる'}
              </button>
            )}
          </div>
        ) : (
          <div className={styles.scene} aria-hidden="true">
            <SlimeMark className={styles.slime} />
            <div className={styles.speech}>{step.speech}</div>
          </div>
        )}
        <div className={styles.copy}>
          <span>{step.label}</span>
          <strong>{step.title}</strong>
          <p>{step.body}</p>
        </div>
        <div className={styles.dots} aria-label={`全${STEPS.length}ページ中${index + 1}ページ`}>
          {STEPS.map((_, stepIndex) => <i className={stepIndex === index ? styles.dotActive : ''} key={stepIndex} />)}
        </div>
        <div className={styles.actions}>
          {index > 0 && <button type="button" onClick={() => setIndex((current) => current - 1)}>戻る</button>}
          <button className={styles.primary} type="button" onClick={() => last ? onClose() : setIndex((current) => current + 1)}>
            {last ? 'ゲームへ戻る' : '次へ'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
