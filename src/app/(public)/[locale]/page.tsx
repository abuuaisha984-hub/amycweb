import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { Section, SectionHeading, Eyebrow } from "@/components/site/sections"
import { StatCounter } from "@/components/site/stat-counter"
import { ProgrammeSlider } from "@/components/site/programme-slider"
import { NewsUpdatesSlider } from "@/components/site/news-updates-slider"
import { lp } from "@/components/site/nav-config"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight, Download, FileText, GraduationCap, MapPin, Clock,
} from "lucide-react"
import { localizedField, ui, formatDate, getSettings, setting, type Locale } from "@/lib/locale-page"
import { publicImage } from "@/lib/public-image"
import { REGION_BANDS } from "@/lib/region-bands"
import type { Metadata } from "next"
import { publicPageMetadata, SITE_ORIGIN } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: value } = await params
  const locale = value === "sw" || value === "ar" ? value : "en"
  const metadata = publicPageMetadata(locale, "/", "Ansaar Muslim Youth Centre", "Ansaar Muslim Youth Centre serves communities in Tanzania through education, da'wah, youth development and community services.")
  return { ...metadata, title: { absolute: "Ansaar Muslim Youth Centre" } }
}

// Stat key → UI label key mapping
const STAT_LABEL_KEYS: Record<string, { label: string; note?: string }> = {
  yearsOfService: { label: "stats.yearsOfService", note: "stats.since" },
  schoolsCount: { label: "stats.schools", note: "stats.acrossTanzania" },
  regionsCount: { label: "stats.regions", note: "stats.nationwide" },
  programmesCount: { label: "stats.programmes", note: "stats.holistic" },
  orphansCaredFor: { label: "stats.orphans", note: "stats.shelter" },
  membersCount: { label: "stats.members", note: "stats.membersNote" },
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const now = new Date()

  const [settings, programmes, schools, regions, newsItems, events, documents] = await Promise.all([
    getSettings(),
    db.programme.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" } }),
    db.school.findMany({ where: { status: "PUBLISHED", deletedAt: null }, orderBy: { sortOrder: "asc" } }),
    db.region.findMany({ where: { status: "PUBLISHED", deletedAt: null }, orderBy: { sortOrder: "asc" } }),
    db.article.findMany({
      where: {
        title: { not: "" }, status: "PUBLISHED", deletedAt: null,
        publishedAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 5,
      select: { id: true, slug: true, title: true, excerpt: true, content: true, featuredImage: true, publishedAt: true, featured: true, translations: true },
    }).catch((error) => {
      console.error("Could not load homepage news", error)
      return []
    }),
    db.event.findMany({ where: { status: "PUBLISHED", deletedAt: null, startDate: { gte: now } }, orderBy: { startDate: "asc" }, take: 3 }),
    db.document.findMany({ where: { status: "PUBLISHED", deletedAt: null, OR: [{ archiveDate: null }, { archiveDate: { gt: new Date() } }] }, orderBy: { publishedAt: "desc" }, take: 4 }),
  ])

  const stats = settings.stats || {}
  const statList = Object.entries(stats).map(([key, val]: [string, any]) => ({
    key,
    value: val?.value || "",
    label: STAT_LABEL_KEYS[key] ? ui(locale, STAT_LABEL_KEYS[key].label) : val?.label || key,
    note: STAT_LABEL_KEYS[key]?.note ? ui(locale, STAT_LABEL_KEYS[key].note as string) : val?.note || "",
  }))
  const newsSlides = newsItems.map((article) => {
    const title = localizedField(article, "title", locale, article.title).trim() || t("news.news")
    const text = localizedField(article, "excerpt", locale, article.excerpt || article.content)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[#>*_`~]/g, "")
      .replace(/\s+/g, " ")
      .trim()
    const excerpt = text.length > 190 ? `${text.slice(0, 187).replace(/\s+\S*$/, "")}…` : text
    const resolvedImage = publicImage(article.featuredImage)
    const image = resolvedImage && (resolvedImage.startsWith("/") && !resolvedImage.startsWith("//") || /^https?:\/\//i.test(resolvedImage))
      ? resolvedImage
      : null
    return {
      id: article.id,
      href: lp(locale, `/news/${article.slug}`),
      title,
      excerpt,
      image,
      publishedAt: article.publishedAt?.toISOString() || now.toISOString(),
      isFeatured: article.featured,
    }
  })
  const featuredSchools = schools.slice(0, 6)
  const foundedYear = settings.foundedYear || "1980"
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ansaar Muslim Youth Centre",
    alternateName: "AMYC",
    url: SITE_ORIGIN,
    foundingDate: foundedYear,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <NewsUpdatesSlider
        slides={newsSlides}
        locale={locale}
        labels={{
          region: t("home.news.title"),
          eyebrow: t("news.news"),
          readMore: t("home.updates.readMore"),
          noUpdatesTitle: t("home.updates.noItems"),
          noUpdatesDescription: t("home.updates.noItemsDesc"),
          viewAll: t("home.updates.viewAll"),
          previous: t("home.updates.previous"),
          next: t("home.updates.next"),
          showSlide: t("home.updates.showSlide"),
          featured: t("news.featured"),
          of: t("home.updates.of"),
        }}
      />

      {/* SNAPSHOT */}
      <section className="section-divider bg-secondary/25">
        <div className="container-institutional py-10 sm:py-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {statList.map((s, i) => {
              const num = parseInt(String(s.value).replace(/[^\d]/g, "")) || 0
              const suffix = String(s.value).replace(/[\d,]/g, "").split(" ")[0] || ""
              return (
                <div key={i} className="group rounded-xl border border-border/90 bg-card px-3 py-5 text-center shadow-soft transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card sm:px-4 sm:py-6">
                  <div className="font-serif text-3xl font-semibold leading-none tracking-tight text-primary sm:text-4xl">
                    {num > 0 ? <StatCounter value={num} suffix={suffix} /> : s.value}
                  </div>
                  <div className="mt-3 text-xs font-semibold leading-snug text-foreground/80 sm:text-sm">{s.label}</div>
                  {s.note && <div className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{s.note}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* WHO WE ARE */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-primary/5 shadow-card">
              <Image src="/images/student-muzdalifah.webp" alt="Students at an AMYC school" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-5 -right-3 hidden rounded-xl border border-border bg-card p-4 shadow-card sm:block rtl:-right-auto rtl:-left-3">
              <div className="font-serif text-2xl font-semibold text-primary">{t("stats.since")} {foundedYear}</div>
              <div className="text-xs text-muted-foreground">{settings.headquarters || "Tanga, Tanzania"}</div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Eyebrow>{t("home.whoWeAre.eyebrow")}</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
              {t("home.whoWeAre.title")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground text-pretty">{setting(settings, "tagline", locale)}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="bg-primary">
                <Link href={lp(locale, "/about")}>{t("cta.learnMore")} <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={lp(locale, "/contact")}>{t("cta.contact")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* WHAT WE DO */}
      <Section className="bg-secondary/30">
        <SectionHeading align="center" eyebrow={t("home.whatWeDo.eyebrow")} title={t("home.whatWeDo.title")} description={t("home.whatWeDo.desc")} />
        <ProgrammeSlider programmes={programmes.map((programme) => ({ id: programme.id, slug: programme.slug, image: programme.image, name: localizedField(programme, "name", locale, programme.name), shortDescription: localizedField(programme, "shortDescription", locale, programme.shortDescription) }))} locale={locale} learnMore={t("common.learnMore")} />
      </Section>

      {/* EDUCATION NETWORK */}
      <Section>
        <div className="relative isolate overflow-hidden rounded-2xl border border-primary/20 bg-primary shadow-card">
          <Image
            src="/images/student_namirah.webp"
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 90vw"
            className="object-cover object-center"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/55 via-primary/45 to-primary/65" aria-hidden="true" />
          <div className="relative z-10 grid gap-6 p-5 sm:gap-8 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:p-10">
            <div className="rounded-2xl border border-border/80 bg-background/95 p-5 shadow-card backdrop-blur-md sm:p-8">
              <Eyebrow>{t("home.education.eyebrow")}</Eyebrow>
              <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
                {schools.length}+ {t("home.education.title")}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground text-pretty">{t("home.education.desc")}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[t("education.maahad"), t("education.secondary"), t("education.primary"), t("education.college")].map((c) => (
                  <Badge key={c} variant="secondary" className="rounded-full border border-primary/15 bg-background/95 shadow-sm backdrop-blur">{c}</Badge>
                ))}
              </div>
              <div className="mt-7">
                <Button asChild className="bg-primary">
                  <Link href={lp(locale, "/education")}>{t("home.education.explore")} <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" /></Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {featuredSchools.map((s) => (
                <Link key={s.id} href={lp(locale, `/education/${s.slug}`)} className="group rounded-lg border border-border/90 bg-card/95 p-4 shadow-soft backdrop-blur-sm transition hover:border-primary/40 hover:bg-card hover:shadow-card">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-primary/20 text-[0.65rem] font-semibold text-primary">
                      {s.type === "MAAHAD" ? t("education.maahad") : s.type === "COLLEGE" ? t("education.college") : s.type === "UNIVERSITY" ? t("education.university") : s.type === "SECONDARY" ? t("education.secondary") : t("education.primary")}
                    </Badge>
                    <GraduationCap className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold leading-snug text-foreground line-clamp-2">{localizedField(s, "name", locale, s.name)}</h3>
                  {s.region && <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{s.region}</p>}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* REGIONS */}
      <Section className="bg-secondary/30">
        <SectionHeading
          align="center"
          eyebrow={t("home.regions.eyebrow")}
          title={t("home.regions.title")}
          description={t("home.regions.desc").replace("{n}", String(regions.length))}
        />
        <div className="mt-10">
          <div className="grid gap-4 sm:grid-cols-2">
            {REGION_BANDS.map((band) => (
              <Link
                key={band.key}
                href={lp(locale, `/regions?kanda=${band.key}`)}
                className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-soft"
              >
                <h3 className="font-semibold text-foreground">{t(band.labelKey)}</h3>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180" />
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href={lp(locale, "/regions")}>{t("home.regions.viewAll")} <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" /></Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* EVENTS + DOCUMENTS */}
      <Section className="bg-secondary/30">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="flex items-end justify-between">
              <Eyebrow>{t("home.events.eyebrow")}</Eyebrow>
              <Link href={lp(locale, "/events")} className="text-sm font-medium text-primary hover:underline">{t("common.viewAll")}</Link>
            </div>
            <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight">{t("home.events.title")}</h2>
            <div className="mt-6 space-y-3">
              {events.length === 0 && <p className="text-sm text-muted-foreground">{t("home.events.none")}</p>}
              {events.map((e) => (
                <Link key={e.id} href={lp(locale, "/events")} className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-soft">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <span className="text-lg font-bold leading-none">{new Date(e.startDate).getDate()}</span>
                    <span className="text-[0.6rem] uppercase">{formatDate(e.startDate, locale, { month: "short" })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{localizedField(e, "title", locale, e.title)}</h3>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{e.location || e.venue || "Tanga, Tanzania"}
                    </p>
                    {e.startTime && <p className="inline-flex items-center gap-1 ps-2 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{e.startTime}</p>}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180" />
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <Eyebrow>{t("home.docs.eyebrow")}</Eyebrow>
              <Link href={lp(locale, "/documents")} className="text-sm font-medium text-primary hover:underline">{t("common.viewAll")}</Link>
            </div>
            <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight">{t("home.docs.title")}</h2>
            <div className="mt-6 space-y-3">
              {documents.map((d) => (
                <Link key={d.id} href={lp(locale, "/documents")} className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-soft">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{d.title}</h3>
                    <p className="text-xs text-muted-foreground">{d.category} · {d.fileType.toUpperCase()}</p>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 -z-10 bg-pattern opacity-[0.06]" />
        <div className="container-institutional py-20 text-center sm:py-24">
          <Eyebrow className="justify-center [&_span]:text-accent">{t("home.cta.eyebrow")}</Eyebrow>
          <h2 className="mx-auto mt-5 max-w-3xl font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            {t("home.cta.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/80 text-pretty">{t("home.cta.desc")}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href={lp(locale, "/contact")}>{t("cta.contact")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link href={lp(locale, "/programmes")}>{t("cta.exploreWork")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
