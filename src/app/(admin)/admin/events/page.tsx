import { AdminPageHeader } from "@/components/admin/page-header"
import { EventsManager } from "@/components/admin/events-manager"
import { requireAdminPermission } from "@/lib/admin-page-access"

export default async function AdminEventsPage() {
  await requireAdminPermission("event")
  return <div>
    <AdminPageHeader title="Events" description="Create, edit, publish and archive institutional events." />
    <EventsManager />
  </div>
}
