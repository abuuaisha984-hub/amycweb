import { AdminPageHeader } from "@/components/admin/page-header"
import { ProgrammeImagesManager } from "@/components/admin/programme-images-manager"
import { requireAdminPermission } from "@/lib/admin-page-access"

export default async function AdminProgrammesPage() {
  const session = await requireAdminPermission("programme")
  return <div>
    <AdminPageHeader title="Programmes" description={session.user.role === "SUPER_ADMIN" ? "Read-only oversight of programme information and media." : "Upload and replace the real photos shown on each programme across the public website."} />
    <ProgrammeImagesManager readOnly={session.user.role === "SUPER_ADMIN"} />
  </div>
}
