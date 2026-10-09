import { getAdminPageSession } from "@/lib/admin-page-session"
import { ChangePasswordForm } from "@/components/admin/change-password-form"
import { AdminPageHeader } from "@/components/admin/page-header"

export default async function AdminPasswordPage() {
  const session = await getAdminPageSession()
  return <div className="space-y-6">
    <AdminPageHeader title="Account security" description={`Signed in as ${session?.user?.email || "administrator"}`} />
    <ChangePasswordForm required={!!session?.user?.mustChangePassword} />
  </div>
}
