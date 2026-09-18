import type { AllyUnit } from './types';
import {
  type AllyCombatFamilyOptions,
  AllyCombatFamily,
} from './ally-combat-family';
import { SwordCombatFamily } from './ally-sword-combat';
import { BowCombatFamily } from './ally-bow-combat';
import { DefenseCombatFamily } from './ally-defense-combat';
import { MagicCombatFamily } from './ally-magic-combat';
import { RogueCombatFamily } from './ally-rogue-combat';
import { GunCombatFamily } from './ally-gun-combat';

export type BattleAllyCombatSystemOptions = AllyCombatFamilyOptions;

export class BattleAllyCombatSystem {
  private readonly families: readonly AllyCombatFamily[];

  constructor(options: BattleAllyCombatSystemOptions) {
    this.families = [
      new SwordCombatFamily(options),
      new BowCombatFamily(options),
      new DefenseCombatFamily(options),
      new MagicCombatFamily(options),
      new RogueCombatFamily(options),
      new GunCombatFamily(options),
    ];
  }

  update(allies: readonly AllyUnit[], now: number): void {
    for (const ally of allies) {
      const handled = this.families.some((family) => family.update(ally, now));
      if (!handled) {
        throw new Error('No battle presentation family for behavior: ' + ally.behaviorId);
      }
    }
  }
}
