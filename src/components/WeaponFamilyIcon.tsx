import type { WeaponFamily } from '../domain';

export function WeaponFamilyIcon({ family }: { family: WeaponFamily }) {
  if (family === 'sword') {
    return (
      <svg className="weapon-family-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 18L17.5 6.5M14.5 4.5l5 5M5 15l4 4M4 20l3-1-2-2z" />
      </svg>
    );
  }
  if (family === 'shield') {
    return (
      <svg className="weapon-family-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.5-2.8 7.6-7 10-4.2-2.4-7-5.5-7-10V6z" />
        <path d="M12 7v9" />
      </svg>
    );
  }
  if (family === 'bow') {
    return (
      <svg className="weapon-family-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3c7 4 7 14 0 18M7 3l5 9-5 9M5 12h14M16 9l3 3-3 3" />
      </svg>
    );
  }
  if (family === 'wand') {
    return (
      <svg className="weapon-family-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 20L16 7M17 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
        <path d="M6 15l3 2" />
      </svg>
    );
  }
  if (family === 'dagger') {
    return (
      <svg className="weapon-family-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 18l8-11 2 2-8 11M5 16l4 4M15 5l4 4" />
        <path d="M17 18l-4-5" />
      </svg>
    );
  }
  return (
    <svg className="weapon-family-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9h11l4 3-4 3H4zM8 15l-1 5h4l2-5M15 9V6h3" />
    </svg>
  );
}

export function ForgeKeyIcon() {
  return (
    <svg className="forge-key-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l5 5-5 10-5-10z" />
      <path d="M9.5 8h5M10.5 12h3" />
    </svg>
  );
}
