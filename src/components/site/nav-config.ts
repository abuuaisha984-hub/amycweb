import type { Locale } from "@/lib/i18n"
import { REGION_BANDS } from "@/lib/region-bands"

/** Prefix a path with the locale segment. */
export function lp(locale: Locale, path: string): string {
  if (!path || path === "/") return `/${locale}`
  return `/${locale}${path.startsWith("/") ? path : "/" + path}`
}

export type NavChild = { labelKey: string; href: string }
export type NavItem = { labelKey: string; href: string; children?: NavChild[] }

// hrefs here are locale-agnostic; the header/footer will prefix them via lp(locale, href)
export const NAV: NavItem[] = [
  { labelKey: "nav.home", href: "/" },
  {
    labelKey: "nav.about",
    href: "/about",
    children: [
      { labelKey: "about.overview", href: "/about" },
      { labelKey: "about.history", href: "/about#history" },
      { labelKey: "about.mission", href: "/about#mission" },
      { labelKey: "about.values", href: "/about#values" },
      { labelKey: "about.leadership", href: "/about#leadership" },
      { labelKey: "about.structure", href: "/about#structure" },
    ],
  },
  {
    labelKey: "nav.schools",
    href: "/education",
    children: [
      { labelKey: "education.allSchools", href: "/education?type=ALL" },
      { labelKey: "education.maahad", href: "/education?type=MAAHAD" },
      { labelKey: "education.primary", href: "/education?type=PRIMARY" },
      { labelKey: "education.secondary", href: "/education?type=SECONDARY" },
      { labelKey: "education.college", href: "/education?type=COLLEGE" },
      { labelKey: "education.university", href: "/education?type=UNIVERSITY" },
    ],
  },
  {
    labelKey: "nav.regions",
    href: "/regions",
    children: [
      { labelKey: "regions.band.all", href: "/regions" },
      ...REGION_BANDS.map((band) => ({
        labelKey: band.labelKey,
        href: `/regions?kanda=${band.key}`,
      })),
    ],
  },
  {
    labelKey: "nav.mediaGallery",
    href: "/media",
    children: [
      { labelKey: "media.title", href: "/media" },
      { labelKey: "news.title", href: "/news" },
      { labelKey: "events.title", href: "/events" },
      { labelKey: "documents.title", href: "/documents?category=Publication" },
    ],
  },
  {
    labelKey: "nav.programmes",
    href: "/programmes",
    children: [
      { labelKey: "prog.dawah", href: "/programmes/dawah" },
      { labelKey: "prog.education", href: "/programmes/education" },
      { labelKey: "prog.social-welfare", href: "/programmes/social-welfare" },
      { labelKey: "prog.community-services", href: "/programmes/community-services" },
      { labelKey: "prog.healthcare", href: "/programmes/healthcare" },
      { labelKey: "prog.youth-development", href: "/programmes/youth-development" },
      { labelKey: "prog.development-projects", href: "/programmes/development-projects" },
      { labelKey: "prog.media-communication", href: "/programmes/media-communication" },
      { labelKey: "prog.orphan-welfare", href: "/programmes/orphan-welfare" },
    ],
  },
  { labelKey: "nav.resources", href: "/documents" },
]

export const FOOTER_QUICK = [
  { labelKey: "nav.about", href: "/about" },
  { labelKey: "nav.programmes", href: "/programmes" },
  { labelKey: "nav.education", href: "/education" },
  { labelKey: "nav.regions", href: "/regions" },
  { labelKey: "news.title", href: "/news" },
  { labelKey: "events.title", href: "/events" },
  { labelKey: "documents.title", href: "/documents" },
  { labelKey: "nav.contact", href: "/contact" },
]

export const FOOTER_LEGAL = [
  { labelKey: "legal.privacy", href: "/info/privacy-policy" },
  { labelKey: "legal.terms", href: "/info/terms" },
  { labelKey: "legal.cookie", href: "/info/cookie-policy" },
  { labelKey: "legal.accessibility", href: "/info/accessibility" },
]
