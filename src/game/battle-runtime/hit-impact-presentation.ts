/** Bounded display-only hit treatment: larger authored blows read stronger without changing damage. */
export function hitImpactPresentation(
  side: 'ally' | 'enemy',
  source: 'melee' | 'projectile' | 'enemy',
  amount: number,
): Readonly<{ color: string; size: number; duration: number }> {
  if (side === 'ally') {
    return { color: '#ffb4a8', size: 0.095, duration: 0.27 };
  }
  const strength = Math.max(0, Math.min(4, Number.isFinite(amount) ? amount : 1));
  const size = Math.min(0.18, 0.087 + strength * 0.018);
  return {
    color: source === 'projectile' ? '#b7eaff' : '#fff0a0',
    size,
    duration: 0.23 + strength * 0.023,
  };
}
