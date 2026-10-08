export type AdminRole = "SUPER_ADMIN" | "CONTENT_ADMIN" | "EDUCATION_ADMIN" | "MEDIA_ADMIN" | "DOCUMENT_ADMIN" | "REGIONAL_EDITOR" | "ADMIN"

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  // System administration only; daily institutional content is managed by ADMIN.
  SUPER_ADMIN: ["users", "settings", "audit"],
  CONTENT_ADMIN: ["article", "event", "leader", "analytics"],
  EDUCATION_ADMIN: ["school", "programme", "analytics"],
  MEDIA_ADMIN: ["media", "gallery", "analytics"],
  DOCUMENT_ADMIN: ["document", "analytics"],
  // Events have no region ownership field yet, so regional editors must not
  // receive global event access until the data model can enforce a scope.
  REGIONAL_EDITOR: ["article", "region", "leader", "analytics"],
  // Keep existing accounts working until an administrator explicitly migrates them.
  ADMIN: ["article", "event", "gallery", "leader", "contact", "media", "school", "region", "document", "programme", "analytics"],
}

export function can(role: string | undefined, entity: string): boolean {
  if (!role || !Object.hasOwn(ROLE_PERMISSIONS, role)) return false
  const permissions = ROLE_PERMISSIONS[role as AdminRole]
  return permissions.includes("*") || permissions.includes(entity)
}

export function canAccessAdminPath(role: string | undefined, pathname: string): boolean {
  if (pathname === "/admin" || pathname === "/admin/") return !!role
  const sections: Array<[string, string]> = [
    ["/admin/news", "article"], ["/admin/events", "event"], ["/admin/analytics", "analytics"], ["/admin/leaders", "leader"],
    ["/admin/translations", "article"], ["/admin/schools", "school"], ["/admin/programmes", "programme"], ["/admin/regions", "region"],
    ["/admin/media", "media"], ["/admin/documents", "document"], ["/admin/messages", "contact"],
    ["/admin/audit", "audit"], ["/admin/settings", "settings"], ["/admin/users", "users"],
  ]
  const section = sections.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  return section ? can(role, section[1]) : !!role
}
