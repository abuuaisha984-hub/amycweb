import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Sparkles } from "lucide-react"
import { ui, type Locale } from "@/lib/locale-page"
import { lp } from "@/components/site/nav-config"
import { publicImage } from "@/lib/public-image"
import { ImageWithFallback } from "@/components/site/image-with-fallback"
import type { Metadata } from "next"
import { publicPageMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: value } = await params
  const locale = value === "sw" || value === "ar" ? value : "en"
  return publicPageMetadata(locale, "/media", ui(locale, "media.title"), ui(locale, "media.desc"))
}

export default async function MediaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const galleries = await db.gallery.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: { items: { take: 4, orderBy: { sortOrder: "asc" } } },
  })
  return (
    <>
      <PageHero
        eyebrow={t("home.gallery.eyebrow")}
        title={t("media.title")}
        description={t("media.desc")}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("nav.media") }]}
      />
      <Section>
        {galleries.length === 0 ? <div className="rounded-2xl border border-dashed border-primary/20 bg-secondary/20 px-6 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><ImageIcon className="h-6 w-6" /></span><h2 className="mt-5 font-serif text-2xl font-semibold">New moments will appear here soon</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">The media gallery is being refreshed. Please check back after new images have been published.</p></div> : <div className="grid gap-6 md:grid-cols-2">
          {galleries.map((g) => (
            <Card key={g.id} className="group overflow-hidden border-border transition hover:shadow-card">
              <div className="grid grid-cols-2 gap-1 bg-primary/5">
                {(g.coverImage ? [{ id: `cover-${g.id}`, url: g.coverImage, caption: g.title }, ...g.items.filter((item) => item.mediaUrl !== g.coverImage).slice(0, 3).map((item) => ({ id: item.id, url: item.mediaUrl, caption: item.caption }))] : g.items.slice(0, 4).map((item) => ({ id: item.id, url: item.mediaUrl, caption: item.caption }))).map((it, i) => (
                  <div key={it.id} className={`relative ${i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"}`}>
                    {publicImage(it.url) ? <ImageWithFallback src={publicImage(it.url)!} alt={it.caption || g.title} className="h-full w-full object-cover" fallback={<Sparkles className="h-6 w-6 text-primary/30" />} /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/10">
                      <Sparkles className="h-6 w-6 text-primary/30" />
                    </div>}
                  </div>
                ))}
              </div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-semibold">{g.title}</h3>
                  {g.category && <Badge variant="secondary" className="text-[0.65rem]">{g.category}</Badge>}
                </div>
                {g.description && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{g.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>}
      </Section>
    </>
  )
}
