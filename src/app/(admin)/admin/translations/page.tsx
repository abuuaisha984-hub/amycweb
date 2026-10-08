import { db } from "@/lib/db"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { parseTranslations } from "@/lib/i18n"
import { Check, Minus } from "lucide-react"
import { requireAdminPermission } from "@/lib/admin-page-access"

function trStatus(translations: string | null): { sw: boolean; ar: boolean } {
  const t = parseTranslations(translations)
  return {
    sw: !!(t.sw?.title && t.sw?.excerpt && t.sw?.content) || !!(t.sw?.name && t.sw?.shortDescription) || !!(t.sw?.overview),
    ar: !!(t.ar?.title && t.ar?.excerpt && t.ar?.content) || !!(t.ar?.name && t.ar?.shortDescription) || !!(t.ar?.overview),
  }
}

function StatusCell({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
      <Check className="h-3.5 w-3.5" />
    </span>
  ) : (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
      <Minus className="h-3.5 w-3.5" />
    </span>
  )
}

export default async function TranslationStatusPage() {
  await requireAdminPermission("article")
  const [articles, programmes, schools, regions, pages] = await Promise.all([
    db.article.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, select: { id: true, title: true, translations: true, kind: true } }),
    db.programme.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, translations: true } }),
    db.school.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, orderBy: { name: "asc" }, select: { id: true, name: true, translations: true } }),
    db.region.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, translations: true } }),
    db.page.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true, translations: true } }),
  ])

  const sections = [
    { label: "News", items: articles.map((a: any) => ({ id: a.id, name: a.title, tr: a.translations, badge: "News" })) },
    { label: "Programmes", items: programmes.map((p: any) => ({ id: p.id, name: p.name, tr: p.translations })) },
    { label: "Schools", items: schools.map((s: any) => ({ id: s.id, name: s.name, tr: s.translations })) },
    { label: "Regions (Majimbo)", items: regions.map((r: any) => ({ id: r.id, name: r.name, tr: r.translations })) },
    { label: "Pages", items: pages.map((p: any) => ({ id: p.id, name: p.title, tr: p.translations })) },
  ]

  // Summary counts
  const allItems = sections.flatMap((s) => s.items)
  const total = allItems.length
  const swComplete = allItems.filter((i) => trStatus(i.tr).sw).length
  const arComplete = allItems.filter((i) => trStatus(i.tr).ar).length

  return (
    <div>
      <AdminPageHeader
        title="Translation Status"
        description="Overview of which content has been translated into Kiswahili and Arabic. English is always complete (it's the source language)."
      />

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total content items</p>
              <p className="mt-1 font-serif text-3xl font-semibold text-foreground">{total}</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">EN</span>
          </div>
          <p className="mt-2 text-xs text-emerald-600">✓ English (source) — 100% complete</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Kiswahili translations</p>
              <p className="mt-1 font-serif text-3xl font-semibold text-foreground">{swComplete}<span className="text-lg text-muted-foreground">/{total}</span></p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent font-bold text-sm">SW</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${total ? (swComplete / total) * 100 : 0}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{total ? Math.round((swComplete / total) * 100) : 0}% complete</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Arabic translations</p>
              <p className="mt-1 font-serif text-3xl font-semibold text-foreground">{arComplete}<span className="text-lg text-muted-foreground">/{total}</span></p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">ع</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${total ? (arComplete / total) * 100 : 0}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{total ? Math.round((arComplete / total) * 100) : 0}% complete</p>
        </CardContent></Card>
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><StatusCell ok={true} /> Translated</span>
        <span className="inline-flex items-center gap-1.5"><StatusCell ok={false} /> Pending</span>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <Card key={section.label} className="mb-4">
          <CardContent className="p-0">
            <div className="border-b bg-secondary/40 px-4 py-2.5">
              <h2 className="font-serif text-sm font-semibold">{section.label} <span className="text-muted-foreground">({section.items.length})</span></h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left font-medium">Content</th>
                    <th className="px-4 py-2 text-center font-medium">EN</th>
                    <th className="px-4 py-2 text-center font-medium">SW</th>
                    <th className="px-4 py-2 text-center font-medium">AR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {section.items.map((item) => {
                    const ts = trStatus(item.tr)
                    return (
                      <tr key={item.id} className="transition hover:bg-secondary/20">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-foreground">{item.name}</span>
                            {(item as any).badge && <Badge variant="outline" className="text-[0.6rem] shrink-0">{(item as any).badge}</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center"><StatusCell ok={true} /></td>
                        <td className="px-4 py-2.5 text-center"><StatusCell ok={ts.sw} /></td>
                        <td className="px-4 py-2.5 text-center"><StatusCell ok={ts.ar} /></td>
                      </tr>
                    )
                  })}
                  {section.items.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">No items.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
