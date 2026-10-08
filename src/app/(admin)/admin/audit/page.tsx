import { db } from "@/lib/db"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { requireSuperAdminPage } from "@/lib/admin-page-access"
import { AdminPagination } from "@/components/admin/admin-pagination"

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const actionColor: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  PUBLISH: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  UPLOAD: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  LOGIN: "bg-muted text-muted-foreground",
  SYSTEM: "bg-muted text-muted-foreground",
}

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireSuperAdminPage()
  const query = await searchParams
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page
  const page = Math.max(1, Math.min(100_000, Number.parseInt(rawPage || "1", 10) || 1))
  const pageSize = 50
  const total = await db.auditLog.count()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const currentLogs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: (safePage - 1) * pageSize, take: pageSize })
  return (
    <div>
      <AdminPageHeader title="Audit Log" description="A record of administrative actions across the platform for accountability." />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-secondary/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">When</th>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Entity</th>
                  <th className="px-4 py-3 text-left font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentLogs.map((l) => (
                  <tr key={l.id} className="transition hover:bg-secondary/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(l.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{l.userName}</td>
                    <td className="px-4 py-3"><Badge className={`${actionColor[l.action] || "bg-muted text-muted-foreground"} text-[0.65rem]`} variant="secondary">{l.action}</Badge></td>
                    <td className="px-4 py-3 text-xs">{l.entity}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <AdminPagination page={safePage} totalPages={totalPages} />
    </div>
  )
}
