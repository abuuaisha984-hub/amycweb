import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { Section, SectionHeading, Eyebrow } from "@/components/site/sections"
import { RegionsDirectory } from "@/components/site/regions-directory"
import { StatCounter } from "@/components/site/stat-counter"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  ArrowRight,
  CalendarDays,
  Download,
  FileText,
  GraduationCap,
  MapPin,
  Newspaper,
  Radio,
  Sparkles,
  BookOpen,
  HeartHandshake,
  Hammer,
  Stethoscope,
  Users,
  Sprout,
  Baby,
  Clock,
} from "lucide-react"

const PROGRAMME_ICONS: Record<string, any> = {
  dawah: BookOpen,
  education: GraduationCap,
  "social-welfare": HeartHandshake,
  "community-services": Hammer,
  healthcare: Stethoscope,
  "youth-development": Users,
  "development-projects": Sprout,
  "media-communication": Radio,
  "orphan-welfare": Baby,
}

async function getHomeData() {
  const [settingsRows, programmes, schools, regions, articles, events, documents, galleries] = await Promise.all([
    db.siteSetting.findMany(),
    db.programme.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" } }),
    db.school.findMany({ where: { status: "PUBLISHED", deletedAt: null }, orderBy: { sortOrder: "asc" } }),
    db.region.findMany({ where: { status: "PUBLISHED", deletedAt: null }, orderBy: { sortOrder: "asc" } }),
    db.article.findMany({
      where: { status: "PUBLISHED", deletedAt: null, publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
    db.event.findMany({
      where: { status: "PUBLISHED", deletedAt: null, startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
    db.document.findMany({ where: { status: "PUBLISHED", deletedAt: null }, orderBy: { publishedAt: "desc" }, take: 4 }),
    db.gallery.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 4, include: { items: { take: 1 } } }),
  ])
  const settings: Record<string, any> = {}
  for (const s of settingsRows) {
    try {
      settings[s.key] = JSON.parse(s.value)
    } catch {
      settings[s.key] = s.value
    }
  }
  return { settings, programmes, schools, regions, articles, events, documents, galleries }
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default async function Home() {
  const { settings, programmes, schools, regions, articles, events, documents, galleries } = await getHomeData()
  const stats = settings.stats || {}
  const statList = Object.values(stats) as { label: string; value: string; note?: string }[]
  const featuredNews = articles.find((a) => a.featured) || articles[0]
  const otherNews = articles.filter((a) => a.id !== featuredNews?.id).slice(0, 4)
  const featuredSchools = schools.slice(0, 6)

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url('/images/hero-amyc.jpg')" }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-primary/95 to-primary/85" />
        <div className="absolute inset-0 -z-10 bg-pattern opacity-[0.07]" />

        <div className="container-institutional py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Official Digital Platform · Since {settings.foundedYear || "1980"}
            </div>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Nurturing a generation rooted in <span className="text-accent">faith &amp; knowledge</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/80 text-pretty sm:text-lg">
              {settings.tagline ||
                "A pioneering Islamic institution in Tanzania, serving communities through education, da'wah, welfare and a nationwide network of schools and Majimbo."}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/about">Explore AMYC <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link href="/education">Our Schools</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Link href="/news">Latest News</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative gold rule */}
        <div className="gold-rule h-px w-full opacity-60" />
      </section>

      {/* ── INSTITUTIONAL SNAPSHOT ───────────────────────────────────────── */}
      <section className="border-b border-border bg-secondary/40">
        <div className="container-institutional py-10 sm:py-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {statList.map((s, i) => {
              const num = parseInt(String(s.value).replace(/[^\d]/g, "")) || 0
              const suffix = String(s.value).replace(/[\d,]/g, "").split(" ")[0] || ""
              return (
                <div key={i} className="text-center">
                  <div className="font-serif text-3xl font-semibold text-primary sm:text-4xl">
                    {num > 0 ? <StatCounter value={num} suffix={suffix} /> : s.value}
                  </div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wide text-foreground/70">{s.label}</div>
                  {s.note && <div className="text-[0.65rem] text-muted-foreground">{s.note}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── WHO WE ARE ───────────────────────────────────────────────────── */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-primary/5 shadow-card">
              <div className="absolute inset-0 bg-pattern-dense opacity-40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="h-40 w-40 text-primary/30" fill="currentColor">
                  <path d="M100 20a40 40 0 0 0-40 40v8a32 32 0 0 0-16 28v44h112v-44a32 32 0 0 0-16-28v-8a40 40 0 0 0-40-40Z" />
                  <rect x="44" y="140" width="112" height="20" rx="2" />
                  <path d="M132 30a18 18 0 1 0 0 26 14 14 0 1 1 0-26Z" className="text-accent" />
                </svg>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-3 hidden rounded-xl border border-border bg-card p-4 shadow-card sm:block">
              <div className="font-serif text-2xl font-semibold text-primary">Since {settings.foundedYear || "1980"}</div>
              <div className="text-xs text-muted-foreground">{settings.headquarters || "Tanga, Tanzania"}</div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Eyebrow>Who We Are</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
              A pioneering Islamic institution serving Tanzania since 1980.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground text-pretty">
              Ansaar Muslim Youth Centre (AMYC) was established with the vision of reviving the authentic teachings of
              Islam and fostering the holistic development of youth within the faith. Over more than four decades, AMYC
              has grown into a multi-programme institution operating a nationwide network of schools, regional branches
              (Majimbo), welfare initiatives, healthcare, orphan care, and its own media arm — Radio Ihsaan FM.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
              The Centre operates on a structured system of branches and regions, each formed by a minimum of 15
              members, with a disciplined electoral system adhering to Islamic principles.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="bg-primary">
                <Link href="/about">Learn More About AMYC <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Contact AMYC</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── WHAT WE DO ───────────────────────────────────────────────────── */}
      <Section className="bg-secondary/30">
        <SectionHeading
          align="center"
          eyebrow="What We Do"
          title="Programmes & Services"
          description="Nine interconnected programmes working together for the spiritual, intellectual and social development of youth and communities."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programmes.map((p) => {
            const Icon = PROGRAMME_ICONS[p.slug] || Sparkles
            return (
              <Link
                key={p.id}
                href={`/programmes/${p.slug}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
              >
                <div className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-primary/5 transition group-hover:translate-x-6 group-hover:-translate-y-6" />
                <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="relative mt-4 font-serif text-lg font-semibold text-foreground">{p.name}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">{p.shortDescription}</p>
                <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            )
          })}
        </div>
      </Section>

      {/* ── EDUCATION NETWORK ────────────────────────────────────────────── */}
      <Section>
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.04] to-accent/[0.04] p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <Eyebrow>Education Network</Eyebrow>
              <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
                {schools.length}+ schools & institutions across Tanzania
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground text-pretty">
                From Islamic seminaries (Maahad) to primary and secondary schools and a teachers' college — AMYC's
                educational network integrates authentic Islamic knowledge with modern academic disciplines, from
                kindergarten to university level.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Maahad (Religious)", "Secondary", "Primary", "Teachers College"].map((c) => (
                  <Badge key={c} variant="secondary" className="rounded-full border border-primary/15 bg-background">
                    {c}
                  </Badge>
                ))}
              </div>
              <div className="mt-7">
                <Button asChild className="bg-primary">
                  <Link href="/education">Explore Our Schools <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {featuredSchools.map((s) => (
                <Link
                  key={s.id}
                  href={`/education/${s.slug}`}
                  className="group rounded-lg border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-primary/20 text-[0.65rem] font-semibold text-primary">
                      {s.type === "MAAHAD" ? "Maahad" : s.type === "COLLEGE" ? "College" : s.type === "SECONDARY" ? "Secondary" : "Primary"}
                    </Badge>
                    <GraduationCap className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold leading-snug text-foreground line-clamp-2">{s.name}</h3>
                  {s.region && <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{s.region}</p>}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── REGIONS / MAJIMBO ────────────────────────────────────────────── */}
      <Section className="bg-secondary/30">
        <SectionHeading
          align="center"
          eyebrow="Regions · Majimbo"
          title="A nationwide network of regional branches"
          description={`AMYC operates through ${regions.length} Majimbo across Tanzania — each coordinating da'wah, education, welfare and youth programmes in its locality.`}
        />
        <div className="mt-10">
          <RegionsDirectory regions={regions} />
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/regions">View All Majimbo <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* ── LATEST NEWS ──────────────────────────────────────────────────── */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Media & News" title="Latest News & Announcements" />
          <Button asChild variant="outline">
            <Link href="/news">View all news <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {featuredNews && (
            <Link
              href={`/news/${featuredNews.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-primary/5">
                {featuredNews.featuredImage ? (
                  <Image
                    src={featuredNews.featuredImage}
                    alt={featuredNews.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-pattern-dense text-primary/30">
                    <Newspaper className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute left-4 top-4">
                  <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                    {featuredNews.kind === "ANNOUNCEMENT" ? "Announcement" : "Featured"}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(featuredNews.publishedAt!)}</span>
                  {featuredNews.category && <Badge variant="secondary" className="font-normal">{featuredNews.category}</Badge>}
                </div>
                <h3 className="mt-3 font-serif text-xl font-semibold leading-snug text-foreground group-hover:text-primary text-balance">
                  {featuredNews.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">{featuredNews.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Read more <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          )}
          <div className="flex flex-col gap-3">
            {otherNews.map((a) => (
              <Link
                key={a.id}
                href={`/news/${a.slug}`}
                className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-soft"
              >
                <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-primary/5 sm:block">
                  {a.featuredImage ? (
                    <Image src={a.featuredImage} alt={a.title} fill sizes="112px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-primary/30"><Newspaper className="h-6 w-6" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {fmtDate(a.publishedAt!)}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">{a.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{a.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      {/* ── EVENTS + DOCUMENTS ───────────────────────────────────────────── */}
      <Section className="bg-secondary/30">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Events */}
          <div>
            <div className="flex items-end justify-between">
              <Eyebrow>Events</Eyebrow>
              <Link href="/events" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight">Upcoming Events</h2>
            <div className="mt-6 space-y-3">
              {events.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>}
              {events.map((e) => (
                <Link key={e.id} href="/events" className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-soft">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <span className="text-lg font-bold leading-none">{new Date(e.startDate).getDate()}</span>
                    <span className="text-[0.6rem] uppercase">{new Date(e.startDate).toLocaleDateString("en", { month: "short" })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{e.title}</h3>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{e.location || e.venue || "Tanga, Tanzania"}
                    </p>
                    {e.startTime && <p className="inline-flex items-center gap-1 ps-2 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{e.startTime}</p>}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div>
            <div className="flex items-end justify-between">
              <Eyebrow>Resources</Eyebrow>
              <Link href="/documents" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight">Documents & Downloads</h2>
            <div className="mt-6 space-y-3">
              {documents.map((d) => (
                <Link key={d.id} href="/documents" className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-soft">
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

      {/* ── MEDIA / GALLERY ──────────────────────────────────────────────── */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Gallery" title="Moments from AMYC" />
          <Button asChild variant="outline">
            <Link href="/media">View gallery <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {galleries.map((g, i) => (
            <Link
              key={g.id}
              href="/media"
              className={`group relative overflow-hidden rounded-xl bg-primary/10 ${i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-square"}`}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
                <Sparkles className="h-8 w-8 text-primary/40" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transition group-hover:opacity-100">
                <p className="text-sm font-semibold text-primary-foreground">{g.title}</p>
                <p className="text-xs text-primary-foreground/70">{g.category}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 -z-10 bg-pattern opacity-[0.06]" />
        <div className="container-institutional py-20 text-center sm:py-24">
          <Eyebrow className="justify-center [&_span]:text-accent">Get Involved</Eyebrow>
          <h2 className="mx-auto mt-5 max-w-3xl font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Be part of a four-decade legacy of faith, knowledge and service.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/80 text-pretty">
            Whether through partnership, sponsorship, volunteering or simply staying informed — there are many ways to
            support AMYC's mission across Tanzania.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/contact">Contact AMYC</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/programmes">Explore Our Work</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
