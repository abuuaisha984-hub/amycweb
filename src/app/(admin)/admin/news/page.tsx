import { AdminPageHeader } from "@/components/admin/page-header"
import { NewsManager } from "@/components/admin/news-manager"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { canRead } from "@/lib/permissions"
import { Card, CardContent } from "@/components/ui/card"
import { Lock } from "lucide-react"
import { db } from "@/lib/db"

export default async function AdminNewsPage() {
  const session = await getServerSession(authOptions)
  if (!canRead(session?.user?.role, "article")) {
    return (
      <div>
        <AdminPageHeader title="News" description="You do not have permission to manage articles." />
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Lock className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">This module requires Content or Super Admin privileges. Regional Editors can only manage content assigned to their region.</p>
        </CardContent></Card>
      </div>
    )
  }
  const regions = await db.region.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      ...(session?.user?.role === "REGIONAL_EDITOR" ? { id: session.user.scopeRegionId || "" } : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
  return (
    <div>
      <AdminPageHeader
        title="News"
        description="Create, edit and manage institutional news. Items with an expiry date are archived automatically."
      />
      <NewsManager role={session?.user?.role || ""} regions={regions} readOnly={session?.user?.role === "SUPER_ADMIN"} />
    </div>
  )
}
