import type { Locale } from "@/lib/i18n"

/** Prefix a path with the locale segment. */
export function lp(locale: Locale, path: string): string {
  if (!path || path === "/") return `/${locale}`
  return `/${locale}${path.startsWith("/") ? path : "/" + path}`
}

export type NavChild = { labelKey: string; href: string; descriptionKey?: string; label?: string; description?: string }
export type NavItem = { labelKey: string; href: string; children?: NavChild[] }

// hrefs here are locale-agnostic; the header/footer will prefix them via lp(locale, href)
export const NAV: NavItem[] = [
  {
    labelKey: "nav.about",
    href: "/about",
    children: [
      { labelKey: "about.overview", href: "/about", descriptionKey: "home.whoWeAre.eyebrow" },
      { labelKey: "about.history", href: "/about#history", descriptionKey: "about.history" },
      { labelKey: "about.mission", href: "/about#mission", descriptionKey: "about.mission" },
      { labelKey: "about.values", href: "/about#values", descriptionKey: "about.valuesTitle" },
      { labelKey: "about.leadership", href: "/about#leadership", descriptionKey: "about.leadershipTitle" },
      { labelKey: "about.structure", href: "/about#structure", descriptionKey: "about.structureTitle" },
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
  {
    labelKey: "nav.education",
    href: "/education",
    children: [
      { labelKey: "education.title", href: "/education", descriptionKey: "education.desc" },
      { labelKey: "education.maahad", href: "/education?type=MAAHAD" },
      { labelKey: "education.secondary", href: "/education?type=SECONDARY" },
      { labelKey: "education.primary", href: "/education?type=PRIMARY" },
      { labelKey: "education.college", href: "/education?type=COLLEGE" },
    ],
  },
  {
    labelKey: "nav.regions",
    href: "/regions",
    children: [
      { labelKey: "regions.title", href: "/regions", descriptionKey: "regions.desc" },
    ],
  },
  {
    labelKey: "nav.media",
    href: "/media",
    children: [
      { labelKey: "news.title", href: "/news" },
      { labelKey: "news.announcements", href: "/news?kind=ANNOUNCEMENT" },
      { labelKey: "events.title", href: "/events" },
      { labelKey: "media.title", href: "/media" },
      { labelKey: "documents.title", href: "/documents?category=Publication" },
    ],
  },
  {
    labelKey: "nav.resources",
    href: "/documents",
    children: [
      { labelKey: "documents.title", href: "/documents", descriptionKey: "documents.desc" },
      { labelKey: "doc.annual-report", href: "/documents?category=Annual Report" },
      { labelKey: "doc.strategic-plan", href: "/documents?category=Strategic Plan" },
      { labelKey: "doc.policy", href: "/documents?category=Policy" },
      { labelKey: "doc.form", href: "/documents?category=Form" },
    ],
  },
  {
    labelKey: "nav.contact",
    href: "/contact",
  },
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
