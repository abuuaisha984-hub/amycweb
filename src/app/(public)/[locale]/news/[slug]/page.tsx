import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, Eyebrow } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, User, ArrowLeft, Newspaper } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { localizedField, ui, formatDate, type Locale } from "@/lib/locale-page"

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const article = await db.article.findUnique({ where: { slug } })
  if (!article || article.status !== "PUBLISHED" || article.deletedAt) notFound()

  const isExpired = article.expiresAt && article.expiresAt <= new Date()

  const related = await db.article.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      slug: { not: slug },
      OR: [{ category: article.category }, { kind: article.kind }],
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  })

  const title = localizedField(article, "title", locale, article.title)
  const excerpt = localizedField(article, "excerpt", locale, article.excerpt)
  const content = localizedField(article, "content", locale, article.content)
  const crumbLabel = article.category || t("news.article")

  return (
    <>
      <PageHero
        eyebrow={article.kind === "ANNOUNCEMENT" ? t("news.announcements") : t("news.news")}
        title={title}
        description={excerpt}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("news.title"), href: lp(locale, "/news") }, { label: crumbLabel }]}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr]">
          <article>
            <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDate(article.publishedAt!, locale, { day: "numeric", month: "long", year: "numeric" })}</span>
              {article.author && <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" />{article.author}</span>}
              {article.category && <Badge variant="secondary">{article.category}</Badge>}
              {isExpired && <Badge variant="outline" className="border-amber-500/40 text-amber-700">{t("news.archived")}</Badge>}
            </div>

            {article.featuredImage && (
              <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl bg-primary/5">
                <Image src={article.featuredImage} alt={article.title} fill sizes="(max-width: 1024px) 100vw, 70vw" className="object-cover" priority />
                {article.imageCredit && <p className="absolute bottom-2 end-2 rounded bg-background/80 px-2 py-0.5 text-[0.65rem] text-muted-foreground rtl:left-auto rtl:right-2">© {article.imageCredit}</p>}
              </div>
            )}

            <div className="prose prose-stone max-w-none dark:prose-invert prose-headings:font-serif prose-headings:font-semibold prose-a:text-primary">
              {content.split("\n").map((line, i) => {
                if (line.startsWith("## ")) return <h2 key={i} className="mt-8 font-serif text-xl font-semibold text-foreground">{line.slice(3)}</h2>
                if (line.startsWith("### ")) return <h3 key={i} className="mt-6 font-serif text-lg font-semibold text-foreground">{line.slice(4)}</h3>
                if (line.startsWith("- ")) return <li key={i} className="ms-4 text-muted-foreground">{line.slice(2)}</li>
                if (line.trim() === "") return <div key={i} className="h-3" />
                return <p key={i} className="text-base leading-relaxed text-muted-foreground">{line}</p>
              })}
            </div>

            <div className="mt-10 border-t border-border pt-6">
              <Button asChild variant="outline">
                <Link href={lp(locale, "/news")}><ArrowLeft className="me-1.5 h-4 w-4 rtl:rotate-180" /> {t("news.backToAll")}</Link>
              </Button>
            </div>
          </article>

          <aside className="space-y-6">
            {related.length > 0 && (
              <Card className="border-border">
                <CardContent className="p-6">
                  <Eyebrow>{t("news.related")}</Eyebrow>
                  <div className="mt-4 space-y-4">
                    {related.map((r) => (
                      <Link key={r.id} href={lp(locale, `/news/${r.slug}`)} className="group flex gap-3">
                        <div className="relative hidden h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-primary/5 sm:block">
                          {r.featuredImage ? (
                            <Image src={r.featuredImage} alt={r.title} fill sizes="80px" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-primary/30"><Newspaper className="h-5 w-5" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{formatDate(r.publishedAt!, locale)}</p>
                          <h4 className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">{localizedField(r, "title", locale, r.title)}</h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </Section>
    </>
  )
}
