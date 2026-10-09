import { AdminPageHeader } from "@/components/admin/page-header"
import { DocumentsManager } from "@/components/admin/documents-manager"
import { getAdminPageSession } from "@/lib/admin-page-session"
import { canRead } from "@/lib/permissions"
import { Card, CardContent } from "@/components/ui/card"
import { Lock } from "lucide-react"

export default async function AdminDocumentsPage() {
  const session = await getAdminPageSession()
  if (!canRead(session?.user?.role, "document")) {
    return (
      <div>
        <AdminPageHeader title="Documents" description="You do not have permission to view documents." />
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Lock className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">This module requires Administrator privileges.</p>
        </CardContent></Card>
      </div>
    )
  }
  return (
    <div>
      <AdminPageHeader title="Documents" description={session?.user?.role === "SUPER_ADMIN" ? "Read-only oversight of reports, policies, forms and publications." : "Upload and manage reports, policies, forms and publications. All uploads are validated for type and size."} />
      <DocumentsManager readOnly={session?.user?.role === "SUPER_ADMIN"} />
    </div>
  )
}
