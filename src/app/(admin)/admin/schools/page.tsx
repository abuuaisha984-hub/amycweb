import { AdminPageHeader } from "@/components/admin/page-header"
import { SchoolsManager } from "@/components/admin/schools-manager"
import { requireAdminPermission } from "@/lib/admin-page-access"

export default async function AdminSchoolsPage() {
  const session = await requireAdminPermission("school")
  return <div>
    <AdminPageHeader title="Schools" description={session.user.role === "SUPER_ADMIN" ? "Read-only oversight of school profiles and publication status." : "Add and maintain school profiles. Drafts remain private; only verified, published profiles appear in the public directory."} />
    <div data-admin-readonly={session.user.role === "SUPER_ADMIN" ? "true" : undefined}><SchoolsManager /></div>
  </div>
}
