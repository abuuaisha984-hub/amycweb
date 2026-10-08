import { AdminPageHeader } from "@/components/admin/page-header"
import { GalleriesManager } from "@/components/admin/galleries-manager"
import { requireAdminPermission } from "@/lib/admin-page-access"

export default async function AdminMediaPage() {
  await requireAdminPermission("media", "gallery")
  return <div>
    <AdminPageHeader title="Media & Gallery" description="Create image albums, upload photographs, edit captions, publish and archive galleries." />
    <GalleriesManager />
  </div>
}
