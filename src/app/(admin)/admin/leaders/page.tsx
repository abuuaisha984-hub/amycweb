import { AdminPageHeader } from "@/components/admin/page-header"
import { LeadersManager } from "@/components/admin/leaders-manager"
import { requireAdminPermission } from "@/lib/admin-page-access"

export default async function AdminLeadersPage() {
  const session = await requireAdminPermission("leader")
  return <div>
    <AdminPageHeader title="Leadership" description="Manage active and former national or regional leadership records, including public biographies and role dates." />
    <div data-admin-readonly={session?.user?.role === "SUPER_ADMIN" ? "true" : undefined}><LeadersManager role={session?.user?.role || ""} /></div>
  </div>
}
