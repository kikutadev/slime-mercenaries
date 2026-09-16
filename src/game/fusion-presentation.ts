import { ids } from '../domain';

export type FusionIngredientRoute = 'recruit' | 'battle';
export type FusionIngredientKind = 'core' | 'weapon' | 'steel' | 'gel';

export type FusionIngredientPresentation = Readonly<{
  kind: FusionIngredientKind;
  asset: string;
  sourceLabel: string;
  route: FusionIngredientRoute;
}>;

const PRESENTATION: Readonly<Record<string, FusionIngredientPresentation>> = {
  [ids.token.swordCore]: {
    kind: 'core',
    asset: 'assets/fusion/core-sword.svg',
    sourceLabel: '同じSword職を再作成',
    route: 'recruit',
  },
  [ids.token.bowCore]: {
    kind: 'core',
    asset: 'assets/fusion/core-bow.svg',
    sourceLabel: '同じBow職を再作成',
    route: 'recruit',
  },
  [ids.token.greatswordBlank]: {
    kind: 'weapon',
    asset: 'assets/fusion/greatsword-blank.svg',
    sourceLabel: 'Clover Road Stage 2',
    route: 'battle',
  },
  [ids.token.reinforcedBow]: {
    kind: 'weapon',
    asset: 'assets/fusion/reinforced-bow.svg',
    sourceLabel: 'Clover Road Stage 4',
    route: 'battle',
  },
  [ids.token.temperedSteel]: {
    kind: 'steel',
    asset: 'assets/fusion/tempered-steel.svg',
    sourceLabel: 'Clover Road後半Stage',
    route: 'battle',
  },
  [ids.token.hardeningGel]: {
    kind: 'gel',
    asset: 'assets/fusion/hardening-gel.svg',
    sourceLabel: 'Battle Drop',
    route: 'battle',
  },
};

/** Presentation-only metadata for fusion ingredients. Balance quantities remain in Domain definitions. */
export function getFusionIngredientPresentation(tokenId: string): FusionIngredientPresentation {
  const presentation = PRESENTATION[tokenId];
  if (presentation === undefined) throw new Error(`Missing fusion ingredient presentation metadata: ${tokenId}`);
  return presentation;
}
