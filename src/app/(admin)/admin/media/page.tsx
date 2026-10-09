import { AdminPageHeader } from "@/components/admin/page-header"
import { GalleriesManager } from "@/components/admin/galleries-manager"
import { requireAdminPermission } from "@/lib/admin-page-access"

export default async function AdminMediaPage() {
  const session = await requireAdminPermission("media", "gallery")
  return <div>
    <AdminPageHeader title="Media & Gallery" description={session.user.role === "SUPER_ADMIN" ? "Read-only oversight of galleries and media." : "Create image albums, upload photographs, edit captions, publish and archive galleries."} />
    <GalleriesManager readOnly={session.user.role === "SUPER_ADMIN"} />
  </div>
}
