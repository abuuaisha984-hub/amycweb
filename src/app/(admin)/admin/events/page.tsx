import { AdminPageHeader } from "@/components/admin/page-header"
import { EventsManager } from "@/components/admin/events-manager"
import { requireAdminPermission } from "@/lib/admin-page-access"

export default async function AdminEventsPage() {
  const session = await requireAdminPermission("event")
  return <div>
    <AdminPageHeader title="Events" description={session.user.role === "SUPER_ADMIN" ? "Read-only oversight of institutional events." : "Create, edit, publish and archive institutional events."} />
    <EventsManager readOnly={session.user.role === "SUPER_ADMIN"} />
  </div>
}
