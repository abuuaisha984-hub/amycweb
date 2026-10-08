import { AdminPageHeader } from "@/components/admin/page-header"
import { ProgrammeImagesManager } from "@/components/admin/programme-images-manager"
import { requireAdminPermission } from "@/lib/admin-page-access"

export default async function AdminProgrammesPage() {
  await requireAdminPermission("programme")
  return <div>
    <AdminPageHeader title="Programmes" description="Upload and replace the real photos shown on each programme across the public website." />
    <ProgrammeImagesManager />
  </div>
}
