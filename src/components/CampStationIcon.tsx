export type CampStationIconKind = 'train' | 'fusion' | 'nursery' | 'formation';

export function CampStationIcon({ kind }: { kind: CampStationIconKind }) {
  if (kind === 'train') {
    return (
      <svg className="camp-station-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="10" r="5" />
        <circle cx="12" cy="10" r="2" />
        <path d="M12 3v2M12 15v6M7 21h10" />
      </svg>
    );
  }
  if (kind === 'fusion') {
    return (
      <svg className="camp-station-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l2.2 5.1L19 10l-4.8 2L12 17l-2.2-5L5 10l4.8-1.9z" />
        <circle cx="12" cy="10" r="8.5" />
      </svg>
    );
  }
  if (kind === 'nursery') {
    return (
      <svg className="camp-station-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 8h10l-1 10H8zM6 8h12" />
        <path d="M10 5.5c.8-1.4 3.2-1.4 4 0" />
        <circle cx="12" cy="13" r="2.2" />
      </svg>
    );
  }
  return (
    <svg className="camp-station-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 21V4M8 5h9l-2 4 2 4H8" />
      <path d="M4 21h7" />
    </svg>
  );
}
