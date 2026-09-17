export type GalleryMotionId = 'idle' | 'move' | 'attack' | 'hit' | 'defeat';

export type GalleryCameraId = 'inspection' | 'gameplay' | 'front';

export type GalleryModelKind = 'plain' | 'sword' | 'greatsword' | 'bow' | 'shield' | 'wand' | 'dagger' | 'gun' | 'tiny-mushroom' | 'plump-mushroom' | 'spore-mushroom' | 'great-mushroom' | 'leafling' | 'whirl-leaf' | 'bud-bloom' | 'puff-flower' | 'round-hedgehog' | 'acorn-squirrel';

export interface SlimeGalleryDefinition {
  id: string;
  entityKind?: 'slime' | 'enemy';
  order: number;
  name: string;
  classification: string;
  role: string;
  modelKind: GalleryModelKind;
  asset: string;
  accent: string;
  /** Runtime scale used by enemy models; slimes retain the existing canonical scale. */
  productionScale?: number;
  /** Enemy-only production behavior selector. */
  enemyBehaviorId?: import('../game/enemies').EnemyBehaviorId;
  /** Equipment anchor used only once a production motion profile owns it. */
  equipmentAnchor: string | null;
  weaponTipName: string | null;
  /** Curated world yaw used only by the default inspection view. */
  inspectionFacingYawDegrees?: number;
  /** Per-model horizontal camera offset for the default inspection view. */
  inspectionSideDistance?: number;
  availableMotions: readonly GalleryMotionId[];
  signatureLabel?: string;
  implementationStatus: 'implemented' | 'model' | 'planned';
  notes: string;
}

export interface SlimeGalleryModule {
  default: SlimeGalleryDefinition;
}
