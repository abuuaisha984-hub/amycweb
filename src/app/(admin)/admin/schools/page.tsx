import { AdminPageHeader } from "@/components/admin/page-header"
import { SchoolsManager } from "@/components/admin/schools-manager"
import { requireAdminPermission } from "@/lib/admin-page-access"

export default async function AdminSchoolsPage() {
  await requireAdminPermission("school")
  return <div>
    <AdminPageHeader title="Schools" description="Add and maintain school profiles. Drafts remain private; only verified, published profiles appear in the public directory." />
    <SchoolsManager />
  </div>
}
