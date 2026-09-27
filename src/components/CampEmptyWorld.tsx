import { lazy, Suspense, useEffect, useState } from 'react';
import { CampStationIcon } from './CampStationIcon';

const CampEnvironmentStage = lazy(async () => {
  const module = await import('./CampEnvironmentStage');
  return { default: module.CampEnvironmentStage };
});

const CampPlainTrialStage = lazy(async () => {
  const module = await import('./CampPlainTrialStage');
  return { default: module.CampPlainTrialStage };
});

export function CampEmptyWorld({
  cueId,
  title,
  body,
  onCreate,
  onPlainTrialComplete,
}: {
  cueId: string | null;
  title: string;
  body: string;
  onCreate: () => void;
  onPlainTrialComplete: () => void;
}) {
  const [attemptKey, setAttemptKey] = useState(0);
  const [attempting, setAttempting] = useState(false);

  useEffect(() => {
    if (cueId !== 'try-first-plain') setAttempting(false);
  }, [cueId]);

  const trialReady = cueId === 'try-first-plain' || cueId === 'give-first-job';
  const completed = cueId === 'give-first-job';

  const tryPlain = () => {
    if (attempting || completed) return;
    setAttempting(true);
    setAttemptKey((current) => current + 1);
    window.setTimeout(() => {
      setAttempting(false);
      onPlainTrialComplete();
    }, 1900);
  };

  return (
    <div className={`camp-empty-world ${trialReady ? 'camp-empty-world--plain-trial' : ''}`}>
      <Suspense fallback={<div className="camp-environment-stage" aria-hidden="true" />}>
        <CampEnvironmentStage
          reaction="idle"
          reactionKey={0}
          fusionReady={false}
          residents={[]}
        />
      </Suspense>

      {trialReady && (
        <Suspense fallback={<div className="camp-plain-trial-stage" aria-hidden="true" />}>
          <CampPlainTrialStage attemptKey={attemptKey} completed={completed} />
        </Suspense>
      )}

      <div className="camp-empty-world__tutorial" role="status" aria-live="polite">
        <span>はじめてガイド</span>
        <strong>{title}</strong>
        <small>{body}</small>
      </div>

      {trialReady && (
        <div className="camp-plain-trial-hp" aria-label="木人の体力は減っていません">
          <span>木人</span><i><b /></i><em>100%</em>
        </div>
      )}

      {attempting && <div className="camp-plain-trial-zero" aria-live="polite">0</div>}
      {completed && <div className="camp-plain-trial-speech" role="status">……効いてない。</div>}

      {cueId === 'try-first-plain' ? (
        <button
          className="camp-empty-world__primary camp-empty-world__primary--trial is-tutorial-target"
          type="button"
          disabled={attempting}
          onClick={tryPlain}
        >
          <span aria-hidden="true">●</span>
          <strong>{attempting ? '体当たり中…' : '木人を叩いてみる'}</strong>
          <small>まずは、このままで戦えるか試す</small>
        </button>
      ) : cueId === 'give-first-job' ? (
        <button className="camp-empty-world__primary is-tutorial-target" type="button" onClick={onCreate}>
          <span aria-hidden="true">⚔</span>
          <strong>剣を渡す</strong>
          <small>何もできなかったスライムに仕事を与える</small>
        </button>
      ) : (
        <button className="camp-empty-world__primary is-tutorial-target" type="button" onClick={onCreate}>
          <span aria-hidden="true"><CampStationIcon kind="nursery" /></span>
          <strong>最初のスライムを生み出す</strong>
          <small>素材はもう揃っています</small>
        </button>
      )}
    </div>
  );
}
