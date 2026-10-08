import { requireSuperAdminPage } from "@/lib/admin-page-access"
import { AdminPageHeader } from "@/components/admin/page-header"
import { AdminUsersManager } from "@/components/admin/admin-users-manager"

export default async function AdminUsersPage() {
  await requireSuperAdminPage()
  return <div className="space-y-6">
    <AdminPageHeader title="Admin accounts" description="Create and manage the institution’s website administrators." />
    <AdminUsersManager />
  </div>
}
