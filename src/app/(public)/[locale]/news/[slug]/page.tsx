import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, Eyebrow } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, User, ArrowLeft, Newspaper } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { localizedField, ui, formatDate, type Locale } from "@/lib/locale-page"
import { publicImage } from "@/lib/public-image"
import { assertPresent } from "@/lib/assert-present"
import type { Metadata } from "next"
import { publicPageMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale: value } = await params
  const locale = value === "sw" || value === "ar" ? value : "en"
  const article = await db.article.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null, publishedAt: { lte: new Date() }, AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }] },
    select: { title: true, excerpt: true, translations: true, featuredImage: true },
  })
  if (!article) return { title: "News", robots: { index: false, follow: false } }
  return publicPageMetadata(locale, `/news/${encodeURIComponent(slug)}`, localizedField(article, "title", locale, article.title), localizedField(article, "excerpt", locale, article.excerpt), publicImage(article.featuredImage))
}

function safeMarkdownHref(href: string): string | null {
  if (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\")) return href
  try {
    const parsed = new URL(href)
    return parsed.protocol === "https:" ? parsed.toString() : null
  } catch {
    return null
  }
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*/g
  const nodes: ReactNode[] = []
  let cursor = 0
  let match: RegExpExecArray | null
  let index = 0
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index))
    const key = `${keyPrefix}-${index++}`
    if (match[1] && match[2]) {
      const href = safeMarkdownHref(match[2])
      nodes.push(href
        ? <a key={key} href={href} target={href.startsWith("https:") ? "_blank" : undefined} rel={href.startsWith("https:") ? "noopener noreferrer" : undefined}>{match[1]}</a>
        : match[1])
    } else if (match[3]) nodes.push(<strong key={key}>{match[3]}</strong>)
    else if (match[4]) nodes.push(<em key={key}>{match[4]}</em>)
    cursor = pattern.lastIndex
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

function renderArticleContent(content: string): ReactNode[] {
  const lines = content.split(/\r?\n/)
  const nodes: ReactNode[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) { index++; continue }
    if (line.startsWith("## ")) {
      nodes.push(<h2 key={index} className="mt-8 font-serif text-xl font-semibold text-foreground">{renderInline(line.slice(3), `h2-${index}`)}</h2>)
      index++
      continue
    }
    if (line.startsWith("### ")) {
      nodes.push(<h3 key={index} className="mt-6 font-serif text-lg font-semibold text-foreground">{renderInline(line.slice(4), `h3-${index}`)}</h3>)
      index++
      continue
    }
    if (line.startsWith("- ")) {
      const items: ReactNode[] = []
      while (index < lines.length && lines[index].startsWith("- ")) {
        items.push(<li key={index}>{renderInline(lines[index].slice(2), `ul-${index}`)}</li>)
        index++
      }
      nodes.push(<ul key={`ul-${index}`} className="my-4 list-disc space-y-1 ps-6 text-muted-foreground">{items}</ul>)
      continue
    }
    if (/^\d+\.\s/.test(line)) {
      const items: ReactNode[] = []
      while (index < lines.length && /^\d+\.\s/.test(lines[index])) {
        items.push(<li key={index}>{renderInline(lines[index].replace(/^\d+\.\s/, ""), `ol-${index}`)}</li>)
        index++
      }
      nodes.push(<ol key={`ol-${index}`} className="my-4 list-decimal space-y-1 ps-6 text-muted-foreground">{items}</ol>)
      continue
    }
    if (line.startsWith("> ")) {
      const quote: string[] = []
      while (index < lines.length && lines[index].startsWith("> ")) {
        quote.push(lines[index].slice(2))
        index++
      }
      nodes.push(<blockquote key={`quote-${index}`} className="my-5 border-s-4 border-primary/40 ps-4 italic text-muted-foreground">{quote.map((part, quoteIndex) => <p key={quoteIndex}>{renderInline(part, `quote-${index}-${quoteIndex}`)}</p>)}</blockquote>)
      continue
    }
    const paragraph: string[] = []
    while (index < lines.length && lines[index].trim() && !lines[index].startsWith("## ") && !lines[index].startsWith("### ") && !lines[index].startsWith("- ") && !/^\d+\.\s/.test(lines[index]) && !lines[index].startsWith("> ")) {
      paragraph.push(lines[index])
      index++
    }
    nodes.push(<p key={`p-${index}`} className="text-base leading-relaxed text-muted-foreground">{paragraph.map((part, partIndex) => <span key={partIndex}>{partIndex > 0 && <br />}{renderInline(part, `p-${index}-${partIndex}`)}</span>)}</p>)
  }
  return nodes
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const article = await db.article.findUnique({ where: { slug } })
  assertPresent(article)
  const now = new Date()
  if (!article || article.status !== "PUBLISHED" || article.deletedAt || !article.publishedAt || article.publishedAt > now || (article.expiresAt && article.expiresAt <= now)) notFound()

  const isExpired = article.expiresAt && article.expiresAt <= new Date()

  const related = await db.article.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { lte: now },
      slug: { not: slug },
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
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
        eyebrow={t("news.news")}
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

            {publicImage(article.featuredImage) && (
              <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl bg-primary/5">
                <Image src={publicImage(article.featuredImage)!} alt={article.title} fill sizes="(max-width: 1024px) 100vw, 70vw" className="object-cover" priority />
                {article.imageCredit && <p className="absolute bottom-2 end-2 rounded bg-background/80 px-2 py-0.5 text-[0.65rem] text-muted-foreground rtl:left-auto rtl:right-2">© {article.imageCredit}</p>}
              </div>
            )}

            <div className="prose prose-stone max-w-none dark:prose-invert prose-headings:font-serif prose-headings:font-semibold prose-a:text-primary">
              {renderArticleContent(content)}
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
                          {publicImage(r.featuredImage) ? (
                            <Image src={publicImage(r.featuredImage)!} alt={r.title} fill sizes="80px" className="object-cover" />
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
