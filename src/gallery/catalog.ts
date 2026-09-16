import type { SlimeGalleryDefinition, SlimeGalleryModule } from './types';

const modules = import.meta.glob<SlimeGalleryModule>('./slimes/*.ts', { eager: true });

export const slimeGalleryCatalog: readonly SlimeGalleryDefinition[] = Object.values(modules)
  .map((module) => module.default)
  .filter((definition): definition is SlimeGalleryDefinition => Boolean(definition))
  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

export function findGallerySlime(id: string): SlimeGalleryDefinition | undefined {
  return slimeGalleryCatalog.find((definition) => definition.id === id);
}
