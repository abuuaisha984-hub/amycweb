export type ProgrammeLocale = "en" | "sw" | "ar"

/**
 * Programme galleries are shared at the translation root, while newer or
 * manually edited records may keep gallery images inside a locale object.
 * Include both shapes so changing language never drops the shared gallery.
 */
export function collectProgrammeGalleryImages(
  heroImage: string | null,
  translations: unknown,
  locale: ProgrammeLocale,
): string[] {
  if (!translations || typeof translations !== "object" || Array.isArray(translations)) {
    return heroImage ? [heroImage] : []
  }

  const record = translations as Record<string, unknown>
  const sharedGallery = Array.isArray(record.galleryImages) ? record.galleryImages : []
  const localized = record[locale]
  const localizedGallery = localized && typeof localized === "object" && !Array.isArray(localized)
    ? (localized as Record<string, unknown>).galleryImages
    : undefined
  const localeImages = Array.isArray(localizedGallery) ? localizedGallery : []

  return [...new Set([heroImage, ...sharedGallery, ...localeImages])]
    .filter((image): image is string => typeof image === "string" && image.trim().length > 0)
}
