import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { localizedField, ui, type Locale } from "@/lib/locale-page"
import { assertPresent } from "@/lib/assert-present"
import { lp } from "@/components/site/nav-config"
import type { Metadata } from "next"
import { publicPageMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale: value } = await params
  const locale = value === "sw" || value === "ar" ? value : "en"
  const page = await db.page.findFirst({ where: { slug, status: "PUBLISHED" }, select: { title: true, excerpt: true, content: true, translations: true } })
  if (!page) return { title: "Information", robots: { index: false, follow: false } }
  return publicPageMetadata(locale, `/info/${encodeURIComponent(slug)}`, localizedField(page, "title", locale, page.title), localizedField(page, "excerpt", locale, page.excerpt || page.content.slice(0, 220)))
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const page = await db.page.findUnique({ where: { slug } })
  assertPresent(page)
  if (!page || page.status !== "PUBLISHED") notFound()
  const title = localizedField(page, "title", locale, page.title)
  const excerpt = page.excerpt ? localizedField(page, "excerpt", locale, page.excerpt) : ""
  const content = localizedField(page, "content", locale, page.content)
  return (
    <>
      <PageHero
        eyebrow={t("legal.eyebrow")}
        title={title}
        description={excerpt}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: title }]}
      />
      <Section>
        <div className="mx-auto max-w-3xl">
          <div className="space-y-4">
            {content.split("\n").map((line, i) => {
              if (line.startsWith("## ")) return <h2 key={i} className="mt-8 font-serif text-xl font-semibold text-foreground">{line.slice(3)}</h2>
              if (line.startsWith("### ")) return <h3 key={i} className="mt-6 font-serif text-lg font-semibold text-foreground">{line.slice(4)}</h3>
              if (line.startsWith("- ")) return <li key={i} className="ms-4 text-muted-foreground">{line.slice(2)}</li>
              if (line.match(/^\d+\.\s/)) return <li key={i} className="ms-4 list-decimal text-muted-foreground">{line.replace(/^\d+\.\s/, "")}</li>
              if (line.trim() === "") return <div key={i} className="h-3" />
              return <p key={i} className="text-base leading-relaxed text-muted-foreground">{line}</p>
            })}
          </div>
        </div>
      </Section>
    </>
  )
}
