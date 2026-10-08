import Link from "next/link"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, SectionHeading, Eyebrow } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Target, Eye, GitBranch, Users2, ShieldCheck, Award, BookOpen, Compass, Handshake } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { localizedField, ui, getSettings, setting, type Locale } from "@/lib/locale-page"
import { publicImage } from "@/lib/public-image"
import { ImageWithFallback } from "@/components/site/image-with-fallback"
import { ABOUT_COPY } from "@/lib/about-content"
import type { Metadata } from "next"
import { publicPageMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: value } = await params
  const locale = value === "sw" || value === "ar" ? value : "en"
  return publicPageMetadata(locale, "/about", ui(locale, "home.whoWeAre.title"), ABOUT_COPY[locale].overview)
}
async function getData() {
  const [settings, leaders, programmes] = await Promise.all([
    getSettings(),
    db.leader.findMany({ where: { category: "NATIONAL", status: "ACTIVE", deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.programme.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, take: 9 }),
  ])
  return { settings, leaders, programmes }
}

const VALUES = [
  { key: "awareness", icon: Eye },
  { key: "quality", icon: Award },
  { key: "wisdom", icon: BookOpen },
  { key: "adherence", icon: Compass },
  { key: "trustworthiness", icon: ShieldCheck },
  { key: "collaboration", icon: Handshake },
] as const

function emphasizeHistoryText(text: string, phrases: string[], founderName: string, locale: Locale) {
  const escapedPhrases = phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const parts = text.split(new RegExp(`(${escapedPhrases.join("|")})`, "g"))
  return parts.map((part, index) => phrases.includes(part)
    ? <strong key={`${part}-${index}`} className={part === founderName ? "font-bold text-primary" : "font-semibold text-foreground"}>
        {part === founderName ? <bdi dir="ltr">{part}</bdi> : part}
      </strong>
    : part)
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const copy = ABOUT_COPY[locale]
  const { settings, leaders, programmes } = await getData()
  return (
    <>
      <PageHero
        eyebrow={t("footer.about")}
        title={t("home.whoWeAre.title")}
        description={setting(settings, "tagline", locale)}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("nav.about") }]}
      />

      <Section id="overview">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <Eyebrow>{copy.overviewHeading}</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-balance">{t("about.whoWeAre")}</h2>
          </div>
          <p className="mt-7 max-w-4xl border-s-2 border-accent ps-5 text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg sm:leading-8">
            {copy.overview}
          </p>
        </div>
      </Section>

      <section id="history" className="section-divider bg-secondary/25 py-16 sm:py-20">
        <div className="container-institutional">
          <div className="grid items-stretch md:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl border border-border bg-secondary shadow-soft md:aspect-auto md:min-h-[30rem] md:rounded-s-2xl md:rounded-e-none">
              <ImageWithFallback
                src="/images/Mudirwataasisi.JPG"
                alt={t("about.historyImageAlt")}
                loading="eager"
                className="h-full w-full object-cover object-center"
                fallback={<div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />}
              />
            </div>
            <div className="rounded-b-2xl border border-t-0 border-border bg-card px-6 py-8 shadow-soft sm:px-9 sm:py-10 md:rounded-s-none md:rounded-e-2xl md:border-s-0 md:border-t md:px-10 lg:px-12 lg:py-12">
              <Eyebrow>{t("about.history")}</Eyebrow>
              <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">{copy.historyHeading}</h2>
              <div className="mt-6 max-w-prose space-y-5 text-sm leading-7 text-muted-foreground text-pretty sm:text-base sm:leading-8">
                {copy.history.map((paragraph) => <p key={paragraph}>
                  {emphasizeHistoryText(paragraph, copy.historyEmphasis, copy.founderName, locale)}
                </p>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section id="mission">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/15">
            <CardContent className="p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Target className="h-5 w-5" /></span>
              <h3 className="mt-4 font-serif text-xl font-semibold">{t("about.mission")}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">{setting(settings, "mission", locale)}</p>
            </CardContent>
          </Card>
          <Card className="border-accent/30">
            <CardContent className="p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/15 text-accent"><Eye className="h-5 w-5" /></span>
              <h3 className="mt-4 font-serif text-xl font-semibold">{t("about.vision")}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">{setting(settings, "vision", locale)}</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section id="values" className="bg-secondary/30">
        <SectionHeading align="center" eyebrow={t("about.values")} title={t("about.valuesTitle")} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map(({ key, icon: Icon }) => (
            <Card key={key} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true"><Icon className="h-5 w-5" /></span>
                  <h3 className="font-serif text-lg font-semibold">{t(`about.value.${key}.name`)}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(`about.value.${key}.desc`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {leaders.length > 0 && <Section id="leadership">
        <SectionHeading
          eyebrow={t("about.leadership")}
          title={t("about.leadershipTitle")}
          description={t("about.leadershipDesc")}
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {leaders.map((l) => {
            const name = localizedField(l, "name", locale, l.name)
            const photo = publicImage(l.photo)
            return <Card key={l.id} className="overflow-hidden border-border transition-shadow hover:shadow-md">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 via-secondary to-accent/10">
                {photo ? <ImageWithFallback src={photo} alt={l.photoAlt || name} loading="lazy" className="h-full w-full object-cover object-top" fallback={<Users2 className="h-14 w-14" aria-hidden="true" />} /> : <div className="grid h-full place-items-center text-primary/60"><Users2 className="h-14 w-14" aria-hidden="true" /></div>}
              </div>
              <CardContent className="p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{localizedField(l, "position", locale, l.position)}</p>
                <h3 className="mt-2 text-lg font-semibold leading-snug text-foreground">{name}</h3>
                {l.department && <p className="mt-1 text-sm text-muted-foreground">{l.department}</p>}
                {l.bio && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{localizedField(l, "bio", locale, l.bio)}</p>}
                {l.photoCredit && <p className="mt-3 text-xs text-muted-foreground">Photo: {l.photoCredit}</p>}
              </CardContent>
            </Card>
          })}
        </div>
      </Section>}

      <Section id="structure" className="bg-secondary/30">
        <SectionHeading eyebrow={t("about.structure")} title={t("about.structureTitle")} />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { icon: GitBranch, title: t("about.branches"), desc: t("about.branchesDesc") },
            { icon: Users2, title: t("about.regionsMajimbo"), desc: t("about.regionsDesc") },
            { icon: ShieldCheck, title: t("about.electoral"), desc: t("about.electoralDesc") },
          ].map((f) => (
            <Card key={f.title}>
              <CardContent className="p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></span>
                <h3 className="mt-4 font-serif text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8">
          <Button asChild className="bg-primary">
            <Link href={lp(locale, "/regions")}>{t("about.exploreMajimbo")}</Link>
          </Button>
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.04] to-accent/[0.04] p-8 text-center sm:p-12">
          <SectionHeading
            align="center"
            eyebrow={t("about.ourWork")}
            title={t("about.ourWorkTitle")}
            description={t("about.ourWorkDesc")}
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {programmes.map((p) => (
              <Button key={p.id} asChild variant="outline" className="rounded-full">
                <Link href={lp(locale, `/programmes/${p.slug}`)}>{localizedField(p, "name", locale, p.name)}</Link>
              </Button>
            ))}
          </div>
        </div>
      </Section>
    </>
  )
}
