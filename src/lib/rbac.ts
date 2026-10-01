import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export type Role = "SUPER_ADMIN" | "ADMIN"

/**
 * Role-Based Access Control matrix (simplified to 2 roles).
 *
 * SUPER_ADMIN — the developer / system maintainer. Full access including
 *   user management, settings, audit log, and all content operations.
 *   Can add features and perform full maintenance.
 *
 * ADMIN — the operator. Handles all day-to-day content management:
 *   news, announcements, documents, schools, regions, events, media,
 *   gallery, pages, leadership, and contact messages. Essentially
 *   everything except super-admin-only functions (user management,
 *   settings, audit log).
 */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: ["article", "event", "page", "gallery", "leader", "contact", "media", "school", "region", "document", "programme"],
}

export function can(role: string | undefined, entity: string): boolean {
  if (!role) return false
  const perms = ROLE_PERMISSIONS[role as Role]
  if (!perms) return false
  return perms.includes("*") || perms.includes(entity)
}

/** Super-admin-only functions (user management, settings, audit). */
export function isSuperAdmin(role: string | undefined): boolean {
  return role === "SUPER_ADMIN"
}

export async function getSession() {
  return getServerSession(authOptions)
}

export async function requireRole(entity: string) {
  const session = await getSession()
  if (!session?.user) {
    return { ok: false as const, status: 401, message: "Unauthorized" }
  }
  if (!can(session.user.role, entity)) {
    return { ok: false as const, status: 403, message: "Forbidden" }
  }
  return { ok: true as const, session }
}

/** Require super admin for sensitive operations. */
export async function requireSuperAdmin() {
  const session = await getSession()
  if (!session?.user) {
    return { ok: false as const, status: 401, message: "Unauthorized" }
  }
  if (!isSuperAdmin(session.user.role)) {
    return { ok: false as const, status: 403, message: "Forbidden — Super Admin only" }
  }
  return { ok: true as const, session }
}

/**
 * Audit log writer.
 */
export async function writeAudit(opts: {
  userId?: string
  userName: string
  action: string
  entity: string
  entityId?: string
  detail: string
  ip?: string
}) {
  try {
    await db.auditLog.create({ data: opts })
  } catch (e) {
    console.error("audit log failed", e)
  }
}
