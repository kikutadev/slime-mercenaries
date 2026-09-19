export type NurseryIconKind = 'craft' | 'shop' | 'gel' | 'water';

export function NurseryIcon({ kind, className = '' }: { kind: NurseryIconKind; className?: string }) {
  const classes = ['nursery-icon', className].filter(Boolean).join(' ');
  if (kind === 'craft') {
    return (
      <svg className={classes} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 3h6M10 3v5l-4.4 7.4A3.6 3.6 0 0 0 8.7 21h6.6a3.6 3.6 0 0 0 3.1-5.6L14 8V3" />
        <path d="M7.6 14h8.8M9.5 17.2h.1M13 15.8h.1" />
      </svg>
    );
  }
  if (kind === 'shop') {
    return (
      <svg className={classes} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 8.5c.6-3.2 2.2-5 5-5s4.4 1.8 5 5" />
        <path d="M5 9h14l1 11H4z" />
        <circle cx="12" cy="14.5" r="2.5" />
        <path d="M12 13v3" />
      </svg>
    );
  }
  if (kind === 'water') {
    return (
      <svg className={classes} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.8S6.6 9 6.6 14a5.4 5.4 0 1 0 10.8 0C17.4 9 12 2.8 12 2.8Z" />
        <path d="M9.6 15.3c.5 1.2 1.4 1.8 2.7 1.8" />
      </svg>
    );
  }
  return (
    <svg className={classes} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 14.5c0-4.5 3-8.2 7.5-8.2s7.5 3.7 7.5 8.2c0 4-3.1 6.5-7.5 6.5s-7.5-2.5-7.5-6.5Z" />
      <circle cx="9" cy="14" r="1.1" />
      <circle cx="15" cy="14" r="1.1" />
      <path d="M10.5 17c1 .7 2 .7 3 0" />
    </svg>
  );
}
