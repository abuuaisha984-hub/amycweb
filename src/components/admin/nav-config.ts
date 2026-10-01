export type AdminNav = { label: string; href: string; icon: string; entity?: string; superAdminOnly?: boolean }

export const ADMIN_NAV: AdminNav[] = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "News & Announcements", href: "/admin/news", icon: "Newspaper", entity: "article" },
  { label: "Events", href: "/admin/events", icon: "CalendarDays", entity: "event" },
  { label: "Schools", href: "/admin/schools", icon: "GraduationCap", entity: "school" },
  { label: "Regions (Majimbo)", href: "/admin/regions", icon: "MapPin", entity: "region" },
  { label: "Documents", href: "/admin/documents", icon: "FolderOpen", entity: "document" },
  { label: "Media & Gallery", href: "/admin/media", icon: "Image", entity: "media" },
  { label: "Messages", href: "/admin/messages", icon: "Mail", entity: "contact" },
  { label: "Pages", href: "/admin/pages", icon: "FileText", entity: "page" },
  { label: "Translation Status", href: "/admin/translations", icon: "Languages", entity: "article" },
  { label: "Audit Log", href: "/admin/audit", icon: "ScrollText", superAdminOnly: true },
  { label: "Settings", href: "/admin/settings", icon: "Settings", superAdminOnly: true },
]

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "System Administrator",
  ADMIN: "Administrator",
}

export const ARTICLE_STATUSES = ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]
export const ARTICLE_KINDS = ["NEWS", "ANNOUNCEMENT"]
