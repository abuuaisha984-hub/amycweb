import { db } from "@/lib/db"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessagesList } from "@/components/admin/messages-list"
import { requireAdminPermission } from "@/lib/admin-page-access"
import { AdminPagination } from "@/components/admin/admin-pagination"

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdminPermission("contact")
  const query = await searchParams
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page
  const page = Math.max(1, Math.min(100_000, Number.parseInt(rawPage || "1", 10) || 1))
  const pageSize = 25
  const total = await db.contactMessage.count()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const currentMessages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, skip: (safePage - 1) * pageSize, take: pageSize })
  return (
    <div>
      <AdminPageHeader title="Messages" description="Inquiries submitted through the public contact form." />
      <MessagesList messages={JSON.parse(JSON.stringify(currentMessages))} readOnly={session.user.role === "SUPER_ADMIN"} />
      <AdminPagination page={safePage} totalPages={totalPages} />
    </div>
  )
}
