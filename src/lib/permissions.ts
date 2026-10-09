export type AdminRole = "SUPER_ADMIN" | "CONTENT_ADMIN" | "EDUCATION_ADMIN" | "MEDIA_ADMIN" | "DOCUMENT_ADMIN" | "REGIONAL_EDITOR" | "ADMIN"

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  // Content permissions are operational write permissions. Super Admin content
  // oversight is granted separately through canRead, never through this list.
  SUPER_ADMIN: [],
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

export function isAdminRole(role: unknown): role is AdminRole {
  return typeof role === "string" && Object.hasOwn(ROLE_PERMISSIONS, role)
}

export function canWrite(role: string | undefined, entity: string): boolean {
  if (!isAdminRole(role)) return false
  const permissions = ROLE_PERMISSIONS[role as AdminRole]
  return permissions.includes("*") || permissions.includes(entity)
}

/** Super Admin has read access to every authorized module, but no content writes. */
export function canRead(role: string | undefined, entity: string): boolean {
  if (!isAdminRole(role)) return false
  return role === "SUPER_ADMIN" || canWrite(role, entity)
}

/** Backwards compatible name now means write permission; read paths must use canRead. */
export const can = canWrite

export function canAccessAdminPath(role: string | undefined, pathname: string): boolean {
  if (pathname === "/admin" || pathname === "/admin/") return isAdminRole(role)
  const sections: Array<[string, string]> = [
    ["/admin/news", "article"], ["/admin/events", "event"], ["/admin/analytics", "analytics"], ["/admin/leaders", "leader"],
    ["/admin/translations", "article"], ["/admin/schools", "school"], ["/admin/programmes", "programme"], ["/admin/regions", "region"],
    ["/admin/media", "media"], ["/admin/documents", "document"], ["/admin/messages", "contact"],
    ["/admin/audit", "audit"], ["/admin/settings", "settings"], ["/admin/users", "users"],
  ]
  const section = sections.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  return section ? canRead(role, section[1]) : isAdminRole(role)
}
