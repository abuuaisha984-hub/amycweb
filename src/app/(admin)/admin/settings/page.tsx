import { db } from "@/lib/db"
import { AdminPageHeader } from "@/components/admin/page-header"
import { SettingsForm } from "@/components/admin/settings-form"
import { requireSuperAdminPage } from "@/lib/admin-page-access"

export default async function AdminSettingsPage() {
  await requireSuperAdminPage()
  const rows = await db.siteSetting.findMany()
  const settings: Record<string, any> = {}
  for (const s of rows) {
    try { settings[s.key] = JSON.parse(s.value) } catch { settings[s.key] = s.value }
  }
  return (
    <div>
      <AdminPageHeader title="Settings" description="Read-only view of institutional information and homepage statistics." />
      <SettingsForm initial={JSON.parse(JSON.stringify(settings))} readOnly />
    </div>
  )
}
