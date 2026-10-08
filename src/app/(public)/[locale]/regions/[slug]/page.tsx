import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, Eyebrow } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Globe, Mail, Phone, Users2, Activity, ArrowLeft } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { localizedField, ui, type Locale } from "@/lib/locale-page"
import { assertPresent } from "@/lib/assert-present"
import { publicImage } from "@/lib/public-image"
import type { Metadata } from "next"
import { publicPageMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale: value } = await params
  const locale = value === "sw" || value === "ar" ? value : "en"
  const region = await db.region.findFirst({ where: { slug, status: "PUBLISHED", deletedAt: null }, select: { name: true, overview: true, translations: true, image: true } })
  if (!region) return { title: "Regions", robots: { index: false, follow: false } }
  return publicPageMetadata(locale, `/regions/${encodeURIComponent(slug)}`, localizedField(region, "name", locale, region.name), localizedField(region, "overview", locale, region.overview), publicImage(region.image))
}

function parseArr<T = any>(s: string | null): T[] {
  if (!s) return []
  try { return JSON.parse(s) as T[] } catch { return [] }
}
function localizedArray<T = any>(raw: string | null, translations: string, locale: Locale, field: string): T[] {
  try { const value = JSON.parse(translations || "{}")?.[locale]?.[field]; if (Array.isArray(value)) return value as T[] } catch {}
  return parseArr<T>(raw)
}

export default async function RegionPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const region = await db.region.findUnique({ where: { slug } })
  assertPresent(region)
  if (!region || region.status !== "PUBLISHED" || region.deletedAt) notFound()

  const leadership = localizedArray<{ position: string; name: string }>(region.leadership, region.translations, locale, "leadership")
  const regionalLeaders = await db.leader.findMany({ where: { category: "REGIONAL", regionId: region.id, status: "ACTIVE", deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  const activities = localizedArray<string>(region.activities, region.translations, locale, "activities")
  const branches = localizedArray<{ name: string; note?: string }>(region.branches, region.translations, locale, "branches")
  const name = localizedField(region, "name", locale, region.name)
  const overview = localizedField(region, "overview", locale, region.overview)
  const displayOverview = overview.startsWith("This Jimbo is listed in the AMYC directory.") ? "" : overview
  const history = localizedField(region, "history", locale, region.history || "")
  const image = publicImage(region.image)

  return (
    <>
      <PageHero
        eyebrow={t("region.jimbo")}
        title={name}
        description={displayOverview || undefined}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("nav.regions"), href: lp(locale, "/regions") }, { label: name }]}
      >
        {region.website && (
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <a href={region.website} target="_blank" rel="noopener noreferrer">
              <Globe className="me-1.5 h-3.5 w-3.5" /> {t("common.visitRegionalWebsite")}
            </a>
          </Button>
        )}
      </PageHero>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-10">
            {displayOverview && <div>
              <Eyebrow>{t("region.overview")}</Eyebrow>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{displayOverview}</p>
            </div>}

            {region.history && (
              <div>
                <Eyebrow>{t("region.history")}</Eyebrow>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{history}</p>
              </div>
            )}

            {activities.length > 0 && (
              <div>
                <Eyebrow>{t("region.activities")}</Eyebrow>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activities.map((a) => (
                    <Badge key={a} variant="secondary" className="rounded-full border border-primary/15 bg-background px-3 py-1">
                      <Activity className="me-1 h-3 w-3 text-primary" /> {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {branches.length > 0 && (
              <div>
                <Eyebrow>{t("region.branches")}</Eyebrow>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {branches.map((b, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-3 text-sm">
                      <span className="font-medium text-foreground">{b.name}</span>
                      {b.note && <p className="text-xs text-muted-foreground">{b.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(regionalLeaders.length > 0 || leadership.length > 0) && (
              <div>
                <Eyebrow>{t("region.leadership")}</Eyebrow>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {regionalLeaders.length > 0 ? regionalLeaders.map((leader) => (
                    <Card key={leader.id} className="border-border">
                      <CardContent className="flex items-center gap-3 p-4">
                        {publicImage(leader.photo) ? <img src={publicImage(leader.photo)!} alt={leader.photoAlt || localizedField(leader, "name", locale, leader.name)} className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Users2 className="h-4 w-4" /></span>}
                        <div><p className="text-xs text-muted-foreground">{localizedField(leader, "position", locale, leader.position)}</p><p className="text-sm font-semibold text-foreground">{localizedField(leader, "name", locale, leader.name)}</p></div>
                      </CardContent>
                    </Card>
                  )) : leadership.map((l, i) => (
                    <Card key={i} className="border-border">
                      <CardContent className="flex items-center gap-3 p-4">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Users2 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs text-muted-foreground">{l.position}</p>
                          <p className="text-sm font-semibold text-foreground">{l.name}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {image && <figure className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <img src={image} alt={name} className="aspect-[4/3] w-full object-cover" />
              <figcaption className="px-4 py-3 text-sm font-medium text-foreground">{name}</figcaption>
            </figure>}
            {(region.administrativeRegion || region.district) && <Card className="border-primary/15 bg-secondary/30">
              <CardContent className="p-6">
                <h3 className="font-serif text-base font-semibold">{t("school.location")}</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  {region.administrativeRegion && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("region.administrativeRegion")}</dt><dd className="text-end font-medium">{region.administrativeRegion}</dd></div>}
                  {region.district && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("region.district")}</dt><dd className="text-end font-medium">{region.district}</dd></div>}
                </dl>
              </CardContent>
            </Card>}
            {(region.contact || region.email || region.phone) && <Card className="border-primary/15 bg-secondary/30">
              <CardContent className="p-6">
                <h3 className="font-serif text-base font-semibold">{t("region.contact")}</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {region.contact && <li>{region.contact}</li>}
                  {region.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {region.email}</li>}
                  {region.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {region.phone}</li>}
                </ul>
              </CardContent>
            </Card>}
            <Button asChild variant="outline" className="w-full">
              <Link href={lp(locale, "/regions")}><ArrowLeft className="me-1.5 h-4 w-4 rtl:rotate-180" /> {t("region.backToAll")}</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
