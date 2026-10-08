import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { ArrowRight, BookOpen, GraduationCap, HeartHandshake, Hammer, Stethoscope, Users, Sprout, Radio, Baby, Sparkles } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { localizedField, ui, type Locale } from "@/lib/locale-page"
import { publicImage } from "@/lib/public-image"
import type { Metadata } from "next"
import { publicPageMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: value } = await params
  const locale = value === "sw" || value === "ar" ? value : "en"
  return publicPageMetadata(locale, "/programmes", ui(locale, "programmes.title"), ui(locale, "programmes.desc"))
}

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
            const image = publicImage(p.image)
            return (
              <Link
                key={p.id}
                href={lp(locale, `/programmes/${p.slug}`)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-primary/10 bg-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-primary/10">
                  {image ? <Image src={image} alt={localizedField(p, "name", locale, p.name)} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" /> : <span className="flex h-full items-center justify-center text-primary/50"><Icon className="h-10 w-10" /></span>}
                  <span className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-background/90 text-primary shadow-sm backdrop-blur"><Icon className="h-5 w-5" /></span>
                  <span className="absolute right-4 top-4 font-serif text-xl font-semibold text-primary-foreground/70">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="flex flex-1 flex-col p-6"><h3 className="font-serif text-lg font-semibold text-foreground">{localizedField(p, "name", locale, p.name)}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{localizedField(p, "shortDescription", locale, p.shortDescription)}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">{t("common.learnMore")} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 rtl:rotate-180" /></span></div>
              </Link>
            )
          })}
        </div>
      </Section>
    </>
  )
}
