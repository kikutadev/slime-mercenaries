import { ids } from '../domain';

export type FusionIngredientRoute = 'recruit' | 'battle';
export type FusionIngredientKind = 'core' | 'weapon' | 'steel' | 'gel';
export type FusionCeremonyPreset = 'major-form' | 'enhancement' | 'major-behavior';

export type FusionIngredientPresentation = Readonly<{
  kind: FusionIngredientKind;
  asset: string;
  sourceLabel: string;
  route: FusionIngredientRoute;
}>;

export type FusionStepPresentation = Readonly<{
  behaviorTitle: string;
  ceremony: FusionCeremonyPreset;
}>;

const INGREDIENT_PRESENTATION: Readonly<Record<string, FusionIngredientPresentation>> = {
  [ids.token.swordCore]: {
    kind: 'core',
    asset: 'assets/fusion/core-sword.svg',
    sourceLabel: '剣士スライムをもう一度作る',
    route: 'recruit',
  },
  [ids.token.shieldCore]: {
    kind: 'core',
    asset: 'assets/fusion/core-shield.svg',
    sourceLabel: '盾兵スライムをもう一度作る',
    route: 'recruit',
  },
  [ids.token.bowCore]: {
    kind: 'core',
    asset: 'assets/fusion/core-bow.svg',
    sourceLabel: '弓士スライムをもう一度作る',
    route: 'recruit',
  },
  [ids.token.wandCore]: {
    kind: 'core',
    asset: 'assets/fusion/core-wand.svg',
    sourceLabel: '魔術師スライムをもう一度作る',
    route: 'recruit',
  },
  [ids.token.daggerCore]: {
    kind: 'core',
    asset: 'assets/fusion/core-dagger.svg',
    sourceLabel: '短剣スライムをもう一度作る',
    route: 'recruit',
  },
  [ids.token.gunCore]: {
    kind: 'core',
    asset: 'assets/fusion/core-gun.svg',
    sourceLabel: '銃士スライムをもう一度作る',
    route: 'recruit',
  },
  [ids.token.greatswordBlank]: {
    kind: 'weapon',
    asset: 'assets/fusion/greatsword-blank.svg',
    sourceLabel: 'クローバー街道 ステージ2',
    route: 'battle',
  },
  [ids.token.reinforcedBow]: {
    kind: 'weapon',
    asset: 'assets/fusion/reinforced-bow.svg',
    sourceLabel: 'クローバー街道 ステージ4',
    route: 'battle',
  },
  [ids.token.temperedSteel]: {
    kind: 'steel',
    asset: 'assets/fusion/tempered-steel.svg',
    sourceLabel: 'クローバー街道 後半ステージ',
    route: 'battle',
  },
  [ids.token.hardeningGel]: {
    kind: 'gel',
    asset: 'assets/fusion/hardening-gel.svg',
    sourceLabel: '戦闘ドロップ',
    route: 'battle',
  },
};

const STEP_PRESENTATION: Readonly<Record<string, FusionStepPresentation>> = {
  'fusion.sword.01-greatsword': { behaviorTitle: '横薙ぎ範囲攻撃', ceremony: 'major-form' },
  'fusion.sword.02-fighter': { behaviorTitle: '戦士連撃', ceremony: 'major-form' },
  'fusion.sword.03-blademaster': { behaviorTitle: '抜け斬り', ceremony: 'major-behavior' },
  'fusion.sword.03-berserker': { behaviorTitle: '狂戦士叩きつけ', ceremony: 'major-behavior' },
  'fusion.shield.01-fortified-guard': { behaviorTitle: '堅守強化', ceremony: 'enhancement' },
  'fusion.shield.02-guardian': { behaviorTitle: 'ガーディアン防御', ceremony: 'major-form' },
  'fusion.shield.03-paladin': { behaviorTitle: '聖域守護', ceremony: 'major-behavior' },
  'fusion.shield.03-fortress': { behaviorTitle: '要塞押し潰し', ceremony: 'major-behavior' },
  'fusion.bow.01-rapid-shot': { behaviorTitle: '追撃射撃', ceremony: 'major-form' },
  'fusion.bow.02-ranger': { behaviorTitle: '機動連射', ceremony: 'major-form' },
  'fusion.bow.03-sniper': { behaviorTitle: '高速貫通矢', ceremony: 'major-behavior' },
  'fusion.bow.03-storm-archer': { behaviorTitle: '帯電連鎖矢', ceremony: 'major-behavior' },
  'fusion.wand.01-arcane-focus': { behaviorTitle: '魔力収束', ceremony: 'enhancement' },
  'fusion.wand.02-mage': { behaviorTitle: '範囲魔法', ceremony: 'major-form' },
  'fusion.wand.03-archmage': { behaviorTitle: '巨大魔法陣', ceremony: 'major-behavior' },
  'fusion.wand.03-frost-mage': { behaviorTitle: '氷結制御', ceremony: 'major-behavior' },
  'fusion.dagger.01-afterimage-edge': { behaviorTitle: '残影強化', ceremony: 'enhancement' },
  'fusion.dagger.02-rogue': { behaviorTitle: '双短剣連撃', ceremony: 'major-form' },
  'fusion.dagger.03-ninja': { behaviorTitle: '分身多段斬り', ceremony: 'major-behavior' },
  'fusion.dagger.03-assassin': { behaviorTitle: '背後刺突', ceremony: 'major-behavior' },
  'fusion.gun.01-overpressure': { behaviorTitle: '高圧射撃', ceremony: 'enhancement' },
  'fusion.gun.02-gunner': { behaviorTitle: '高速連射', ceremony: 'major-form' },
  'fusion.gun.03-cannoneer': { behaviorTitle: '巨大砲撃', ceremony: 'major-behavior' },
  'fusion.gun.03-engineer': { behaviorTitle: 'タレット展開', ceremony: 'major-behavior' },
};

/** Presentation-only metadata for fusion ingredients. Balance quantities remain in Domain definitions. */
export function getFusionIngredientPresentation(tokenId: string): FusionIngredientPresentation {
  const presentation = INGREDIENT_PRESENTATION[tokenId];
  if (presentation === undefined) throw new Error(`Missing fusion ingredient presentation metadata: ${tokenId}`);
  return presentation;
}

/** Authored ceremony/behavior copy for a released Fusion step. */
export function getFusionStepPresentation(stepId: string): FusionStepPresentation {
  const presentation = STEP_PRESENTATION[stepId];
  if (presentation === undefined) throw new Error(`Missing fusion step presentation metadata: ${stepId}`);
  return presentation;
}
