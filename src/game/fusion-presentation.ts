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
  'fusion.sword.02-heavy-impact': { behaviorTitle: '重撃インパクト', ceremony: 'enhancement' },
  'fusion.sword.03-whirlwind': { behaviorTitle: '旋風斬り', ceremony: 'major-behavior' },
  'fusion.shield.01-fortified-guard': { behaviorTitle: '堅守強化', ceremony: 'enhancement' },
  'fusion.bow.01-rapid-shot': { behaviorTitle: '追撃射撃', ceremony: 'major-form' },
  'fusion.bow.02-piercing-shot': { behaviorTitle: '貫通射撃', ceremony: 'enhancement' },
  'fusion.bow.03-triple-shot': { behaviorTitle: '三連射', ceremony: 'major-behavior' },
  'fusion.wand.01-arcane-focus': { behaviorTitle: '魔力収束', ceremony: 'enhancement' },
  'fusion.dagger.01-afterimage-edge': { behaviorTitle: '残影強化', ceremony: 'enhancement' },
  'fusion.gun.01-overpressure': { behaviorTitle: '高圧射撃', ceremony: 'enhancement' },
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
