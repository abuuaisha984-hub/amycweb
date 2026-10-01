import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Newspaper, ArrowRight } from "lucide-react"

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const sp = await searchParams
  const kind = sp.kind === "ANNOUNCEMENT" ? "ANNOUNCEMENT" : sp.kind === "NEWS" ? "NEWS" : "ALL"
  const now = new Date()
  const where = {
    status: "PUBLISHED" as const,
    deletedAt: null,
    publishedAt: { lte: now },
    AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
    ...(kind !== "ALL" ? { kind } : {}),
  }
  const articles = await db.article.findMany({ where, orderBy: { publishedAt: "desc" } })
  const featured = articles.find((a) => a.featured) || articles[0]
  const rest = articles.filter((a) => a.id !== featured?.id)

  return (
    <>
      <PageHero
        eyebrow="Media & News"
        title="News & Announcements"
        description="The latest from AMYC — institutional news, announcements, events and programme updates from across our nationwide network."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "News" }]}
      />
      <Section>
        {/* Filter tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {[
            { k: "ALL", label: "All" },
            { k: "NEWS", label: "News" },
            { k: "ANNOUNCEMENT", label: "Announcements" },
          ].map((t) => (
            <Button
              key={t.k}
              asChild
              size="sm"
              variant={kind === t.k ? "default" : "outline"}
              className={kind === t.k ? "bg-primary" : ""}
            >
              <Link href={t.k === "ALL" ? "/news" : `/news?kind=${t.k}`}>{t.label}</Link>
            </Button>
          ))}
        </div>

        {featured && (
          <Link
            href={`/news/${featured.slug}`}
            className="group mb-10 grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-2"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-primary/5 lg:aspect-auto">
              {featured.featuredImage ? (
                <Image src={featured.featuredImage} alt={featured.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center bg-pattern-dense text-primary/30"><Newspaper className="h-16 w-16" /></div>
              )}
              <div className="absolute left-4 top-4 flex gap-2">
                <Badge className="bg-accent text-accent-foreground hover:bg-accent">Featured</Badge>
                <Badge variant="secondary">{featured.kind === "ANNOUNCEMENT" ? "Announcement" : "News"}</Badge>
              </div>
            </div>
            <div className="flex flex-col justify-center p-8">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(featured.publishedAt!)}</span>
                {featured.category && <Badge variant="outline">{featured.category}</Badge>}
              </div>
              <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight text-foreground group-hover:text-primary text-balance">{featured.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-4">{featured.excerpt}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">Read full story <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
            </div>
          </Link>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a) => (
            <Link
              key={a.id}
              href={`/news/${a.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-primary/5">
                {a.featuredImage ? (
                  <Image src={a.featuredImage} alt={a.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-pattern-dense text-primary/30"><Newspaper className="h-10 w-10" /></div>
                )}
                <div className="absolute right-3 top-3">
                  <Badge variant="secondary" className="text-[0.65rem]">{a.kind === "ANNOUNCEMENT" ? "Announcement" : "News"}</Badge>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" /> {fmtDate(a.publishedAt!)}
                  {a.category && <span>· {a.category}</span>}
                </div>
                <h3 className="mt-2 font-serif text-base font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">{a.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">{a.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <Newspaper className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No {kind === "ALL" ? "" : kind.toLowerCase() + " "}items published yet.</p>
          </div>
        )}
      </Section>
    </>
  )
}
