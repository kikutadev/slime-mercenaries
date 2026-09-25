import {
  equipmentForgeDefinition,
  weaponDefinitionsByDefinitionId,
} from '../../domain';

export interface ForgeResultView {
  weaponDefinitionId: string;
  duplicate: boolean;
  rarity: string;
}

interface ForgeEventLike {
  type: string;
  payload?: unknown;
}

export function forgeRarityRank(rarity: string): number {
  switch (rarity) {
    case 'mythic': return 3;
    case 'rare': return 2;
    default: return 1;
  }
}

export function forgeRarityLabel(rarity: string): string {
  switch (rarity) {
    case 'mythic': return '神話';
    case 'rare': return '希少';
    default: return '一般';
  }
}

export function parseForgeDrawEvents(events: readonly ForgeEventLike[]): readonly ForgeResultView[] {
  return events.flatMap((event) => {
    if (event.type !== 'gachaDrawn' || event.payload === undefined || event.payload === null) return [];
    if (typeof event.payload !== 'object') return [];

    const payload = event.payload as Record<string, unknown>;
    const entryId = typeof payload.entryId === 'string' ? payload.entryId : null;
    if (entryId === null) return [];

    const entry = equipmentForgeDefinition.pool.find((candidate) => candidate.id === entryId);
    if (entry === undefined) return [];

    const weapon = weaponDefinitionsByDefinitionId[entry.reward.weaponDefinitionId];
    if (weapon === undefined) return [];

    return [{
      weaponDefinitionId: weapon.id,
      duplicate: payload.duplicate === true,
      rarity: weapon.rarity,
    }];
  });
}

export function strongestForgeResult(results: readonly ForgeResultView[]): ForgeResultView | null {
  return [...results]
    .sort((left, right) => forgeRarityRank(right.rarity) - forgeRarityRank(left.rarity))[0]
    ?? null;
}

export function forgeResultNotice(
  result: ForgeResultView,
  equipLabel: string | null,
): string {
  const weapon = weaponDefinitionsByDefinitionId[result.weaponDefinitionId];
  if (result.duplicate) return `${weapon.displayName} · 精錬 +1`;
  if (equipLabel === null) return `${weapon.displayName} を獲得`;
  return `${weapon.displayName} を獲得 · ${equipLabel}`;
}
