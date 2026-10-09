import { notFound, redirect } from "next/navigation"
import { getAdminPageSession } from "@/lib/admin-page-session"
import { canRead } from "@/lib/permissions"

export async function requireAdminPermission(...permissions: string[]) {
  const session = await getAdminPageSession()
  if (!session?.user) redirect("/admin/login")
  if (!permissions.some((permission) => canRead(session.user.role, permission))) notFound()
  return session
}

export async function requireSuperAdminPage() {
  const session = await getAdminPageSession()
  if (!session?.user) redirect("/admin/login")
  if (session.user.role !== "SUPER_ADMIN") notFound()
  return session
}
