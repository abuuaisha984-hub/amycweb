export type Locale = "en" | "sw" | "ar"

export const LOCALES: Locale[] = ["en", "sw", "ar"]
export const DEFAULT_LOCALE: Locale = "en"

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  sw: "Kiswahili",
  ar: "العربية",
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "EN",
  sw: "SW",
  ar: "AR",
}

export const RTL_LOCALES: Locale[] = ["ar"]

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale)
}

/**
 * Parse a translations JSON string safely.
 */
export function parseTranslations(raw: string | null | undefined): Record<string, any> {
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/**
 * Resolve a localized field value from an object's translations.
 * Falls back to the English default.
 */
export function t(
  obj: { translations?: string | null } | null | undefined,
  field: string,
  locale: Locale,
  fallback: string
): string {
  if (!obj) return fallback
  if (locale === "en") return fallback
  const tr = parseTranslations(obj.translations)
  const loc = tr[locale]
  if (loc && typeof loc === "object" && loc[field]) return loc[field]
  return fallback
}

/**
 * Simple in-memory dictionary for UI strings (header/footer/buttons).
 * Full content translation is handled per-entity via the `translations` field.
 */
export const UI_STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    "nav.about": "About",
    "nav.programmes": "Programmes",
    "nav.education": "Education",
    "nav.regions": "Regions",
    "nav.media": "Media",
    "nav.resources": "Resources",
    "nav.contact": "Contact",
    "cta.explore": "Explore AMYC",
    "cta.programmes": "Our Programmes",
    "cta.schools": "Our Schools",
    "cta.news": "Latest News",
    "cta.learnMore": "Learn More About AMYC",
    "cta.getInvolved": "Get Involved",
    "cta.support": "Support Our Programmes",
    "cta.contact": "Contact AMYC",
    "footer.about": "About AMYC",
    "footer.quickLinks": "Quick Links",
    "footer.importantLinks": "Important Links",
    "footer.contact": "Contact",
    "footer.social": "Social Media",
    "footer.legal": "Legal",
    "search.placeholder": "Search AMYC…",
    "search.title": "Search",
    "search.results": "Search Results",
    "search.noResults": "No results found.",
    "common.backToTop": "Back to top",
    "common.viewAll": "View all",
    "common.readMore": "Read more",
    "common.download": "Download",
    "common.visitWebsite": "Visit Website",
  },
  sw: {
    "nav.about": "Kuhusu",
    "nav.programmes": "Programu",
    "nav.education": "Elimu",
    "nav.regions": "Majimbo",
    "nav.media": "Media",
    "nav.resources": "Rasimali",
    "nav.contact": "Wasiliana",
    "cta.explore": "Chunguza AMYC",
    "cta.programmes": "Programu Zetu",
    "cta.schools": "Shule Zetu",
    "cta.news": "Habari Mpya",
    "cta.learnMore": "Jifunze Zaidi kuhusu AMYC",
    "cta.getInvolved": "Jiunge Nasi",
    "cta.support": "Tetea Programu Zetu",
    "cta.contact": "Wasiliana na AMYC",
    "footer.about": "Kuhusu AMYC",
    "footer.quickLinks": "Viungo vya Haraka",
    "footer.importantLinks": "Viungo Muhimu",
    "footer.contact": "Wasiliana",
    "footer.social": "Mitandao ya Kijamii",
    "footer.legal": "Sheria",
    "search.placeholder": "Tafuta AMYC…",
    "search.title": "Tafuta",
    "search.results": "Matokeo ya Utafutaji",
    "search.noResults": "Hakuna matokeo yaliyopatikana.",
    "common.backToTop": "Rudi Juu",
    "common.viewAll": "Tazama zote",
    "common.readMore": "Soma zaidi",
    "common.download": "Pakua",
    "common.visitWebsite": "Tembelea Tovuti",
  },
  ar: {
    "nav.about": "من نحن",
    "nav.programmes": "البرامج",
    "nav.education": "التعليم",
    "nav.regions": "المناطق",
    "nav.media": "الإعلام",
    "nav.resources": "الموارد",
    "nav.contact": "اتصل بنا",
    "cta.explore": "استكشف المركز",
    "cta.programmes": "برامجنا",
    "cta.schools": "مدارسنا",
    "cta.news": "أحدث الأخبار",
    "cta.learnMore": "اعرف المزيد عن المركز",
    "cta.getInvolved": "شارك معنا",
    "cta.support": "ادعم برامجنا",
    "cta.contact": "اتصل بالمركز",
    "footer.about": "عن المركز",
    "footer.quickLinks": "روابط سريعة",
    "footer.importantLinks": "روابط مهمة",
    "footer.contact": "اتصل بنا",
    "footer.social": "وسائل التواصل",
    "footer.legal": "قانوني",
    "search.placeholder": "بحث في المركز…",
    "search.title": "بحث",
    "search.results": "نتائج البحث",
    "search.noResults": "لا توجد نتائج.",
    "common.backToTop": "العودة للأعلى",
    "common.viewAll": "عرض الكل",
    "common.readMore": "اقرأ المزيد",
    "common.download": "تحميل",
    "common.visitWebsite": "زيارة الموقع",
  },
}

export function ui(locale: Locale, key: string): string {
  return UI_STRINGS[locale]?.[key] ?? UI_STRINGS.en[key] ?? key
}
