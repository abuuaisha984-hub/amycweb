import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { canRead, canWrite } from "@/lib/permissions"

export { can, canRead, canWrite, ROLE_PERMISSIONS } from "@/lib/permissions"

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
  if (!canWrite(session.user.role, entity)) {
    return { ok: false as const, status: 403, message: "Forbidden" }
  }
  return { ok: true as const, session }
}

/** Require a role to inspect a module without granting content mutation rights. */
export async function requireReadRole(entity: string) {
  const session = await getSession()
  if (!session?.user) return { ok: false as const, status: 401, message: "Unauthorized" }
  if (!canRead(session.user.role, entity)) return { ok: false as const, status: 403, message: "Forbidden" }
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
