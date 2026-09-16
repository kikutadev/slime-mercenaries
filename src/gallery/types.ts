export type GalleryMotionId = 'idle' | 'move' | 'attack' | 'defeat';

export type GalleryCameraId = 'inspection' | 'gameplay' | 'front';

export type GalleryModelKind = 'plain' | 'sword' | 'greatsword' | 'bow' | 'shield' | 'wand' | 'dagger' | 'gun';

export interface SlimeGalleryDefinition {
  id: string;
  order: number;
  name: string;
  classification: string;
  role: string;
  modelKind: GalleryModelKind;
  asset: string;
  accent: string;
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
