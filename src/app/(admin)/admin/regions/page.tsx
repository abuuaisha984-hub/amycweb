import { AdminPageHeader } from "@/components/admin/page-header"
import { RegionsManager } from "@/components/admin/regions-manager"
import { requireAdminPermission } from "@/lib/admin-page-access"

export default async function AdminRegionsPage() {
  const session = await requireAdminPermission("region")
  const role = session.user.role || ""
  return <div>
    <AdminPageHeader title="Regions (Majimbo)" description="Maintain regional profiles and verified administrative locations. Draft regions stay private until publication." />
    <div data-admin-readonly={role === "SUPER_ADMIN" ? "true" : undefined}><RegionsManager role={role} /></div>
  </div>
}
