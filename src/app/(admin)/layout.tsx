import { getAdminPageSession } from "@/lib/admin-page-session"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/admin/shell"
import { assertPresent } from "@/lib/assert-present"
import { isAdminRole } from "@/lib/permissions"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminPageSession()
  if (!session?.user) redirect("/admin/login")
  assertPresent(session)
  assertPresent(session.user)
  if (session.user.mustChangePassword) return <AdminShell user={session.user}>{children}</AdminShell>
  if (!isAdminRole(session.user.role)) redirect("/admin/login")
  return <AdminShell user={session.user}>{children}</AdminShell>
}
