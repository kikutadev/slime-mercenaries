import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

import {
  ENVIRONMENT_AREA_IDS,
  createStageEnvironment,
  getEnvironmentAreaMetadata,
  type EnvironmentAreaId,
} from '../game/stage-environment';

function areaFromUrl(): EnvironmentAreaId {
  if (typeof window === 'undefined') return 'area.clover-road';
  const value = new URLSearchParams(window.location.search).get('area');
  if (value === null) return 'area.clover-road';
  const direct = ENVIRONMENT_AREA_IDS.find((areaId) => areaId === value);
  if (direct !== undefined) return direct;
  const bySlug = ENVIRONMENT_AREA_IDS.find((areaId) => getEnvironmentAreaMetadata(areaId)?.slug === value);
  return bySlug ?? 'area.clover-road';
}

function stageFromUrl(): number {
  if (typeof window === 'undefined') return 1;
  const value = Number(new URLSearchParams(window.location.search).get('stage'));
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.floor(value)));
}

function EnvironmentScene({ areaId, stage }: { areaId: EnvironmentAreaId; stage: number }) {
  const { scene, camera, gl } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;

    camera.position.set(2.8, 5.35, 8.9);
    camera.fov = 31;
    camera.near = 0.1;
    camera.far = 50;
    camera.lookAt(0, 0.38, -1.05);
    camera.updateProjectionMatrix();

    const metadata = getEnvironmentAreaMetadata(areaId)!;
    document.documentElement.dataset.environmentLoaded = 'loading';
    let active = true;
    let dispose: (() => void) | null = null;
    void createStageEnvironment(scene, import.meta.env.BASE_URL, areaId, stage, 0).then((environment) => {
      if (!active) {
        environment.dispose();
        return;
      }
      environment.activate();
      dispose = environment.dispose;
      document.documentElement.dataset.environmentLoaded = metadata.slug + ':' + stage;
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      document.documentElement.dataset.environmentLoaded = 'error:' + message;
      console.error('Environment gallery failed to load:', message);
    });

    return () => {
      active = false;
      dispose?.();
      delete document.documentElement.dataset.environmentLoaded;
    };
  }, [areaId, camera, gl, scene, stage]);

  return null;
}

export function EnvironmentGalleryApp() {
  const [areaId, setAreaId] = useState<EnvironmentAreaId>(areaFromUrl);
  const [stage, setStage] = useState(stageFromUrl);
  const metadata = useMemo(() => getEnvironmentAreaMetadata(areaId)!, [areaId]);
  const stageLabel = metadata.stageNames[stage - 1]!;

  const updateUrl = (nextAreaId: EnvironmentAreaId, nextStage: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('area', getEnvironmentAreaMetadata(nextAreaId)!.slug);
    url.searchParams.set('stage', String(nextStage));
    window.history.replaceState(null, '', url);
  };

  const chooseArea = (nextAreaId: EnvironmentAreaId) => {
    setAreaId(nextAreaId);
    setStage(1);
    updateUrl(nextAreaId, 1);
  };

  const chooseStage = (next: number) => {
    setStage(next);
    updateUrl(areaId, next);
  };

  return (
    <main className="environment-gallery">
      <header className="environment-gallery__hud">
        <div className="environment-gallery__title">
          <small>STAGE ENVIRONMENT</small>
          <strong>{metadata.name}</strong>
          <span>Stage {stage} — {stageLabel}</span>
        </div>
        <div className="environment-gallery__controls">
          <label>
            <span className="sr-only">エリア</span>
            <select value={areaId} onChange={(event) => chooseArea(event.target.value as EnvironmentAreaId)}>
              {ENVIRONMENT_AREA_IDS.map((id, index) => (
                <option key={id} value={id}>{index + 1}. {getEnvironmentAreaMetadata(id)!.name}</option>
              ))}
            </select>
          </label>
          <nav aria-label="ステージ切り替え">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={value === stage ? 'is-active' : undefined}
                onClick={() => chooseStage(value)}
              >
                {value}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <section className="environment-gallery__stage" data-area={metadata.slug} data-stage={stage}>
        <Canvas
          camera={{ fov: 31, near: 0.1, far: 50, position: [2.8, 5.35, 8.9] }}
          dpr={[1, 2]}
          shadows
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          <EnvironmentScene areaId={areaId} stage={stage} />
        </Canvas>
      </section>
    </main>
  );
}
