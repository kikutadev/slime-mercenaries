import { lazy, Suspense } from 'react';
import type { CampFeedback } from '../game/camp-types';
import type { CampLifeResidentSpec } from '../game/camp-life-residents';
import type { SlimePresentation } from '../game/slimes';
import {
  CampStrengthenEffect,
  type StrengthenCeremony,
} from './CampStrengthenEffect';

const CampSlimeStage = lazy(async () => {
  const module = await import('./CampSlimeStage');
  return { default: module.CampSlimeStage };
});

const CampEnvironmentStage = lazy(async () => {
  const module = await import('./CampEnvironmentStage');
  return { default: module.CampEnvironmentStage };
});

export interface CampWorldHero {
  presentation: SlimePresentation;
  role: string;
  name: string;
  level: number;
  fusionRank: number;
}

interface CampWorldProps {
  feedback: CampFeedback;
  hero: CampWorldHero | null;
  residents: readonly CampLifeResidentSpec[];
  fusionReady: boolean;
  strengthenCeremony: StrengthenCeremony | null;
}

/**
 * Visual Camp surface only.
 * Management state and Domain commands intentionally stay outside this component.
 */
export function CampWorld({
  feedback,
  hero,
  residents,
  fusionReady,
  strengthenCeremony,
}: CampWorldProps) {
  return (
    <div className={`camp-world camp-world--${feedback.reaction}`}>
      <Suspense fallback={<div className="camp-environment-stage" aria-hidden="true" />}>
        <CampEnvironmentStage
          reaction={feedback.reaction}
          reactionKey={feedback.key}
          fusionReady={fusionReady}
          residents={residents}
        />
      </Suspense>

      <CampStrengthenEffect ceremony={strengthenCeremony} />

      {feedback.reaction === 'recruit' && feedback.title !== '' && (
        <div className="camp-reward-ring" key={`ring-${feedback.key}`} aria-hidden="true" />
      )}

      {hero !== null && (
        <div className="camp-slime-stage">
          <Suspense fallback={<div className="camp-resident-stage" aria-hidden="true" />}>
            <CampSlimeStage
              presentation={hero.presentation}
              reaction={feedback.reaction}
              reactionKey={feedback.key}
              reactionStrength={feedback.strength ?? 1}
            />
          </Suspense>

          {feedback.title !== '' && (
            <div
              className={`camp-action-feedback camp-action-feedback--${feedback.reaction}`}
              key={feedback.key}
            >
              <strong>{feedback.title}</strong>
              {feedback.detail !== undefined && <small>{feedback.detail}</small>}
            </div>
          )}

          <div className="camp-slime-name">
            <span>{hero.role}</span>
            <strong>{hero.name}</strong>
            <small>
              Lv.{strengthenCeremony?.phase === 'charging'
                ? strengthenCeremony.fromLevel
                : hero.level}
              {' '}· 合成ランク {hero.fusionRank}
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
