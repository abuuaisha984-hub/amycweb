import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, Eyebrow } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Globe, Building2, GraduationCap, BookOpen, Info, ArrowLeft, Mail, Phone } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { localizedField, ui, type Locale } from "@/lib/locale-page"
import { assertPresent } from "@/lib/assert-present"
import { publicImage } from "@/lib/public-image"
import type { Metadata } from "next"
import { publicPageMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale: value } = await params
  const locale = value === "sw" || value === "ar" ? value : "en"
  const school = await db.school.findFirst({ where: { slug, status: "PUBLISHED", deletedAt: null }, select: { name: true, about: true, translations: true, image: true } })
  if (!school) return { title: "Education", robots: { index: false, follow: false } }
  return publicPageMetadata(locale, `/education/${encodeURIComponent(slug)}`, localizedField(school, "name", locale, school.name), localizedField(school, "about", locale, school.about), publicImage(school.image))
}

function parseArr(s: string | null): string[] {
  if (!s) return []
  try { return JSON.parse(s) } catch { return [] }
}

export default async function SchoolProfilePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const school = await db.school.findUnique({ where: { slug } })
  assertPresent(school)
  if (!school || school.status !== "PUBLISHED" || school.deletedAt) notFound()

  const facilities = parseArr(school.facilities)
  const levels = parseArr(school.levelsOffered)
  const TYPE_LABEL: Record<string, string> = {
    MAAHAD: t("education.maahad"),
    SECONDARY: t("education.secondary"),
    PRIMARY: t("education.primary"),
    COLLEGE: t("education.college"),
    UNIVERSITY: t("education.university"),
  }
  const name = localizedField(school, "name", locale, school.name)
  const about = localizedField(school, "about", locale, school.about)
  const history = localizedField(school, "history", locale, school.history || "")
  const category = localizedField(school, "category", locale, school.category || "")
  const shortDescription = localizedField(school, "shortName", locale, school.shortName || category)
  const schoolImage = school.slug.includes("muzdalifah") ? "/images/school_muzdalifah.webp" : publicImage(school.image)

  return (
    <>
      <PageHero
        eyebrow={TYPE_LABEL[school.type] || t("school.institution")}
        title={name}
        description={shortDescription}
        breadcrumbs={[
          { label: t("common.home"), href: lp(locale, "/") },
          { label: t("nav.education"), href: lp(locale, "/education") },
          { label: name },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          {school.region && (
            <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
              <MapPin className="me-1 h-3 w-3" /> {school.region}{school.district ? `, ${school.district}` : ""}
            </Badge>
          )}
          {school.gender && (
            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">{school.gender}</Badge>
          )}
          {school.medium && (
            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">{school.medium} {t("school.medium")}</Badge>
          )}
          {school.website && (
            <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <a href={school.website} target="_blank" rel="noopener noreferrer">
                <Globe className="me-1.5 h-3.5 w-3.5" /> {t("common.visitSchoolWebsite")}
              </a>
            </Button>
          )}
        </div>
      </PageHero>

      <Section>
        {schoolImage && <div className="relative mb-10 aspect-[16/8] overflow-hidden rounded-2xl bg-secondary">
          <Image src={schoolImage} alt={`${name} school building`} fill priority sizes="(max-width: 1024px) 100vw, 1200px" className="object-cover" />
        </div>}
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-10">
            {/* About */}
            <div>
              <Eyebrow>{t("school.about")}</Eyebrow>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{about}</p>
            </div>

            {/* History */}
            {school.history && (
              <div>
                <Eyebrow>{t("school.history")}</Eyebrow>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{history}</p>
              </div>
            )}

            {/* Education */}
            <div>
              <Eyebrow>{t("school.education")}</Eyebrow>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Card className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-primary"><GraduationCap className="h-4 w-4" /><h3 className="text-sm font-semibold">{t("school.levelsOffered")}</h3></div>
                    {levels.length ? (
                      <ul className="mt-3 space-y-1.5">
                        {levels.map((l) => <li key={l} className="text-sm text-muted-foreground">• {l}</li>)}
                      </ul>
                    ) : <p className="mt-2 text-xs text-muted-foreground">{t("common.infoUnavailable")}</p>}
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-primary"><BookOpen className="h-4 w-4" /><h3 className="text-sm font-semibold">{t("school.category")}</h3></div>
                    <p className="mt-3 text-sm text-muted-foreground">{category || "—"}</p>
                    {school.medium && <p className="mt-1 text-sm text-muted-foreground">{t("school.medium")}: {school.medium}</p>}
                    {school.gender && <p className="mt-1 text-sm text-muted-foreground">{t("school.gender")}: {school.gender}</p>}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <Eyebrow>{t("school.facilities")}</Eyebrow>
              {facilities.length ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {facilities.map((f) => (
                    <div key={f} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                      <Building2 className="h-4 w-4 text-primary" /> {f}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <Info className="me-1.5 inline h-4 w-4" /> {t("school.facilityNote")}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {(school.region || school.district || school.ward || school.address) && <Card className="border-primary/15 bg-secondary/30">
              <CardContent className="p-6">
                <h3 className="font-serif text-base font-semibold">{t("school.location")}</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  {school.region && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t("school.region")}</dt><dd className="font-medium">{school.region}</dd></div>}
                  {school.district && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t("school.district")}</dt><dd className="font-medium">{school.district}</dd></div>}
                  {school.ward && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t("school.ward")}</dt><dd className="font-medium">{school.ward}</dd></div>}
                  {school.address && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t("school.address")}</dt><dd className="font-medium text-end">{school.address}</dd></div>}
                </dl>
              </CardContent>
            </Card>}

            {(school.email || school.phone) && <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-serif text-base font-semibold">{t("school.contact")}</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {school.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><a href={`mailto:${school.email}`} className="hover:text-primary">{school.email}</a></li>}
                  {school.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><a href={`tel:${school.phone.replace(/[^+\d]/g, "")}`} className="hover:text-primary">{school.phone}</a></li>}
                </ul>
              </CardContent>
            </Card>}

            <Button asChild variant="outline" className="w-full">
              <Link href={lp(locale, "/education")}><ArrowLeft className="me-1.5 h-4 w-4 rtl:rotate-180" /> {t("school.backToAll")}</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
