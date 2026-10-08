export type AdminNav = { label: string; href: string; icon: string; entity?: string; superAdminOnly?: boolean }

export const ADMIN_NAV: AdminNav[] = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "News", href: "/admin/news", icon: "Newspaper", entity: "article" },
  { label: "Events", href: "/admin/events", icon: "CalendarDays", entity: "event" },
  { label: "Schools", href: "/admin/schools", icon: "GraduationCap", entity: "school" },
  { label: "Programmes", href: "/admin/programmes", icon: "BriefcaseBusiness", entity: "programme" },
  { label: "Regions (Majimbo)", href: "/admin/regions", icon: "MapPin", entity: "region" },
  { label: "Leadership", href: "/admin/leaders", icon: "Users", entity: "leader" },
  { label: "Documents", href: "/admin/documents", icon: "FolderOpen", entity: "document" },
  { label: "Media & Gallery", href: "/admin/media", icon: "Image", entity: "media" },
  { label: "Messages", href: "/admin/messages", icon: "Mail", entity: "contact" },
  { label: "Visitor Analytics", href: "/admin/analytics", icon: "Globe2", entity: "analytics" },
  { label: "Translation Status", href: "/admin/translations", icon: "Languages", entity: "article" },
  { label: "Audit Log", href: "/admin/audit", icon: "ScrollText", superAdminOnly: true },
  { label: "Admin Accounts", href: "/admin/users", icon: "Users", superAdminOnly: true },
  { label: "Settings", href: "/admin/settings", icon: "Settings", superAdminOnly: true },
  { label: "My Account / Password", href: "/admin/account/password", icon: "KeyRound" },
]

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "System Administrator",
  ADMIN: "Institution Administrator",
  CONTENT_ADMIN: "Content Administrator",
  EDUCATION_ADMIN: "Education Administrator",
  MEDIA_ADMIN: "Media Administrator",
  DOCUMENT_ADMIN: "Document Administrator",
  REGIONAL_EDITOR: "Regional Editor",
}

export const ARTICLE_STATUSES = ["DRAFT", "PUBLISHED"]
