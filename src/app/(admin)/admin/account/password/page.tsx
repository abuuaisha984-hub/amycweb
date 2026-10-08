import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ChangePasswordForm } from "@/components/admin/change-password-form"
import { AdminPageHeader } from "@/components/admin/page-header"

export default async function AdminPasswordPage() {
  const session = await getServerSession(authOptions)
  return <div className="space-y-6">
    <AdminPageHeader title="Account security" description={`Signed in as ${session?.user?.email || "administrator"}`} />
    <ChangePasswordForm required={!!session?.user?.mustChangePassword} />
  </div>
}
