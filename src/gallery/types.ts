export type GalleryMotionId = 'idle' | 'move' | 'attack' | 'skill' | 'hit' | 'defeat' | 'celebrate';

export type GalleryCameraId = 'inspection' | 'gameplay' | 'front';

export type GalleryModelKind = 'sword' | 'greatsword' | 'bow';

export interface SlimeGalleryDefinition {
  id: string;
  order: number;
  name: string;
  classification: string;
  role: string;
  modelKind: GalleryModelKind;
  asset: string;
  accent: string;
  equipmentAnchor: 'WeaponAnchor' | 'BowAnchor';
  /** Curated world yaw used only by the default inspection view. */
  inspectionFacingYawDegrees?: number;
  availableMotions: readonly GalleryMotionId[];
  signatureLabel?: string;
  implementationStatus: 'implemented' | 'planned';
  notes: string;
}

export interface SlimeGalleryModule {
  default: SlimeGalleryDefinition;
}
