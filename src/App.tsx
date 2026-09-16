import { useMemo, useState } from 'react';
import { BattleCanvas } from './components/BattleCanvas';
import { SlimePreview } from './components/SlimePreview';
import { canFuse, fuseSlime, getNextFusionStep } from './game/fusion';
import { createInitialRoster, getSlimePresentation, SLIMES, type SlimeId } from './game/slimes';
import type { BattleSnapshot } from './game/BattleRuntime';

type Screen = 'battle' | 'slimes';

const INITIAL_BATTLE: BattleSnapshot = {
  phase: 'loading',
  label: '出撃準備中',
  result: null,
  enemyAlive: 3,
  enemyHp: 12,
  enemyMaxHp: 12,
  swordHp: 6,
  swordMaxHp: 6,
  bowHp: 4,
  bowMaxHp: 4,
};

function AssignmentLabel({ value }: { value: 'battle' | 'reserve' | 'dispatch' }) {
  const label = value === 'battle' ? '戦闘中' : value === 'dispatch' ? '派遣中' : '控え';
  return <span className={`assignment assignment--${value}`}>{label}</span>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('battle');
  const [roster, setRoster] = useState(createInitialRoster);
  const [battle, setBattle] = useState<BattleSnapshot>(INITIAL_BATTLE);
  const [fusionSequenceKey, setFusionSequenceKey] = useState(0);
  const [fusionNotice, setFusionNotice] = useState<string | null>(null);
  const [fusionRun, setFusionRun] = useState<{ id: SlimeId; fromRank: number; toRank: number; title: string } | null>(null);

  const selected = roster.slimes[roster.selectedId];
  const definition = getSlimePresentation(selected);
  const nextFusion = useMemo(() => getNextFusionStep(selected), [selected]);
  const fusionReady = canFuse(selected);

  const selectSlime = (id: SlimeId) => {
    if (fusionRun) return;
    setRoster((current) => ({ ...current, selectedId: id }));
    setFusionNotice(null);
  };

  const handleFuse = () => {
    if (!nextFusion || !fusionReady || fusionRun) return;
    setFusionNotice(null);
    setFusionSequenceKey((value) => value + 1);
    setFusionRun({
      id: selected.id,
      fromRank: selected.fusionRank,
      toRank: selected.fusionRank + 1,
      title: nextFusion.title,
    });
  };

  const commitFusion = () => {
    if (!fusionRun) return;
    setRoster((current) => fuseSlime(current, fusionRun.id));
    setFusionNotice(fusionRun.title);
  };

  const finishFusion = () => {
    setFusionRun(null);
  };

  const enemyRatio = battle.enemyMaxHp > 0 ? battle.enemyHp / battle.enemyMaxHp : 0;
  const sword = roster.slimes.sword;
  const swordDefinition = getSlimePresentation(sword);

  return (
    <main className="page">
      <section className="game-shell" aria-label="Slime Mercenaries">
        <div className={`screen screen--battle ${screen !== 'battle' ? 'is-hidden' : ''}`} aria-hidden={screen !== 'battle'} inert={screen !== 'battle'}>
          <BattleCanvas swordFusionRank={sword.fusionRank} swordAsset={swordDefinition.asset} onSnapshot={setBattle} />

          <header className="hud hud--top">
            <div>
              <p className="eyebrow">CLOVER ROAD · AUTO BATTLE</p>
              <h1>Slime Mercenaries</h1>
            </div>
            <div className="status-chip" aria-label="battle status">
              <span className="status-dot" />
              AUTO
            </div>
          </header>

          <div className="enemy-hud" aria-label="enemy health">
            <div className="enemy-hud__row">
              <strong>Forest Mushrooms</strong>
              <span>{battle.enemyAlive}体 · {battle.enemyHp} / {battle.enemyMaxHp}</span>
            </div>
            <div className="enemy-hp-track">
              <div className="enemy-hp-fill" style={{ transform: `scaleX(${enemyRatio})` }} />
            </div>
          </div>

          <div className={`battle-message ${battle.result ? 'battle-message--result' : ''}`}>{battle.label}</div>

          <div className="battle-roster">
            <button className={`unit-card ${battle.swordHp <= 0 ? 'is-defeated' : ''}`} type="button" onClick={() => { selectSlime('sword'); setScreen('slimes'); }}>
              <div className="unit-icon unit-icon--sword"><img src={`${import.meta.env.BASE_URL}${SLIMES.sword.icon}`} alt="" aria-hidden="true" /></div>
              <div>
                <strong>{swordDefinition.name}</strong>
                <span>Fusion {sword.fusionRank}</span>
                <small className="unit-hp">HP {battle.swordHp} / {battle.swordMaxHp}</small>
              </div>
            </button>
            <button className={`unit-card ${battle.bowHp <= 0 ? 'is-defeated' : ''}`} type="button" onClick={() => { selectSlime('bow'); setScreen('slimes'); }}>
              <div className="unit-icon unit-icon--bow"><img src={`${import.meta.env.BASE_URL}${SLIMES.bow.icon}`} alt="" aria-hidden="true" /></div>
              <div>
                <strong>Bow Slime</strong>
                <span>Fusion {roster.slimes.bow.fusionRank}</span>
                <small className="unit-hp">HP {battle.bowHp} / {battle.bowMaxHp}</small>
              </div>
            </button>
          </div>
        </div>

        <div className={`screen screen--slimes ${screen !== 'slimes' ? 'is-hidden' : ''}`} aria-hidden={screen !== 'slimes'} inert={screen !== 'slimes'}>
          <header className="slimes-header">
            <div>
              <p className="eyebrow">MERCENARY ROSTER</p>
              <h1>Slimes</h1>
            </div>
            <span className="slimes-count">2 / 6</span>
          </header>

          <div className="formation-strip" aria-label="battle formation">
            {(['sword', 'bow'] as SlimeId[]).map((id) => {
              const slime = roster.slimes[id];
              const isSelected = roster.selectedId === id;
              const ready = canFuse(slime);
              const presentation = getSlimePresentation(slime);
              return (
                <button
                  className={`formation-slot ${isSelected ? 'is-selected' : ''}`}
                  key={id}
                  type="button"
                  onClick={() => selectSlime(id)}
                  aria-pressed={isSelected}
                >
                  <span className="formation-slot__icon"><img src={`${import.meta.env.BASE_URL}${SLIMES[id].icon}`} alt="" /></span>
                  <span className="formation-slot__name">{presentation.name.replace(' Slime', '')}</span>
                  {ready && <span className="ready-dot" aria-label="合成可能" />}
                </button>
              );
            })}
            {[0, 1, 2, 3].map((index) => <div className="formation-slot formation-slot--empty" key={`empty-${index}`}>＋</div>)}
          </div>

          <section className="slime-focus">
            <div className="slime-focus__meta">
              <div>
                <p className="slime-role">{definition.role}</p>
                <h2>{definition.name}</h2>
              </div>
              <AssignmentLabel value={selected.assignment} />
            </div>

            <SlimePreview
              slimeId={selected.id}
              fusionRank={selected.fusionRank}
              fusionReady={fusionReady}
              isFusing={Boolean(fusionRun && fusionRun.id === selected.id)}
              sequenceKey={fusionSequenceKey}
              fromRank={fusionRun?.fromRank ?? selected.fusionRank}
              toRank={fusionRun?.toRank ?? selected.fusionRank + 1}
              onFusionCommit={commitFusion}
              onFusionComplete={finishFusion}
            />

            <div className="slime-stats">
              <span>Lv.{selected.level}</span>
              <span>Tier {definition.tier}</span>
              <span>{selected.equippedWeapon}</span>
            </div>
          </section>

          <section className={`fusion-panel ${fusionReady ? 'is-ready' : ''}`}>
            <div className="fusion-panel__heading">
              <div>
                <p className="section-kicker">FUSION</p>
                <h3>合成段階 {selected.fusionRank}{nextFusion ? ` → ${selected.fusionRank + 1}` : ''}</h3>
              </div>
              {fusionReady && <span className="ready-pill">合成可能</span>}
            </div>

            {nextFusion ? (
              <>
                <div className="fusion-material">
                  <div className="fusion-material__label">
                    <span>同種スライム</span>
                    <strong>{selected.fusionProgress} / {nextFusion.requiredCopies}</strong>
                  </div>
                  <div className="fusion-track">
                    <div
                      className="fusion-track__fill"
                      style={{ transform: `scaleX(${Math.min(1, selected.fusionProgress / nextFusion.requiredCopies)})` }}
                    />
                  </div>
                </div>

                <div className="next-upgrade">
                  <span>次の強化 · Lv.{nextFusion.minLevel}以上</span>
                  <strong>{nextFusion.resultName ?? nextFusion.title}</strong>
                  <p>{nextFusion.description}</p>
                </div>

                {fusionNotice && (
                  <div className="fusion-unlocked" key={fusionSequenceKey}>
                    <span>UNLOCKED</span>
                    <strong>{fusionNotice}</strong>
                  </div>
                )}

                <button className="fusion-button" type="button" disabled={!fusionReady || Boolean(fusionRun)} onClick={handleFuse}>
                  {fusionRun ? '合成中…' : selected.level < nextFusion.minLevel ? `Lv.${nextFusion.minLevel}で解放` : fusionReady ? '合成する' : `あと ${Math.max(0, nextFusion.requiredCopies - selected.fusionProgress)} 体`}
                </button>
              </>
            ) : (
              <div className="fusion-max">
                <strong>現在の合成段階は上限です</strong>
                <span>今後の成長段階はバランス調整後に追加します。</span>
              </div>
            )}
          </section>
        </div>

        <nav className="bottom-nav" aria-label="primary navigation">
          <button className={screen === 'battle' ? 'is-active' : ''} type="button" onClick={() => setScreen('battle')}>
            <span className="nav-icon">⚔</span>
            Battle
          </button>
          <button className={screen === 'slimes' ? 'is-active' : ''} type="button" onClick={() => setScreen('slimes')}>
            <span className="nav-icon">●</span>
            Slimes
            {canFuse(roster.slimes.sword) && <span className="nav-notice" />}
          </button>
        </nav>
      </section>
    </main>
  );
}
