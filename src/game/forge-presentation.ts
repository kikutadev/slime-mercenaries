import { weaponDefinitionsByDefinitionId, type WeaponFamily, type WeaponRarity } from '../domain';

export type ForgeWeaponPresentation = Readonly<{
  asset: string;
  familyLabel: string;
  family: WeaponFamily;
  rarity: WeaponRarity;
}>;

const FAMILY_LABELS: Readonly<Record<WeaponFamily, string>> = {
  sword: '剣',
  shield: '盾',
  bow: '弓',
  wand: '杖',
  dagger: '短剣',
  gun: '銃',
};

const ASSET_BY_DEFINITION_ID: Readonly<Record<string, string>> = {
  'weapon.sword.bronze-saber': 'assets/weapons/bronze-saber.glb',
  'weapon.sword.clover-blade': 'assets/weapons/clover-blade.glb',
  'weapon.sword.starcleaver': 'assets/weapons/starcleaver.glb',
  'weapon.bow.hunter-bow': 'assets/weapons/hunter-bow.glb',
  'weapon.bow.windstring': 'assets/weapons/windstring.glb',
  'weapon.bow.comet-string': 'assets/weapons/comet-string.glb',
  'weapon.shield.iron-bulwark': 'assets/weapons/iron-bulwark.glb',
  'weapon.shield.clover-aegis': 'assets/weapons/clover-aegis.glb',
  'weapon.shield.aegis-of-dawn': 'assets/weapons/aegis-of-dawn.glb',
  'weapon.wand.oak-wand': 'assets/weapons/oak-wand.glb',
  'weapon.wand.mooncap-wand': 'assets/weapons/mooncap-wand.glb',
  'weapon.wand.sunseed-staff': 'assets/weapons/sunseed-staff.glb',
  'weapon.dagger.scout-knives': 'assets/weapons/scout-knives.glb',
  'weapon.dagger.shade-twins': 'assets/weapons/shade-twins.glb',
  'weapon.dagger.nightglass-twins': 'assets/weapons/nightglass-twins.glb',
  'weapon.gun.brass-pistol': 'assets/weapons/brass-pistol.glb',
  'weapon.gun.spark-carbine': 'assets/weapons/spark-carbine.glb',
  'weapon.gun.jellynova': 'assets/weapons/jellynova.glb',
};

/** Render-ready presentation metadata for a released Forge weapon. */
export function getForgeWeaponPresentation(definitionId: string): ForgeWeaponPresentation {
  const definition = weaponDefinitionsByDefinitionId[definitionId];
  const asset = ASSET_BY_DEFINITION_ID[definitionId];
  if (definition === undefined || asset === undefined) {
    throw new Error(`No Forge weapon presentation authored for ${definitionId}`);
  }

  return {
    asset,
    familyLabel: FAMILY_LABELS[definition.family],
    family: definition.family,
    rarity: definition.rarity,
  };
}
