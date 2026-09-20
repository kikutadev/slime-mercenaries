import styles from './CampStrengthenEffect.module.css';
export type StrengthenVariant = 'one' | 'ten' | 'max';
export type StrengthenPhase = 'charging' | 'result';

export type StrengthenCeremony = Readonly<{
  key: number;
  phase: StrengthenPhase;
  variant: StrengthenVariant;
  fromLevel: number;
  targetLevel: number;
  cost: string;
}>;

const COIN_COUNTS: Record<StrengthenVariant, number> = {
  one: 5,
  ten: 8,
  max: 12,
};

export function CampStrengthenEffect({ ceremony }: { ceremony: StrengthenCeremony | null }) {
  if (ceremony === null) return null;
  const label = ceremony.variant === 'one'
    ? '強くなる'
    : ceremony.variant === 'ten'
      ? 'まとめて強化'
      : '一気に強化';

  return (
    <div
      className={`${styles.root} camp-strengthen-effect camp-strengthen-effect--${ceremony.phase} camp-strengthen-effect--${ceremony.variant}`}
      key={ceremony.key}
      aria-live="polite"
    >
      <div className="camp-strengthen-effect__cost"><span>G</span><strong>-{ceremony.cost}</strong></div>
      <div className="camp-strengthen-effect__coins" aria-hidden="true">
        {Array.from({ length: COIN_COUNTS[ceremony.variant] }, (_, index) => <i key={index} />)}
      </div>
      <div className="camp-strengthen-effect__energy" aria-hidden="true"><i /><i /><i /></div>
      <div className="camp-strengthen-effect__level">
        <small>{label}</small>
        <strong><span>Lv.{ceremony.fromLevel}</span><b>→</b><em>Lv.{ceremony.targetLevel}</em></strong>
      </div>
    </div>
  );
}