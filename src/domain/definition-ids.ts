/** Stable IDs are the save/balance boundary. Display names can change without migrating saves. */
export const ids = {
  currency: {
    gold: 'currency.gold',
  },
  token: {
    plainSlime: 'token.slime.plain-stock',
    slimeGel: 'token.material.slime-gel',
    lifeWater: 'token.material.life-water',
    trainingSword: 'token.job-gear.training-sword',
    trainingShield: 'token.job-gear.training-shield',
    trainingBow: 'token.job-gear.training-bow',
    trainingWand: 'token.job-gear.training-wand',
    trainingDagger: 'token.job-gear.training-dagger',
    trainingGun: 'token.job-gear.training-gun',
    swordCore: 'token.fusion.sword-core',
    shieldCore: 'token.fusion.shield-core',
    bowCore: 'token.fusion.bow-core',
    wandCore: 'token.fusion.wand-core',
    daggerCore: 'token.fusion.dagger-core',
    gunCore: 'token.fusion.gun-core',
    greatswordBlank: 'token.fusion.greatsword-blank',
    reinforcedBow: 'token.fusion.reinforced-bow',
    hardeningGel: 'token.fusion.hardening-gel',
    temperedSteel: 'token.fusion.tempered-steel',
    forgeKey: 'token.forge-key',
    swordWeaponMaterial: 'token.equipment-material.sword',
    shieldWeaponMaterial: 'token.equipment-material.shield',
    bowWeaponMaterial: 'token.equipment-material.bow',
    wandWeaponMaterial: 'token.equipment-material.wand',
    daggerWeaponMaterial: 'token.equipment-material.dagger',
    gunWeaponMaterial: 'token.equipment-material.gun',
    mimicHeart: 'token.special.mimic-heart',
  },
  gacha: {
    forge: 'gacha.equipment-forge',
  },
  loadout: {
    sword: 'loadout.slime.sword',
    shield: 'loadout.slime.shield',
    bow: 'loadout.slime.bow',
    wand: 'loadout.slime.wand',
    dagger: 'loadout.slime.dagger',
    gun: 'loadout.slime.gun',
    mimic: 'loadout.slime.mimic',
  },
  activity: {
    roadEscort: 'activity.dispatch.road-escort',
    forestExploration: 'activity.dispatch.forest-exploration',
    materialGathering: 'activity.dispatch.material-gathering',
  },
  rng: {
    loot: 'rng.loot',
    forge: 'rng.forge',
  },
} as const;

export const NORMAL_JOB_SLIME_IDS = ['sword', 'shield', 'bow', 'wand', 'dagger', 'gun'] as const;
export type JobSlimeId = typeof NORMAL_JOB_SLIME_IDS[number];

export const SPECIAL_SLIME_IDS = ['mimic'] as const;
export type SpecialSlimeId = typeof SPECIAL_SLIME_IDS[number];
export type SlimeTypeId = JobSlimeId | SpecialSlimeId;
export const ALL_SLIME_TYPE_IDS = [...NORMAL_JOB_SLIME_IDS, ...SPECIAL_SLIME_IDS] as const;

const NORMAL_JOB_SLIME_ID_SET = new Set<string>(NORMAL_JOB_SLIME_IDS);
export function isNormalJobSlimeId(typeId: SlimeTypeId | string): typeId is JobSlimeId {
  return NORMAL_JOB_SLIME_ID_SET.has(typeId);
}

export const AREA_IDS = [
  'area.clover-road',
  'area.mushroom-forest',
  'area.amber-mine',
  'area.sunken-marsh',
  'area.frost-ruins',
  'area.ember-canyon',
  'area.moonlit-castle',
  'area.dragon-crater',
] as const;
export const WORLD_AREA_IDS = AREA_IDS;
export type AreaId = typeof AREA_IDS[number];
export type WorldAreaId = AreaId;

export type TokenRequirement = Readonly<{
  tokenId: string;
  count: number;
}>;

export type JobCreationDefinition = Readonly<{
  id: JobSlimeId;
  displayName: string;
  plainSlimeCount: number;
  jobGearTokenId: string;
  jobGearCount: number;
  fusionCoreTokenId: string;
  unlockAreaId: WorldAreaId;
  startingLevel: number;
  startingJobTier: number;
}>;
