import { db } from "@/lib/db"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

export default async function AdminRegionsPage() {
  const regions = await db.region.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: "asc" } })
  return (
    <div>
      <AdminPageHeader title="Regions (Majimbo)" description={`${regions.length} regional branches across Tanzania.`} />
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40 text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-3 text-left font-medium">Jimbo</th><th className="px-4 py-3 text-left font-medium">English</th><th className="px-4 py-3 text-left font-medium">Order</th><th className="px-4 py-3 text-right font-medium">View</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {regions.map((r) => (
                <tr key={r.id} className="transition hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.englishName || "—"}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-[0.65rem]">#{r.sortOrder + 1}</Badge></td>
                  <td className="px-4 py-3 text-right"><Link href={`/regions/${r.slug}`} target="_blank" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent/20"><ExternalLink className="h-3.5 w-3.5 text-primary" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  )
}
