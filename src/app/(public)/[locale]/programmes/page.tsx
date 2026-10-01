import Link from "next/link"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { ArrowRight, BookOpen, GraduationCap, HeartHandshake, Hammer, Stethoscope, Users, Sprout, Radio, Baby, Sparkles } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { localizedField, ui, type Locale } from "@/lib/locale-page"

const ICONS: Record<string, any> = {
  dawah: BookOpen, education: GraduationCap, "social-welfare": HeartHandshake, "community-services": Hammer,
  healthcare: Stethoscope, "youth-development": Users, "development-projects": Sprout, "media-communication": Radio, "orphan-welfare": Baby,
}

export default async function ProgrammesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const programmes = await db.programme.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" } })
  return (
    <>
      <PageHero
        eyebrow={t("home.whatWeDo.title")}
        title={t("programmes.title")}
        description={t("programmes.desc")}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("nav.programmes") }]}
      />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programmes.map((p, i) => {
            const Icon = ICONS[p.slug] || Sparkles
            return (
              <Link
                key={p.id}
                href={lp(locale, `/programmes/${p.slug}`)}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5.5 w-5.5" />
                  </span>
                  <span className="font-serif text-2xl font-semibold text-primary/15">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{localizedField(p, "name", locale, p.name)}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{localizedField(p, "shortDescription", locale, p.shortDescription)}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  {t("common.learnMore")} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 rtl:rotate-180" />
                </span>
              </Link>
            )
          })}
        </div>
      </Section>
    </>
  )
}
