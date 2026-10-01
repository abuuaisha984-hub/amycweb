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

function parseArr<T = any>(s: string | null): T[] {
  if (!s) return []
  try { return JSON.parse(s) as T[] } catch { return [] }
}

export default async function RegionPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const region = await db.region.findUnique({ where: { slug } })
  if (!region || region.status !== "PUBLISHED" || region.deletedAt) notFound()

  const leadership = parseArr<{ position: string; name: string }>(region.leadership)
  const activities = parseArr<string>(region.activities)
  const branches = parseArr<{ name: string; note?: string }>(region.branches)
  const name = localizedField(region, "name", locale, region.name)
  const overview = localizedField(region, "overview", locale, region.overview)
  const history = localizedField(region, "history", locale, region.history || "")
  const heroDescription = region.englishName ? `${t("region.englishLabel")}: ${region.englishName}` : overview

  return (
    <>
      <PageHero
        eyebrow={t("region.jimbo")}
        title={name}
        description={heroDescription}
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
            <div>
              <Eyebrow>{t("region.overview")}</Eyebrow>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{overview}</p>
            </div>

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

            {leadership.length > 0 && (
              <div>
                <Eyebrow>{t("region.leadership")}</Eyebrow>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {leadership.map((l, i) => (
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
                <p className="mt-3 text-xs text-muted-foreground">{t("region.leadershipNote")}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card className="border-primary/15 bg-secondary/30">
              <CardContent className="p-6">
                <h3 className="font-serif text-base font-semibold">{t("region.contact")}</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {region.contact && <li>{region.contact}</li>}
                  {region.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {region.email}</li>}
                  {region.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {region.phone}</li>}
                  {!region.contact && !region.email && !region.phone && <li className="text-xs">{t("region.contactNote")}</li>}
                </ul>
              </CardContent>
            </Card>
            <Button asChild variant="outline" className="w-full">
              <Link href={lp(locale, "/regions")}><ArrowLeft className="me-1.5 h-4 w-4 rtl:rotate-180" /> {t("region.backToAll")}</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
