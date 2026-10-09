import assert from "node:assert/strict"
import { collectProgrammeGalleryImages } from "../src/lib/programme-gallery.ts"

const hero = "/images/programme-hero.webp"
const shared = [hero, "/images/shared-gallery.webp", null, 17]
const translations = {
  galleryImages: shared,
  en: { galleryImages: ["/images/english-only.webp"] },
  sw: { galleryImages: ["/images/swahili-only.webp"] },
  ar: { galleryImages: [hero, "/images/arabic-only.webp"] },
}

for (const locale of ["en", "sw", "ar"]) {
  const images = collectProgrammeGalleryImages(hero, translations, locale)
  assert.equal(images[0], hero, `${locale}: primary hero image remains first`)
  assert.equal(new Set(images).size, images.length, `${locale}: duplicate images are removed`)
  assert.ok(images.includes("/images/shared-gallery.webp"), `${locale}: shared gallery remains visible`)
  assert.ok(images.length > 1, `${locale}: gallery retains multiple images`)
}

assert.ok(collectProgrammeGalleryImages(hero, translations, "ar").includes("/images/arabic-only.webp"))
assert.deepEqual(collectProgrammeGalleryImages(null, null, "en"), [])
console.log("Programme gallery locale smoke passed for en, sw and ar.")
