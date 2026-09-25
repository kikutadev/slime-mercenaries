import { lazy, Suspense } from 'react';
import { CampStationIcon } from './CampStationIcon';

const CampEnvironmentStage = lazy(async () => {
  const module = await import('./CampEnvironmentStage');
  return { default: module.CampEnvironmentStage };
});

export function CampEmptyWorld({ onCreate }: { onCreate: () => void }) {
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
      <button type="button" onClick={onCreate}>
        <span aria-hidden="true"><CampStationIcon kind="nursery" /></span>
        <strong>最初のスライムを生み出す</strong>
        <small>生成槽で仲間を迎える</small>
      </button>
    </div>
  );
}
