import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Newspaper, ArrowRight } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { localizedField, ui, formatDate, type Locale } from "@/lib/locale-page"
import { publicImage } from "@/lib/public-image"
import type { Metadata } from "next"
import { publicPageMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: value } = await params
  const locale = value === "sw" || value === "ar" ? value : "en"
  return publicPageMetadata(locale, "/news", ui(locale, "news.title"), ui(locale, "news.desc"))
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const now = new Date()
  const where = {
    status: "PUBLISHED" as const,
    deletedAt: null,
    publishedAt: { lte: now },
    AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
  }
  const articles = await db.article.findMany({ where, orderBy: { publishedAt: "desc" } })
  const featured = articles.find((a) => a.featured) || articles[0]
  const rest = articles.filter((a) => a.id !== featured?.id)

  return (
    <>
      <PageHero
        eyebrow={t("home.news.eyebrow")}
        title={t("news.title")}
        description={t("news.desc")}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("news.title") }]}
      />
      <Section>
        {featured && (
          <Link
            href={lp(locale, `/news/${featured.slug}`)}
            className="group mb-10 grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-2"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-primary/5 lg:aspect-auto">
              {publicImage(featured.featuredImage) ? (
                <Image src={publicImage(featured.featuredImage)!} alt={featured.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center bg-pattern-dense text-primary/30"><Newspaper className="h-16 w-16" /></div>
              )}
              <div className="absolute start-4 top-4 flex gap-2 rtl:left-auto rtl:right-4">
                <Badge className="bg-accent text-accent-foreground hover:bg-accent">{t("news.featured")}</Badge>
                <Badge variant="secondary">{t("news.news")}</Badge>
              </div>
            </div>
            <div className="flex flex-col justify-center p-8">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(featured.publishedAt!, locale)}</span>
                {featured.category && <Badge variant="outline">{featured.category}</Badge>}
              </div>
              <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight text-foreground group-hover:text-primary text-balance">{localizedField(featured, "title", locale, featured.title)}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-4">{localizedField(featured, "excerpt", locale, featured.excerpt)}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">{t("common.readFullStory")} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5 rtl:rotate-180" /></span>
            </div>
          </Link>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a) => (
            <Link
              key={a.id}
              href={lp(locale, `/news/${a.slug}`)}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-primary/5">
                {publicImage(a.featuredImage) ? (
                  <Image src={publicImage(a.featuredImage)!} alt={a.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-pattern-dense text-primary/30"><Newspaper className="h-10 w-10" /></div>
                )}
                <div className="absolute end-3 top-3 rtl:left-auto rtl:right-3">
                  <Badge variant="secondary" className="text-[0.65rem]">{t("news.news")}</Badge>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" /> {formatDate(a.publishedAt!, locale)}
                  {a.category && <span>· {a.category}</span>}
                </div>
                <h3 className="mt-2 font-serif text-base font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">{localizedField(a, "title", locale, a.title)}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">{localizedField(a, "excerpt", locale, a.excerpt)}</p>
              </div>
            </Link>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <Newspaper className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">{t("news.none")}</p>
          </div>
        )}
      </Section>
    </>
  )
}
