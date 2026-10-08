import { publicAssetUrl } from "@/lib/public-asset-url"

const APPROVED_LOCAL_IMAGES = new Set([
  "/images/daarularqam.JPG",
  "/images/daawah_amyc.jpg",
  "/images/graduu.jpg",
  "/images/school_muzdalifah.JPG",
  "/images/student-muzdalifah.JPG",
  "/images/student_namirah.png",
  "/images/Avisina_tanga.jpg",
  "/images/Heaith_care.jpg",
  "/images/IMG-20261001-WA0071.jpg",
  "/images/Student_arafah.jpg",
  "/images/avicina_primary.jpg",
  "/images/daarul_arqam.JPG",
  "/images/service_community_health.jpg",
  "/images/zawad-muzdw.jpg",
  "/images/misaada.JPG",
  "/images/semina_for_student_assalaf_islamic_school.jpg",
  "/images/avicina_primary.jpg",
  "/images/treasure_hq.jpeg",
  "/images/Mudirwataasisi.JPG",
])

const OPTIMIZED_LOCAL_IMAGES: Record<string, string> = {
  "/images/misaada.JPG": "/images/misaada.webp",
  "/images/school_muzdalifah.JPG": "/images/school_muzdalifah.webp",
  "/images/Contact_information.jpg": "/images/Contact_information.webp",
  "/images/student_namirah.png": "/images/student_namirah.webp",
  "/images/daarularqam.JPG": "/images/daarularqam.webp",
  "/images/student-muzdalifah.JPG": "/images/student-muzdalifah.webp",
  "/images/daarul_arqam.JPG": "/images/daarul_arqam.webp",
}

const LEGACY_IMAGE_MAP: Record<string, string | null> = {
  "/images/hero-amyc.jpg": "/images/daawah_amyc.jpg",
  "/images/news-schools.jpg": "/images/school_muzdalifah.JPG",
  "/images/news-scholarship.jpg": "/images/graduu.jpg",
  "/images/news-eid.jpg": "/images/IMG-20261001-WA0071.jpg",
  "/images/news-hijab.jpg": "/images/student_namirah.png",
  "/images/news-zakat.jpg": "/images/Student_arafah.jpg",
  "/images/news-iftar.jpg": "/images/zawad-muzdw.jpg",
  "/images/news-agm.jpg": "/images/daawah_amyc.jpg",
  "/images/event-agm.jpg": "/images/daawah_amyc.jpg",
  "/images/event-dawah.jpg": "/images/daawah_amyc.jpg",
  "/images/event-health.jpg": "/images/Heaith_care.jpg",
  "/images/event-youth.jpg": "/images/graduu.jpg",
}

/** Resolve images present in this checkout and hide removed legacy assets. */
export function publicImage(path: string | null | undefined): string | null {
  if (!path) return null
  if (Object.hasOwn(LEGACY_IMAGE_MAP, path)) {
    const mapped = LEGACY_IMAGE_MAP[path]
    return mapped ? publicImage(mapped) : null
  }
  if (path.startsWith("/images/")) return APPROVED_LOCAL_IMAGES.has(path) ? OPTIMIZED_LOCAL_IMAGES[path] || path : null
  if (/^\/uploads\/images\/(regions|leaders|schools|events|media|news|programmes)\/[a-f0-9]{24}\.(webp|jpg)$/.test(path)) return publicAssetUrl(path)
  return path
}
