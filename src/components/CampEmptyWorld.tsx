import { lazy, Suspense } from 'react';
import { CampStationIcon } from './CampStationIcon';

const CampEnvironmentStage = lazy(async () => {
  const module = await import('./CampEnvironmentStage');
  return { default: module.CampEnvironmentStage };
});

export function CampEmptyWorld({
  title,
  body,
  onCreate,
}: {
  title: string;
  body: string;
  onCreate: () => void;
}) {
  return (
    <div className="camp-empty-world">
      <Suspense fallback={<div className="camp-environment-stage" aria-hidden="true" />}>
        <CampEnvironmentStage
          reaction="idle"
          reactionKey={0}
          fusionReady={false}
          residents={[]}
        />
      </Suspense>

      <div className="camp-empty-world__tutorial" role="status" aria-live="polite">
        <span>はじめてガイド</span>
        <strong>{title}</strong>
        <small>{body}</small>
      </div>

      <button className="camp-empty-world__primary is-tutorial-target" type="button" onClick={onCreate}>
        <span aria-hidden="true"><CampStationIcon kind="nursery" /></span>
        <strong>最初のスライムを生み出す</strong>
        <small>素材はもう揃っています</small>
      </button>
    </div>
  );
}
