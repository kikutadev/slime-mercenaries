type NavIconKind = 'battle' | 'camp' | 'dispatch' | 'forge';

export function NavIcon({ kind }: { kind: NavIconKind }) {
  if (kind === 'battle') {
    return (
      <svg className="nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4l10 10M17 4L7 14M5.5 16.5l2 2M18.5 16.5l-2 2" />
        <path d="M6.2 3.5l2.1 1.1-1 2.2-2.2-1zM17.8 3.5l-2.1 1.1 1 2.2 2.2-1z" />
      </svg>
    );
  }
  if (kind === 'camp') {
    return (
      <svg className="nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18h16M6 18l6-11 6 11M9.4 18l2.6-5 2.6 5" />
        <path d="M16.5 8.2l2.4-1.6M17.4 11h2.8" />
      </svg>
    );
  }
  if (kind === 'dispatch') {
    return (
      <svg className="nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 18.5c3.1-1.7 4.2-4.2 5-7.5 1-4.1 4.2-5.7 8.5-5.5" />
        <path d="M15.8 3.8l3 1.6-1.8 2.9M5 15.5v3h3" />
        <circle cx="10.8" cy="10.4" r="1.3" />
      </svg>
    );
  }
  return (
    <svg className="nav-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 18.5h14M8 15.5h8l1.5-3H6.5z" />
      <path d="M12 4v5M9.5 6.5h5" />
      <path d="M7 9.5l1.5 3M17 9.5l-1.5 3" />
    </svg>
  );
}

export type { NavIconKind };
