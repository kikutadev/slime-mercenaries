import type { BattleBehaviorId } from '../slimes';
import type { AllyUnit } from './types';
import type { BattleAllyCombatDependencies } from './ally-combat-deps';
import { SwordCombatFamily } from './ally-combat-sword';
import { BowCombatFamily } from './ally-combat-bow';
import { DefenseCombatFamily } from './ally-combat-defense';
import { MagicCombatFamily } from './ally-combat-magic';
import { RogueCombatFamily } from './ally-combat-rogue';
import { GunCombatFamily } from './ally-combat-gun';

export class BattleAllyCombatSystem {
  private readonly sword: SwordCombatFamily;
  private readonly bow: BowCombatFamily;
  private readonly defense: DefenseCombatFamily;
  private readonly magic: MagicCombatFamily;
  private readonly rogue: RogueCombatFamily;
  private readonly gun: GunCombatFamily;

  private readonly handlers: Readonly<Record<BattleBehaviorId, (now: number, ally: AllyUnit) => void>> = {
    'sword-melee': (now, ally) => this.sword.updateSword(now, ally),
    'fighter-combo': (now, ally) => this.sword.updateFighter(now, ally),
    'blademaster-dash': (now, ally) => this.sword.updateBlademaster(now, ally),
    'berserker-heavy': (now, ally) => this.sword.updateBerserker(now, ally),
    'bow-ranged': (now, ally) => this.bow.updateBow(now, ally),
    'ranger-double-shot': (now, ally) => this.bow.updateRanger(now, ally),
    'sniper-pierce': (now, ally) => this.bow.updateSniper(now, ally),
    'storm-archer-volley': (now, ally) => this.bow.updateStormArcher(now, ally),
    'shield-defender': (now, ally) => this.defense.updateShield(now, ally),
    'guardian-guard': (now, ally) => this.defense.updateGuardian(now, ally),
    'paladin-barrier': (now, ally) => this.defense.updatePaladin(now, ally),
    'fortress-plant': (now, ally) => this.defense.updateFortress(now, ally),
    'wand-magic': (now, ally) => this.magic.updateWand(now, ally),
    'mage-aoe': (now, ally) => this.magic.updateMage(now, ally),
    'archmage-burst': (now, ally) => this.magic.updateArchmage(now, ally),
    'frost-mage-control': (now, ally) => this.magic.updateFrostMage(now, ally),
    'dagger-skirmisher': (now, ally) => this.rogue.updateDagger(now, ally),
    'rogue-twin-strike': (now, ally) => this.rogue.updateRogue(now, ally),
    'ninja-vanish': (now, ally) => this.rogue.updateNinja(now, ally),
    'assassin-execute': (now, ally) => this.rogue.updateAssassin(now, ally),
    'gun-ranged': (now, ally) => this.gun.updateGun(now, ally),
    'gunner-burst': (now, ally) => this.gun.updateGunner(now, ally),
    'cannoneer-shell': (now, ally) => this.gun.updateCannoneer(now, ally),
    'engineer-turret': (now, ally) => this.gun.updateEngineer(now, ally),
  };

  constructor(deps: BattleAllyCombatDependencies) {
    this.sword = new SwordCombatFamily(deps);
    this.bow = new BowCombatFamily(deps);
    this.defense = new DefenseCombatFamily(deps);
    this.magic = new MagicCombatFamily(deps);
    this.rogue = new RogueCombatFamily(deps);
    this.gun = new GunCombatFamily(deps);
  }

  initializePresentationVfx(): void {
    this.sword.initializePresentationVfx();
  }

  update(now: number, ally: AllyUnit): void {
    this.handlers[ally.behaviorId](now, ally);
  }

  resetTransientVfx(): void {
    this.sword.resetTransientVfx();
  }
}
