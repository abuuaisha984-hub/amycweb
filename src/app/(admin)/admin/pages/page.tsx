import { db } from "@/lib/db"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

export default async function AdminPagesPage() {
  const pages = await db.page.findMany({ orderBy: { updatedAt: "desc" } })
  return (
    <div>
      <AdminPageHeader title="Pages" description={`${pages.length} static pages (legal & informational).`} />
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40 text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-3 text-left font-medium">Title</th><th className="px-4 py-3 text-left font-medium">Slug</th><th className="px-4 py-3 text-left font-medium">Updated</th><th className="px-4 py-3 text-right font-medium">View</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pages.map((p) => (
                <tr key={p.id} className="transition hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground">{p.title}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-[0.65rem]">/{p.slug === "about" ? "about" : `page/${p.slug}`}</Badge></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-4 py-3 text-right"><Link href={p.slug === "about" ? "/about" : `/page/${p.slug}`} target="_blank" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent/20"><ExternalLink className="h-3.5 w-3.5 text-primary" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  )
}
