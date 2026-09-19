import { useEffect, useMemo, useState } from 'react';
import { slimeGalleryCatalog } from './catalog';
import { GalleryStage } from './GalleryStage';
import type { GalleryCameraId, GalleryMotionId } from './types';

const MOTION_LABELS: Record<GalleryMotionId, string> = {
  idle: 'Idle',
  move: 'Move',
  attack: 'Attack',
  hit: 'Hit',
  defeat: 'Defeat',
};

const MOTIONS: readonly GalleryMotionId[] = ['idle', 'move', 'attack', 'hit', 'defeat'];
const CAMERAS: readonly GalleryCameraId[] = ['inspection', 'gameplay', 'front'];
const SPEEDS = [0.5, 1, 2] as const;

function params(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function initialSlimeId(): string {
  const requested = params().get('slime');
  if (requested && slimeGalleryCatalog.some((item) => item.id === requested)) return requested;
  return slimeGalleryCatalog[0]?.id ?? '';
}

function initialMotion(): GalleryMotionId {
  const requested = new URLSearchParams(window.location.search).get('motion');
  if (requested && ['idle', 'move', 'attack', 'hit', 'defeat'].includes(requested)) {
    return requested as GalleryMotionId;
  }
  return 'idle';
}

function initialSpeed(): (typeof SPEEDS)[number] {
  const requested = Number(new URLSearchParams(window.location.search).get('speed'));
  return SPEEDS.includes(requested as (typeof SPEEDS)[number])
    ? requested as (typeof SPEEDS)[number]
    : 1;
}

function initialCameraMode(): GalleryCameraId {
  const requested = new URLSearchParams(window.location.search).get('camera');
  if (requested === 'inspection' || requested === 'gameplay' || requested === 'front') return requested;
  return 'inspection';
}

export default function GalleryApp() {
  const [selectedId, setSelectedId] = useState(initialSlimeId);
  const selected = useMemo(
    () => slimeGalleryCatalog.find((item) => item.id === selectedId) ?? slimeGalleryCatalog[0],
    [selectedId],
  );
  const [motion, setMotion] = useState<GalleryMotionId>(initialMotion);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(initialSpeed);
  const [loop, setLoop] = useState(true);
  const [cameraMode, setCameraMode] = useState<GalleryCameraId>(initialCameraMode);
  const [showDummy, setShowDummy] = useState(true);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    if (!selected) return;
    const params = new URLSearchParams(window.location.search);
    params.set('slime', selected.id);
    params.set('motion', motion);
    params.set('speed', String(speed));
    params.set('camera', cameraMode);
    window.history.replaceState(null, '', window.location.pathname + '?' + params.toString());
    if (!selected.availableMotions.includes(motion)) setMotion('idle');
    setReplayKey((value) => value + 1);
  }, [cameraMode, motion, selected, speed]);

  if (!selected) {
    return <main className="gallery-empty">No gallery definitions are registered.</main>;
  }

  const selectMotion = (next: GalleryMotionId) => {
    setMotion(next);
    setReplayKey((value) => value + 1);
  };

  return (
    <main className="gallery-shell">
      <header className="gallery-header">
        <div>
          <a className="gallery-kicker" href={import.meta.env.BASE_URL}>SLIME MERCENARIES</a>
          <h1>Model & Motion Gallery</h1>
          <p>本番と同じモデルと、実装済みのproductionモーション・VFXをそのまま確認するgallery。</p>
        </div>
        <div className="gallery-header__meta">
          <span>{slimeGalleryCatalog.length} MODELS</span>
          <span>BUILD VIEW</span>
        </div>
      </header>

      <section className="gallery-layout">
        <aside className="gallery-roster" aria-label="Published models">
          <div className="gallery-roster__heading">
            <span>ROSTER</span>
            <strong>Published models</strong>
          </div>
          <div className="gallery-roster__list">
            {slimeGalleryCatalog.map((item) => (
              <button
                className={`gallery-roster__item ${item.id === selected.id ? 'is-active' : ''}`}
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
              >
                <span className="gallery-roster__orb" style={{ '--accent': item.accent } as React.CSSProperties} />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.classification}</small>
                </span>
                <i>{item.implementationStatus === 'implemented' ? 'LIVE' : item.implementationStatus === 'model' ? 'MODEL' : 'PLAN'}</i>
              </button>
            ))}
          </div>
        </aside>

        <section className="gallery-workbench">
          <div className="gallery-model-title">
            <div>
              <span>{selected.classification}</span>
              <h2>{selected.name}</h2>
              <p>{selected.role}</p>
            </div>
            {selected.signatureLabel && <strong className="gallery-signature">{selected.signatureLabel}</strong>}
          </div>

          <GalleryStage
            definition={selected}
            motion={motion}
            speed={speed}
            loop={loop}
            cameraMode={cameraMode}
            showDummy={showDummy}
            replayKey={replayKey}
          />

          <div className="gallery-controls">
            <div className="gallery-control-group gallery-control-group--motions">
              <span className="gallery-control-label">MOTION</span>
              <div className="gallery-chip-row">
                {selected.availableMotions.map((id) => (
                  <button
                    className={motion === id ? 'is-active' : ''}
                    key={id}
                    type="button"
                    onClick={() => selectMotion(id)}
                  >
                    {MOTION_LABELS[id]}
                  </button>
                ))}
              </div>
            </div>

            <div className="gallery-control-grid">
              <div className="gallery-control-group">
                <span className="gallery-control-label">SPEED</span>
                <div className="gallery-chip-row">
                  {SPEEDS.map((value) => (
                    <button className={speed === value ? 'is-active' : ''} key={value} type="button" onClick={() => setSpeed(value)}>
                      {value}×
                    </button>
                  ))}
                </div>
              </div>

              <div className="gallery-control-group">
                <span className="gallery-control-label">CAMERA</span>
                <div className="gallery-chip-row">
                  <button className={cameraMode === 'inspection' ? 'is-active' : ''} type="button" onClick={() => setCameraMode('inspection')}>3/4 Inspect</button>
                  <button className={cameraMode === 'gameplay' ? 'is-active' : ''} type="button" onClick={() => setCameraMode('gameplay')}>Battle</button>
                  <button className={cameraMode === 'front' ? 'is-active' : ''} type="button" onClick={() => setCameraMode('front')}>Front</button>
                </div>
              </div>

              <div className="gallery-control-group">
                <span className="gallery-control-label">PLAYBACK</span>
                <div className="gallery-chip-row">
                  <button className={loop ? 'is-active' : ''} type="button" onClick={() => setLoop((value) => !value)}>Loop</button>
                  {selected.availableMotions.includes('attack') && (
                    <button className={showDummy ? 'is-active' : ''} type="button" onClick={() => setShowDummy((value) => !value)}>Dummy</button>
                  )}
                  <button type="button" onClick={() => setReplayKey((value) => value + 1)}>Replay</button>
                </div>
              </div>
            </div>
          </div>

          <div className="gallery-notes">
            <span>DESIGN NOTE</span>
            <p>{selected.notes}</p>
            <small>Asset: {selected.asset}</small>
          </div>
        </section>
      </section>
    </main>
  );
}
