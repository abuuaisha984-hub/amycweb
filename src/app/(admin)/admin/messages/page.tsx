import { db } from "@/lib/db"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessagesList } from "@/components/admin/messages-list"

export default async function AdminMessagesPage() {
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
  return (
    <div>
      <AdminPageHeader title="Messages" description="Inquiries submitted through the public contact form." />
      <MessagesList messages={JSON.parse(JSON.stringify(messages))} />
    </div>
  )
}
