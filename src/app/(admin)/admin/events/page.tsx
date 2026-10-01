import { db } from "@/lib/db"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function fmtDate(d: Date) { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) }

export default async function AdminEventsPage() {
  const now = new Date()
  const [upcoming, past] = await Promise.all([
    db.event.findMany({ where: { deletedAt: null, startDate: { gte: now } }, orderBy: { startDate: "asc" } }),
    db.event.findMany({ where: { deletedAt: null, startDate: { lt: now } }, orderBy: { startDate: "desc" } }),
  ])
  return (
    <div>
      <AdminPageHeader title="Events" description={`${upcoming.length} upcoming · ${past.length} past events.`} />
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40 text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-3 text-left font-medium">Title</th><th className="px-4 py-3 text-left font-medium">Date</th><th className="px-4 py-3 text-left font-medium">Location</th><th className="px-4 py-3 text-left font-medium">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...upcoming, ...past].map((e) => {
                const isPast = e.startDate < now
                return (
                  <tr key={e.id} className="transition hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{e.title}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(e.startDate)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.location || e.venue || "—"}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className={`text-[0.65rem] ${isPast ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-800"}`}>{isPast ? "Past" : "Upcoming"}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  )
}
