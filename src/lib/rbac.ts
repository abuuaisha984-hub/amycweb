import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export type Role =
  | "SUPER_ADMIN"
  | "CONTENT_ADMIN"
  | "EDUCATION_ADMIN"
  | "MEDIA_ADMIN"
  | "DOCUMENT_ADMIN"
  | "REGIONAL_EDITOR"

/**
 * Role-Based Access Control matrix.
 * Each role maps to the entities it can manage.
 * SUPER_ADMIN has access to everything.
 */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ["*"],
  CONTENT_ADMIN: ["article", "event", "page", "gallery", "leader", "contact", "media"],
  EDUCATION_ADMIN: ["school", "leader", "article"],
  MEDIA_ADMIN: ["media", "gallery", "article"],
  DOCUMENT_ADMIN: ["document"],
  REGIONAL_EDITOR: ["article", "event"],
}

export function can(role: string | undefined, entity: string): boolean {
  if (!role) return false
  const perms = ROLE_PERMISSIONS[role as Role]
  if (!perms) return false
  return perms.includes("*") || perms.includes(entity)
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
