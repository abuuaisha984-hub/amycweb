import Link from "next/link"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, SectionHeading, Eyebrow } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Target, Eye, GitBranch, Users2, ShieldCheck } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { localizedField, ui, getSettings, type Locale } from "@/lib/locale-page"

async function getData() {
  const [settings, leaders, programmes] = await Promise.all([
    getSettings(),
    db.leader.findMany({ where: { category: "NATIONAL" }, orderBy: { sortOrder: "asc" } }),
    db.programme.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, take: 9 }),
  ])
  return { settings, leaders, programmes }
}

const VALUE_KEYS = [
  "awareness",
  "quality",
  "wisdom",
  "adherence",
  "trustworthiness",
  "collaboration",
] as const

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const { settings, leaders, programmes } = await getData()
  const foundedYear = settings.foundedYear || "1980"
  const headquarters = settings.headquarters || "Tanga, Tanzania"
  return (
    <>
      <PageHero
        eyebrow={t("footer.about")}
        title={t("home.whoWeAre.title")}
        description={settings.tagline}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("nav.about") }]}
      />

      <Section id="overview">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Eyebrow>{t("about.overview")}</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-balance">{t("about.whoWeAre")}</h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground text-pretty">
              <p>
                {t("about.overview.p1a")} {headquarters}.
                {" "}{t("about.overview.p1b")} <strong className="text-foreground">{foundedYear}</strong>{" "}
                {t("about.overview.p1c")}
              </p>
              <p>
                {t("about.overview.p2a")} <strong className="text-foreground">{t("about.overview.p2b")}</strong>.
              </p>
              <p>
                {t("about.overview.p3")}
              </p>
            </div>
          </div>
          <Card className="h-fit border-primary/15 bg-secondary/30">
            <CardContent className="space-y-4 p-6">
              <h3 className="font-serif text-lg font-semibold">{t("about.atGlance")}</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">{t("about.established")}</dt>
                  <dd className="font-semibold text-foreground">{foundedYear}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">{t("about.headquarters")}</dt>
                  <dd className="font-semibold text-foreground">{headquarters}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">{t("about.languages")}</dt>
                  <dd className="font-semibold text-foreground">EN · SW · AR</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">{t("about.radio")}</dt>
                  <dd className="font-semibold text-foreground">{settings.radioStation || "Radio Ihsaan FM"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("about.email")}</dt>
                  <dd className="font-semibold text-foreground">{settings.email || "info@amyc.or.tz"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section id="history" className="bg-secondary/30">
        <SectionHeading eyebrow={t("about.history")} title={t("about.historyTitle")} />
        <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground text-pretty">
          <p>
            {t("about.overview.p2a")} <strong className="text-foreground">{t("about.overview.p2b")}</strong>.
          </p>
          <p className="rounded-lg border border-amber-500/30 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <strong>{t("about.note")}</strong> {t("about.noteDesc")}
          </p>
        </div>
      </Section>

      <Section id="mission">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/15">
            <CardContent className="p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Target className="h-5 w-5" /></span>
              <h3 className="mt-4 font-serif text-xl font-semibold">{t("about.mission")}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">{settings.mission}</p>
            </CardContent>
          </Card>
          <Card className="border-accent/30">
            <CardContent className="p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/15 text-accent"><Eye className="h-5 w-5" /></span>
              <h3 className="mt-4 font-serif text-xl font-semibold">{t("about.vision")}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">{settings.vision}</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section id="values" className="bg-secondary/30">
        <SectionHeading align="center" eyebrow={t("about.values")} title={t("about.valuesTitle")} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUE_KEYS.map((v, i) => (
            <Card key={v} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-serif text-sm font-bold text-primary">{i + 1}</span>
                  <h3 className="font-serif text-lg font-semibold">{t(`about.value.${v}.name`)}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(`about.value.${v}.desc`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="leadership">
        <SectionHeading
          eyebrow={t("about.leadership")}
          title={t("about.leadershipTitle")}
          description={t("about.leadershipDesc")}
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leaders.map((l) => (
            <Card key={l.id} className="border-border">
              <CardContent className="flex items-start gap-4 p-5">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{l.position}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{t("common.nameTBD")}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

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
