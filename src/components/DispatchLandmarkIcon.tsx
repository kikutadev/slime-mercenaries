import type { DispatchRoutePresentation } from '../game/dispatch-presentation';

export function DispatchLandmarkIcon({ kind }: { kind: DispatchRoutePresentation['landmark'] }) {
  if (kind === 'road') {
    return (
      <svg className="dispatch-landmark-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 20V5M6 6h10l-2.1 3 2.1 3H6" />
        <path d="M4 20h5" />
      </svg>
    );
  }
  if (kind === 'forest') {
    return (
      <svg className="dispatch-landmark-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l4 6h-2.2l3.4 5.5H6.8L10.2 9H8z" />
        <path d="M12 14.5V21M9.5 21h5" />
      </svg>
    );
  }
  return (
    <svg className="dispatch-landmark-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 17l3.5-8L12 13l3-9 4 13z" />
      <path d="M4 20h16" />
      <path d="M14.5 11.5l2 2M16.5 11.5l-2 2" />
    </svg>
  );
}

export function DispatchHomeIcon() {
  return (
    <svg className="dispatch-home-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 18h14M7 18l5-10 5 10M10 18l2-4 2 4" />
    </svg>
  );
}
