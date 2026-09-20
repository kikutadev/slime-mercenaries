import { useCallback, useEffect, useRef } from 'react';

export type ManagedTimeout = number;

export function useManagedTimeouts() {
  const timersRef = useRef<Set<ManagedTimeout>>(new Set());

  const clear = useCallback((timer: ManagedTimeout | null | undefined) => {
    if (timer == null) return;
    window.clearTimeout(timer);
    timersRef.current.delete(timer);
  }, []);

  const schedule = useCallback((callback: () => void, delayMs: number): ManagedTimeout => {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delayMs);
    timersRef.current.add(timer);
    return timer;
  }, []);

  const clearAll = useCallback(() => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current.clear();
  }, []);

  useEffect(() => clearAll, [clearAll]);

  return { schedule, clear, clearAll } as const;
}
