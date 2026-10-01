import { db } from "@/lib/db"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

const TYPE_LABEL: Record<string, string> = { MAAHAD: "Maahad", SECONDARY: "Secondary", PRIMARY: "Primary", COLLEGE: "College" }

export default async function AdminSchoolsPage() {
  const schools = await db.school.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  const byType = schools.reduce((acc, s) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc }, {} as Record<string, number>)
  return (
    <div>
      <AdminPageHeader title="Schools" description={`${schools.length} schools and institutions across the AMYC network.`} />
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(byType).map(([t, c]) => <Badge key={t} variant="secondary">{TYPE_LABEL[t] || t}: {c}</Badge>)}
      </div>
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40 text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-3 text-left font-medium">Name</th><th className="px-4 py-3 text-left font-medium">Type</th><th className="px-4 py-3 text-left font-medium">Region</th><th className="px-4 py-3 text-left font-medium">Verification</th><th className="px-4 py-3 text-right font-medium">View</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schools.map((s) => (
                <tr key={s.id} className="transition hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-[0.65rem]">{TYPE_LABEL[s.type] || s.type}</Badge></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.region || "—"}</td>
                  <td className="px-4 py-3"><Badge variant="secondary" className={`text-[0.65rem] ${s.verificationStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{s.verificationStatus}</Badge></td>
                  <td className="px-4 py-3 text-right"><Link href={`/education/${s.slug}`} target="_blank" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent/20"><ExternalLink className="h-3.5 w-3.5 text-primary" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  )
}
