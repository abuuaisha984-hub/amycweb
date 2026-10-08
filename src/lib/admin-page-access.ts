import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { can } from "@/lib/permissions"

export async function requireAdminPermission(...permissions: string[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/admin/login")
  if (!permissions.some((permission) => can(session.user.role, permission))) notFound()
  return session
}

export async function requireSuperAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/admin/login")
  if (session.user.role !== "SUPER_ADMIN") notFound()
  return session
}
