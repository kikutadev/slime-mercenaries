import { useState } from 'react';
import { BottomSheet } from 'idle-game-kit/react';
import { SlimeMark } from './SlimeMark';
import styles from './OnboardingGuideSheet.module.css';

const STEPS = [
  {
    label: '1 / 5',
    title: '何もできないスライムから始まる',
    speech: 'まだ、何もできない。',
    body: '素材からプレーンスライムを生み出します。完成済みの職業キャラを引くゲームではありません。',
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
  const step = STEPS[index]!;
  const last = index === STEPS.length - 1;

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
        <div className={styles.scene} aria-hidden="true">
          <SlimeMark className={styles.slime} />
          <div className={styles.speech}>{step.speech}</div>
        </div>
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
