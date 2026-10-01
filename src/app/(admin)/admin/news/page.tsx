import { AdminPageHeader } from "@/components/admin/page-header"
import { NewsManager } from "@/components/admin/news-manager"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { can } from "@/lib/rbac"
import { Card, CardContent } from "@/components/ui/card"
import { Lock } from "lucide-react"

export default async function AdminNewsPage() {
  const session = await getServerSession(authOptions)
  if (!can(session?.user?.role, "article")) {
    return (
      <div>
        <AdminPageHeader title="News & Announcements" description="You do not have permission to manage articles." />
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Lock className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">This module requires Content, Education, Media or Super Admin privileges.</p>
        </CardContent></Card>
      </div>
    )
  }
  return (
    <div>
      <AdminPageHeader
        title="News & Announcements"
        description="Create, edit and manage institutional news and announcements. Announcements with an expiry date auto-archive."
      />
      <NewsManager />
    </div>
  )
}
