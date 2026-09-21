import type { GachaDefinition, ItemDefinition, LoadoutDefinition } from 'idle-game-kit';
import { balance } from './balance';
import { ids, type JobSlimeId, type SlimeTypeId } from './definition-ids';

export type WeaponFamily = JobSlimeId;
export type WeaponRarity = 'common' | 'rare' | 'mythic';
export type WeaponId = keyof typeof weaponDefinitions;

export type WeaponDefinition = Readonly<{
  id: string;
  displayName: string;
  family: WeaponFamily;
  rarity: WeaponRarity;
  dpsMultiplier: number;
  item: ItemDefinition;
}>;

export const weaponDefinitions = {
  bronzeSaber: {
    id: 'weapon.sword.bronze-saber', displayName: 'ブロンズセイバー', family: 'sword', rarity: 'common',
    dpsMultiplier: balance.equipment.weapons.bronzeSaber.dpsMultiplier,
    item: { id: 'weapon.sword.bronze-saber', displayName: 'ブロンズセイバー', tags: ['weapon', 'family:sword'] },
  },
  cloverBlade: {
    id: 'weapon.sword.clover-blade', displayName: 'クローバーブレイド', family: 'sword', rarity: 'rare',
    dpsMultiplier: balance.equipment.weapons.cloverBlade.dpsMultiplier,
    item: { id: 'weapon.sword.clover-blade', displayName: 'クローバーブレイド', tags: ['weapon', 'family:sword'] },
  },
  starcleaver: {
    id: 'weapon.sword.starcleaver', displayName: '星断ちの大剣', family: 'sword', rarity: 'mythic',
    dpsMultiplier: balance.equipment.weapons.starcleaver.dpsMultiplier,
    item: { id: 'weapon.sword.starcleaver', displayName: '星断ちの大剣', tags: ['weapon', 'family:sword'] },
  },
  hunterBow: {
    id: 'weapon.bow.hunter-bow', displayName: '狩人の弓', family: 'bow', rarity: 'common',
    dpsMultiplier: balance.equipment.weapons.hunterBow.dpsMultiplier,
    item: { id: 'weapon.bow.hunter-bow', displayName: '狩人の弓', tags: ['weapon', 'family:bow'] },
  },
  windstring: {
    id: 'weapon.bow.windstring', displayName: '風弦の弓', family: 'bow', rarity: 'rare',
    dpsMultiplier: balance.equipment.weapons.windstring.dpsMultiplier,
    item: { id: 'weapon.bow.windstring', displayName: '風弦の弓', tags: ['weapon', 'family:bow'] },
  },
  cometString: {
    id: 'weapon.bow.comet-string', displayName: '彗星弓', family: 'bow', rarity: 'mythic',
    dpsMultiplier: balance.equipment.weapons.cometString.dpsMultiplier,
    item: { id: 'weapon.bow.comet-string', displayName: '彗星弓', tags: ['weapon', 'family:bow'] },
  },
  ironBulwark: {
    id: 'weapon.shield.iron-bulwark', displayName: '鉄壁の盾', family: 'shield', rarity: 'common',
    dpsMultiplier: balance.equipment.weapons.ironBulwark.dpsMultiplier,
    item: { id: 'weapon.shield.iron-bulwark', displayName: '鉄壁の盾', tags: ['weapon', 'family:shield'] },
  },
  cloverAegis: {
    id: 'weapon.shield.clover-aegis', displayName: 'クローバーイージス', family: 'shield', rarity: 'rare',
    dpsMultiplier: balance.equipment.weapons.cloverAegis.dpsMultiplier,
    item: { id: 'weapon.shield.clover-aegis', displayName: 'クローバーイージス', tags: ['weapon', 'family:shield'] },
  },
  aegisOfDawn: {
    id: 'weapon.shield.aegis-of-dawn', displayName: '暁のイージス', family: 'shield', rarity: 'mythic',
    dpsMultiplier: balance.equipment.weapons.aegisOfDawn.dpsMultiplier,
    item: { id: 'weapon.shield.aegis-of-dawn', displayName: '暁のイージス', tags: ['weapon', 'family:shield'] },
  },
  oakWand: {
    id: 'weapon.wand.oak-wand', displayName: '樫の杖', family: 'wand', rarity: 'common',
    dpsMultiplier: balance.equipment.weapons.oakWand.dpsMultiplier,
    item: { id: 'weapon.wand.oak-wand', displayName: '樫の杖', tags: ['weapon', 'family:wand'] },
  },
  mooncapWand: {
    id: 'weapon.wand.mooncap-wand', displayName: '月茸の杖', family: 'wand', rarity: 'rare',
    dpsMultiplier: balance.equipment.weapons.mooncapWand.dpsMultiplier,
    item: { id: 'weapon.wand.mooncap-wand', displayName: '月茸の杖', tags: ['weapon', 'family:wand'] },
  },
  sunseedStaff: {
    id: 'weapon.wand.sunseed-staff', displayName: '陽種の杖', family: 'wand', rarity: 'mythic',
    dpsMultiplier: balance.equipment.weapons.sunseedStaff.dpsMultiplier,
    item: { id: 'weapon.wand.sunseed-staff', displayName: '陽種の杖', tags: ['weapon', 'family:wand'] },
  },
  scoutKnives: {
    id: 'weapon.dagger.scout-knives', displayName: '斥候の双刃', family: 'dagger', rarity: 'common',
    dpsMultiplier: balance.equipment.weapons.scoutKnives.dpsMultiplier,
    item: { id: 'weapon.dagger.scout-knives', displayName: '斥候の双刃', tags: ['weapon', 'family:dagger'] },
  },
  shadeTwins: {
    id: 'weapon.dagger.shade-twins', displayName: '影縫いの双刃', family: 'dagger', rarity: 'rare',
    dpsMultiplier: balance.equipment.weapons.shadeTwins.dpsMultiplier,
    item: { id: 'weapon.dagger.shade-twins', displayName: '影縫いの双刃', tags: ['weapon', 'family:dagger'] },
  },
  nightglassTwins: {
    id: 'weapon.dagger.nightglass-twins', displayName: '夜玻璃の双刃', family: 'dagger', rarity: 'mythic',
    dpsMultiplier: balance.equipment.weapons.nightglassTwins.dpsMultiplier,
    item: { id: 'weapon.dagger.nightglass-twins', displayName: '夜玻璃の双刃', tags: ['weapon', 'family:dagger'] },
  },
  brassPistol: {
    id: 'weapon.gun.brass-pistol', displayName: '真鍮ピストル', family: 'gun', rarity: 'common',
    dpsMultiplier: balance.equipment.weapons.brassPistol.dpsMultiplier,
    item: { id: 'weapon.gun.brass-pistol', displayName: '真鍮ピストル', tags: ['weapon', 'family:gun'] },
  },
  sparkCarbine: {
    id: 'weapon.gun.spark-carbine', displayName: '火花のカービン', family: 'gun', rarity: 'rare',
    dpsMultiplier: balance.equipment.weapons.sparkCarbine.dpsMultiplier,
    item: { id: 'weapon.gun.spark-carbine', displayName: '火花のカービン', tags: ['weapon', 'family:gun'] },
  },
  jellynova: {
    id: 'weapon.gun.jellynova', displayName: 'ジェリーノヴァ', family: 'gun', rarity: 'mythic',
    dpsMultiplier: balance.equipment.weapons.jellynova.dpsMultiplier,
    item: { id: 'weapon.gun.jellynova', displayName: 'ジェリーノヴァ', tags: ['weapon', 'family:gun'] },
  },
} as const satisfies Readonly<Record<string, WeaponDefinition>>;

export const weaponDefinitionsByDefinitionId: Readonly<Record<string, WeaponDefinition>> = Object.fromEntries(
  Object.values(weaponDefinitions).map((definition) => [definition.id, definition]),
);

export const itemDefinitionsById: Readonly<Record<string, ItemDefinition>> = Object.fromEntries(
  Object.values(weaponDefinitions).map((definition) => [definition.item.id, definition.item]),
);

export const slimeWeaponLoadoutDefinitions: Readonly<Record<SlimeTypeId, LoadoutDefinition>> = {
  sword: { id: ids.loadout.sword, slots: [{ id: 'weapon', acceptsTags: ['family:sword'] }] },
  shield: { id: ids.loadout.shield, slots: [{ id: 'weapon', acceptsTags: ['family:shield'] }] },
  bow: { id: ids.loadout.bow, slots: [{ id: 'weapon', acceptsTags: ['family:bow'] }] },
  wand: { id: ids.loadout.wand, slots: [{ id: 'weapon', acceptsTags: ['family:wand'] }] },
  dagger: { id: ids.loadout.dagger, slots: [{ id: 'weapon', acceptsTags: ['family:dagger'] }] },
  gun: { id: ids.loadout.gun, slots: [{ id: 'weapon', acceptsTags: ['family:gun'] }] },
  mimic: { id: ids.loadout.mimic, slots: [{ id: 'special', acceptsTags: ['special:mimic-only'] }] },
};

export type ForgeReward = Readonly<{ weaponDefinitionId: string }>;
export const equipmentForgeDefinition: GachaDefinition<ForgeReward> = {
  id: ids.gacha.forge,
  cost: { tokenId: ids.token.forgeKey, countPerDraw: balance.equipment.forgeKeyCostPerDraw },
  allowedDrawCounts: [1, 10],
  rngStreamName: ids.rng.forge,
  duplicatePolicy: 'resolve-with-hook',
  pity: {
    id: 'forge.mythic-pity',
    threshold: balance.equipment.mythicPityDraws,
    poolEntryIds: ['forge.starcleaver', 'forge.aegis-of-dawn', 'forge.comet-string', 'forge.sunseed-staff', 'forge.nightglass-twins', 'forge.jellynova'],
  },
  pool: [
    { id: 'forge.bronze-saber', weight: balance.equipment.weapons.bronzeSaber.weight, reward: { weaponDefinitionId: weaponDefinitions.bronzeSaber.id }, rarity: 'common' },
    { id: 'forge.clover-blade', weight: balance.equipment.weapons.cloverBlade.weight, reward: { weaponDefinitionId: weaponDefinitions.cloverBlade.id }, rarity: 'rare' },
    { id: 'forge.starcleaver', weight: balance.equipment.weapons.starcleaver.weight, reward: { weaponDefinitionId: weaponDefinitions.starcleaver.id }, rarity: 'mythic' },
    { id: 'forge.hunter-bow', weight: balance.equipment.weapons.hunterBow.weight, reward: { weaponDefinitionId: weaponDefinitions.hunterBow.id }, rarity: 'common' },
    { id: 'forge.windstring', weight: balance.equipment.weapons.windstring.weight, reward: { weaponDefinitionId: weaponDefinitions.windstring.id }, rarity: 'rare' },
    { id: 'forge.comet-string', weight: balance.equipment.weapons.cometString.weight, reward: { weaponDefinitionId: weaponDefinitions.cometString.id }, rarity: 'mythic' },
    { id: 'forge.iron-bulwark', weight: balance.equipment.weapons.ironBulwark.weight, reward: { weaponDefinitionId: weaponDefinitions.ironBulwark.id }, rarity: 'common' },
    { id: 'forge.clover-aegis', weight: balance.equipment.weapons.cloverAegis.weight, reward: { weaponDefinitionId: weaponDefinitions.cloverAegis.id }, rarity: 'rare' },
    { id: 'forge.aegis-of-dawn', weight: balance.equipment.weapons.aegisOfDawn.weight, reward: { weaponDefinitionId: weaponDefinitions.aegisOfDawn.id }, rarity: 'mythic' },
    { id: 'forge.oak-wand', weight: balance.equipment.weapons.oakWand.weight, reward: { weaponDefinitionId: weaponDefinitions.oakWand.id }, rarity: 'common' },
    { id: 'forge.mooncap-wand', weight: balance.equipment.weapons.mooncapWand.weight, reward: { weaponDefinitionId: weaponDefinitions.mooncapWand.id }, rarity: 'rare' },
    { id: 'forge.sunseed-staff', weight: balance.equipment.weapons.sunseedStaff.weight, reward: { weaponDefinitionId: weaponDefinitions.sunseedStaff.id }, rarity: 'mythic' },
    { id: 'forge.scout-knives', weight: balance.equipment.weapons.scoutKnives.weight, reward: { weaponDefinitionId: weaponDefinitions.scoutKnives.id }, rarity: 'common' },
    { id: 'forge.shade-twins', weight: balance.equipment.weapons.shadeTwins.weight, reward: { weaponDefinitionId: weaponDefinitions.shadeTwins.id }, rarity: 'rare' },
    { id: 'forge.nightglass-twins', weight: balance.equipment.weapons.nightglassTwins.weight, reward: { weaponDefinitionId: weaponDefinitions.nightglassTwins.id }, rarity: 'mythic' },
    { id: 'forge.brass-pistol', weight: balance.equipment.weapons.brassPistol.weight, reward: { weaponDefinitionId: weaponDefinitions.brassPistol.id }, rarity: 'common' },
    { id: 'forge.spark-carbine', weight: balance.equipment.weapons.sparkCarbine.weight, reward: { weaponDefinitionId: weaponDefinitions.sparkCarbine.id }, rarity: 'rare' },
    { id: 'forge.jellynova', weight: balance.equipment.weapons.jellynova.weight, reward: { weaponDefinitionId: weaponDefinitions.jellynova.id }, rarity: 'mythic' },
  ],
};
