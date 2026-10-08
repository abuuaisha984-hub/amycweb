import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/admin/shell"
import { assertPresent } from "@/lib/assert-present"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/admin/login")
  assertPresent(session)
  assertPresent(session.user)
  if (session.user.mustChangePassword) redirect("/admin/account/password")
  return <AdminShell user={session.user}>{children}</AdminShell>
}
