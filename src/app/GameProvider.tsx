import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DomainEvent } from 'idle-game-kit';
import { useApplicationStore } from 'idle-game-kit/react';
import { SlimeGameController } from '../application/game-controller';
import type { SlimeMercenariesState } from '../domain';

export type GameBootstrapState =
  | Readonly<{ status: 'loading'; offlineSec: 0; offlineEvents: readonly []; error: null }>
  | Readonly<{ status: 'ready'; offlineSec: number; offlineEvents: readonly DomainEvent[]; error: Error | null }>
  | Readonly<{ status: 'error'; offlineSec: 0; offlineEvents: readonly []; error: Error }>;

type GameContextValue = Readonly<{
  controller: SlimeGameController;
  bootstrap: GameBootstrapState;
}>;

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const controller = useMemo(() => new SlimeGameController(), []);
  const [bootstrap, setBootstrap] = useState<GameBootstrapState>({
    status: 'loading',
    offlineSec: 0,
    offlineEvents: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const unsubscribeError = controller.subscribeErrors((error) => {
      if (!cancelled) {
        setBootstrap((current) => current.status === 'ready'
          ? { ...current, error }
          : { status: 'error', offlineSec: 0, offlineEvents: [], error });
      }
    });

    void controller.initialize().then((loaded) => {
      if (cancelled) return;
      setBootstrap({ status: 'ready', offlineSec: loaded.appliedOfflineSec, offlineEvents: loaded.offlineEvents, error: null });
    }).catch((cause: unknown) => {
      if (cancelled) return;
      const error = cause instanceof Error ? cause : new Error(String(cause));
      setBootstrap({ status: 'error', offlineSec: 0, offlineEvents: [], error });
    });

    return () => {
      cancelled = true;
      unsubscribeError();
    };
  }, [controller]);

  useEffect(() => {
    if (bootstrap.status !== 'ready') return undefined;

    let suspended = document.visibilityState === 'hidden';

    const advanceVisibleTime = (nowMs = Date.now()) => {
      controller.advanceToWallClock(nowMs);
    };
    const advanceBackgroundTime = (nowMs = Date.now()) => {
      controller.advanceToWallClock(nowMs, {
        combatPolicy: { allowFrontierFirstClear: false },
        source: 'background',
      });
    };
    const checkpoint = () => {
      void controller.checkpointNow();
    };
    const suspend = () => {
      if (suspended) {
        checkpoint();
        return;
      }
      // Account for the final visible slice once, then freeze live ticking. Any time after this
      // point is resolved with the same policy as a cold offline resume.
      advanceVisibleTime();
      suspended = true;
      checkpoint();
    };
    const resume = () => {
      if (!suspended) return;
      advanceBackgroundTime();
      suspended = false;
      checkpoint();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') suspend();
      else resume();
    };
    const onPageHide = () => suspend();
    const onPageShow = () => {
      if (document.visibilityState === 'visible') resume();
    };

    const intervalId = window.setInterval(() => {
      if (!suspended && document.visibilityState === 'visible') advanceVisibleTime();
    }, 1_000);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      if (!suspended) advanceVisibleTime();
      checkpoint();
    };
  }, [bootstrap.status, controller]);

  return <GameContext.Provider value={{ controller, bootstrap }}>{children}</GameContext.Provider>;
}

export function useGameController(): SlimeGameController {
  const context = useContext(GameContext);
  if (context === null) throw new Error('useGameController must be used within GameProvider.');
  return context.controller;
}

export function useGameBootstrap(): GameBootstrapState {
  const context = useContext(GameContext);
  if (context === null) throw new Error('useGameBootstrap must be used within GameProvider.');
  return context.bootstrap;
}

export function useGameState(): SlimeMercenariesState {
  const controller = useGameController();
  return useApplicationStore(controller.store);
}
