import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, Eyebrow } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, User, ArrowLeft, ArrowRight, Newspaper } from "lucide-react"

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
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

  return (
    <>
      <PageHero
        eyebrow={article.kind === "ANNOUNCEMENT" ? "Announcement" : "News"}
        title={article.title}
        description={article.excerpt}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "News", href: "/news" }, { label: article.category || "Article" }]}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr]">
          <article>
            <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{fmtDate(article.publishedAt!)}</span>
              {article.author && <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" />{article.author}</span>}
              {article.category && <Badge variant="secondary">{article.category}</Badge>}
              {isExpired && <Badge variant="outline" className="border-amber-500/40 text-amber-700">Archived</Badge>}
            </div>

            {article.featuredImage && (
              <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl bg-primary/5">
                <Image src={article.featuredImage} alt={article.title} fill sizes="(max-width: 1024px) 100vw, 70vw" className="object-cover" priority />
                {article.imageCredit && <p className="absolute bottom-2 right-2 rounded bg-background/80 px-2 py-0.5 text-[0.65rem] text-muted-foreground">© {article.imageCredit}</p>}
              </div>
            )}

            <div className="prose prose-stone max-w-none dark:prose-invert prose-headings:font-serif prose-headings:font-semibold prose-a:text-primary">
              {article.content.split("\n").map((line, i) => {
                if (line.startsWith("## ")) return <h2 key={i} className="mt-8 font-serif text-xl font-semibold text-foreground">{line.slice(3)}</h2>
                if (line.startsWith("### ")) return <h3 key={i} className="mt-6 font-serif text-lg font-semibold text-foreground">{line.slice(4)}</h3>
                if (line.startsWith("- ")) return <li key={i} className="ml-4 text-muted-foreground">{line.slice(2)}</li>
                if (line.trim() === "") return <div key={i} className="h-3" />
                return <p key={i} className="text-base leading-relaxed text-muted-foreground">{line}</p>
              })}
            </div>

            <div className="mt-10 border-t border-border pt-6">
              <Button asChild variant="outline">
                <Link href="/news"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to all news</Link>
              </Button>
            </div>
          </article>

          <aside className="space-y-6">
            {related.length > 0 && (
              <Card className="border-border">
                <CardContent className="p-6">
                  <Eyebrow>Related</Eyebrow>
                  <div className="mt-4 space-y-4">
                    {related.map((r) => (
                      <Link key={r.id} href={`/news/${r.slug}`} className="group flex gap-3">
                        <div className="relative hidden h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-primary/5 sm:block">
                          {r.featuredImage ? (
                            <Image src={r.featuredImage} alt={r.title} fill sizes="80px" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-primary/30"><Newspaper className="h-5 w-5" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{fmtDate(r.publishedAt!)}</p>
                          <h4 className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">{r.title}</h4>
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
