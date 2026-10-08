import Link from "next/link"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, CalendarDays, User } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { ui, formatDate, type Locale } from "@/lib/locale-page"
import type { Metadata } from "next"
import { publicPageMetadata } from "@/lib/seo"
import { publicAssetUrl } from "@/lib/public-asset-url"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: value } = await params
  const locale = value === "sw" || value === "ar" ? value : "en"
  return publicPageMetadata(locale, "/documents", ui(locale, "documents.title"), ui(locale, "documents.desc"))
}

export default async function DocumentsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ category?: string }> }) {
  const { locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const sp = await searchParams
  const category = sp.category
  const [activeCategories, allDocs] = await Promise.all([
    db.category.findMany({ where: { type: "DOCUMENT", active: true }, orderBy: { name: "asc" }, select: { name: true } }),
    db.document.findMany({ where: { status: "PUBLISHED", deletedAt: null, OR: [{ archiveDate: null }, { archiveDate: { gt: new Date() } }] }, orderBy: { publishedAt: "desc" } }),
  ])
  const categories = activeCategories.map((item) => item.name)
  const allowedDocuments = allDocs.filter((document) => categories.includes(document.category))
  const documents = allowedDocuments.filter((document) => !category || document.category === category)

  return (
    <>
      <PageHero
        eyebrow={t("home.docs.eyebrow")}
        title={t("documents.title")}
        description={t("documents.desc")}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("documents.title") }]}
      />
      <Section>
        <div className="mb-8 flex flex-wrap gap-2">
          <Button asChild size="sm" variant={!category ? "default" : "outline"} className={!category ? "bg-primary" : ""}>
            <Link href={lp(locale, "/documents")}>{t("common.all")}</Link>
          </Button>
          {categories.map((c) => (
            <Button key={c} asChild size="sm" variant={category === c ? "default" : "outline"} className={category === c ? "bg-primary" : ""}>
              <Link href={lp(locale, `/documents?category=${encodeURIComponent(c)}`)}>{c}</Link>
            </Button>
          ))}
        </div>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">{t("documents.none")}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((d) => (
              <Card key={d.id} className="group flex flex-col border-border transition hover:border-primary/30 hover:shadow-card">
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent/15 text-accent">
                      <FileText className="h-5 w-5" />
                    </span>
                    <Badge variant="secondary" className="text-[0.65rem] uppercase">{d.fileType}</Badge>
                  </div>
                  <h3 className="mt-4 font-serif text-base font-semibold leading-snug text-foreground">{d.title}</h3>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">{d.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[0.65rem]">{d.category}</Badge>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDate(d.publishedAt, locale)}</span>
                  </div>
                  {d.author && <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3 w-3" />{d.author}</p>}
                  <a
                    href={publicAssetUrl(d.filePath)}
                    download
                    className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
                  >
                    <Download className="h-4 w-4" /> {t("common.download")}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </>
  )
}
