export type NavChild = { label: string; href: string; description?: string }
export type NavItem = { label: string; href: string; children?: NavChild[] }

export const NAV: NavItem[] = [
  {
    label: "About",
    href: "/about",
    children: [
      { label: "Overview", href: "/about", description: "Who AMYC is and what we stand for" },
      { label: "History", href: "/about#history", description: "More than four decades of service since 1980" },
      { label: "Mission & Vision", href: "/about#mission", description: "Our direction and aspiration" },
      { label: "Values", href: "/about#values", description: "The principles that guide our work" },
      { label: "Leadership", href: "/about#leadership", description: "Our national governance structure" },
      { label: "Organizational Structure", href: "/about#structure", description: "Branches, regions and electoral system" },
    ],
  },
  {
    label: "Programmes",
    href: "/programmes",
    children: [
      { label: "Da'wah Efforts", href: "/programmes/dawah" },
      { label: "Education", href: "/programmes/education" },
      { label: "Social Welfare", href: "/programmes/social-welfare" },
      { label: "Community Services", href: "/programmes/community-services" },
      { label: "Healthcare", href: "/programmes/healthcare" },
      { label: "Youth Development", href: "/programmes/youth-development" },
      { label: "Development Projects", href: "/programmes/development-projects" },
      { label: "Media & Communication", href: "/programmes/media-communication" },
      { label: "Orphan Welfare", href: "/programmes/orphan-welfare" },
    ],
  },
  {
    label: "Education",
    href: "/education",
    children: [
      { label: "Schools Directory", href: "/education", description: "Browse all AMYC schools and institutions" },
      { label: "Religious Schools (Maahad)", href: "/education?type=MAAHAD" },
      { label: "Secondary Schools", href: "/education?type=SECONDARY" },
      { label: "Primary Schools", href: "/education?type=PRIMARY" },
      { label: "Teachers College", href: "/education?type=COLLEGE" },
    ],
  },
  {
    label: "Regions",
    href: "/regions",
    children: [
      { label: "All Majimbo", href: "/regions", description: "Our nationwide network of regional branches" },
    ],
  },
  {
    label: "Media",
    href: "/media",
    children: [
      { label: "News", href: "/news" },
      { label: "Announcements", href: "/news?kind=ANNOUNCEMENT" },
      { label: "Events", href: "/events" },
      { label: "Gallery", href: "/media" },
      { label: "Publications", href: "/documents?category=Publication" },
    ],
  },
  {
    label: "Resources",
    href: "/documents",
    children: [
      { label: "Documents & Downloads", href: "/documents", description: "Reports, policies, forms and publications" },
      { label: "Annual Reports", href: "/documents?category=Annual Report" },
      { label: "Strategic Plans", href: "/documents?category=Strategic Plan" },
      { label: "Policies", href: "/documents?category=Policy" },
      { label: "Forms", href: "/documents?category=Form" },
    ],
  },
  {
    label: "Contact",
    href: "/contact",
  },
]

export const FOOTER_QUICK = [
  { label: "About", href: "/about" },
  { label: "Programmes", href: "/programmes" },
  { label: "Schools", href: "/education" },
  { label: "Regions", href: "/regions" },
  { label: "News", href: "/news" },
  { label: "Events", href: "/events" },
  { label: "Documents", href: "/documents" },
  { label: "Contact", href: "/contact" },
]

export const FOOTER_LEGAL = [
  { label: "Privacy Policy", href: "/page/privacy-policy" },
  { label: "Terms of Use", href: "/page/terms" },
  { label: "Cookie Policy", href: "/page/cookie-policy" },
  { label: "Accessibility", href: "/page/accessibility" },
]
