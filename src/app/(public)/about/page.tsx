import Link from "next/link"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, SectionHeading, Eyebrow } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Target, Eye, GitBranch, Users2, ShieldCheck } from "lucide-react"

async function getData() {
  const [settingsRows, leaders, programmes] = await Promise.all([
    db.siteSetting.findMany(),
    db.leader.findMany({ where: { category: "NATIONAL" }, orderBy: { sortOrder: "asc" } }),
    db.programme.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, take: 9 }),
  ])
  const settings: Record<string, any> = {}
  for (const s of settingsRows) {
    try { settings[s.key] = JSON.parse(s.value) } catch { settings[s.key] = s.value }
  }
  return { settings, leaders, programmes }
}

const VALUES = [
  { name: "Awareness", desc: "Being mindful and conscious of one's actions, thoughts, and intentions as per the Islamic teachings." },
  { name: "Quality", desc: "Striving for excellence, integrity, and high standards in all aspects of life." },
  { name: "Wisdom", desc: "Seeking, understanding and applying knowledge and sound judgment in decision-making." },
  { name: "Adherence", desc: "Upholding steadfastness, discipline, and commitment to Islamic principles." },
  { name: "Trustworthiness", desc: "Demonstrating honesty, integrity, and reliability in all endeavors." },
  { name: "Collaboration", desc: "Working together effectively to achieve common goals." },
]

export default async function AboutPage() {
  const { settings, leaders, programmes } = await getData()
  return (
    <>
      <PageHero
        eyebrow="About AMYC"
        title="A pioneering Islamic institution serving Tanzania since 1980."
        description={settings.tagline}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      <Section id="overview">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Eyebrow>Overview</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-balance">Who we are</h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground text-pretty">
              <p>
                Ansaar Muslim Youth Centre (AMYC) is a pioneering Islamic organization based in {settings.headquarters || "Tanga, Tanzania"}.
                It was established in <strong className="text-foreground">{settings.foundedYear || "1980"}</strong> with the mission of reviving
                the authentic teachings of Islam and fostering the holistic development of youth within the faith.
              </p>
              <p>
                Over more than four decades of service, AMYC has grown into a multi-programme institution operating a nationwide network
                of schools, regional branches (Majimbo), community welfare initiatives, healthcare contributions, orphan care programmes,
                and an in-house media and communications arm — including its own radio station, <strong className="text-foreground">Radio Ihsaan FM</strong>.
              </p>
              <p>
                AMYC operates on a structured system of branches and regions, ensuring a cohesive and efficient organizational framework.
                Each branch is formed by a minimum of 15 members and contributes to the collective efforts of regional development.
                The organization maintains a disciplined electoral system at all levels, adhering strictly to Islamic laws.
              </p>
            </div>
          </div>
          <Card className="h-fit border-primary/15 bg-secondary/30">
            <CardContent className="space-y-4 p-6">
              <h3 className="font-serif text-lg font-semibold">At a Glance</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Established</dt>
                  <dd className="font-semibold text-foreground">{settings.foundedYear || "1980"}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Headquarters</dt>
                  <dd className="font-semibold text-foreground">{settings.headquarters || "Tanga, Tanzania"}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Languages</dt>
                  <dd className="font-semibold text-foreground">EN · SW · AR</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Radio</dt>
                  <dd className="font-semibold text-foreground">{settings.radioStation || "Radio Ihsaan FM"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-semibold text-foreground">{settings.email || "info@amyc.or.tz"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section id="history" className="bg-secondary/30">
        <SectionHeading eyebrow="History" title="More than four decades of service" />
        <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground text-pretty">
          <p>
            From its founding in {settings.foundedYear || "1980"}, AMYC has steadily expanded from a youth-centred da'wah initiative
            into a comprehensive Islamic institution. What began with a focus on reviving authentic Islamic teachings and nurturing
            youth has grown to encompass a nationwide network of schools, Majimbo, welfare programmes, healthcare, orphan care,
            development projects and media.
          </p>
          <p className="rounded-lg border border-amber-500/30 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <strong>Note:</strong> Detailed historical milestones and founding leaders are to be confirmed with AMYC before publication.
          </p>
        </div>
      </Section>

      <Section id="mission">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/15">
            <CardContent className="p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Target className="h-5 w-5" /></span>
              <h3 className="mt-4 font-serif text-xl font-semibold">Mission</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">{settings.mission}</p>
            </CardContent>
          </Card>
          <Card className="border-accent/30">
            <CardContent className="p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/15 text-accent"><Eye className="h-5 w-5" /></span>
              <h3 className="mt-4 font-serif text-xl font-semibold">Vision</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">{settings.vision}</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section id="values" className="bg-secondary/30">
        <SectionHeading align="center" eyebrow="Values" title="The principles that guide our work" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v, i) => (
            <Card key={v.name} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-serif text-sm font-bold text-primary">{i + 1}</span>
                  <h3 className="font-serif text-lg font-semibold">{v.name}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="leadership">
        <SectionHeading
          eyebrow="Leadership"
          title="National governance structure"
          description="AMYC is governed by an elected national committee overseeing all programmes and Majimbo. Leadership details are to be confirmed with AMYC before publication."
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
                  <p className="mt-1 text-xs text-muted-foreground">Name: To be confirmed</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="structure" className="bg-secondary/30">
        <SectionHeading eyebrow="Organizational Structure" title="Branches, regions and electoral system" />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { icon: GitBranch, title: "Branches", desc: "Each branch is formed by a minimum of 15 members, contributing to regional development." },
            { icon: Users2, title: "Regions (Majimbo)", desc: "Branches are coordinated through regional branches across Tanzania, ensuring cohesive operations." },
            { icon: ShieldCheck, title: "Electoral System", desc: "AMYC maintains a disciplined electoral system at all levels, adhering strictly to Islamic laws." },
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
            <Link href="/regions">Explore the Majimbo network</Link>
          </Button>
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.04] to-accent/[0.04] p-8 text-center sm:p-12">
          <SectionHeading
            align="center"
            eyebrow="Our Work"
            title="Nine programmes serving the community"
            description="From da'wah and education to welfare, healthcare, youth development and media — explore what AMYC does."
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {programmes.map((p) => (
              <Button key={p.id} asChild variant="outline" className="rounded-full">
                <Link href={`/programmes/${p.slug}`}>{p.name}</Link>
              </Button>
            ))}
          </div>
        </div>
      </Section>
    </>
  )
}
