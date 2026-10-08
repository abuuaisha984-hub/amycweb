import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { SchoolsDirectory } from "@/components/site/schools-directory"
import { localizedField, ui, type Locale } from "@/lib/locale-page"
import { lp } from "@/components/site/nav-config"
import { publicImage } from "@/lib/public-image"
import type { Metadata } from "next"
import { publicPageMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: value } = await params
  const locale = value === "sw" || value === "ar" ? value : "en"
  return publicPageMetadata(locale, "/education", ui(locale, "education.title"), ui(locale, "education.desc"))
}

const SCHOOL_TYPES = ["MAAHAD", "PRIMARY", "SECONDARY", "COLLEGE", "UNIVERSITY"] as const

export default async function EducationPage({ params, searchParams }: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string | string[] }>
}) {
  const [{ locale: localeStr }, query] = await Promise.all([params, searchParams])
  const requestedType = Array.isArray(query.type) ? query.type[0] : query.type
  const selectedType = requestedType?.trim().toUpperCase() === "ALL" ? "ALL"
    : SCHOOL_TYPES.find((type) => type === requestedType?.trim().toUpperCase()) || "ALL"
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const schools = await db.school.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    include: { jimbo: { select: { id: true, name: true, administrativeRegion: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  const counts = {
    MAAHAD: schools.filter((s) => s.type.trim().toUpperCase() === "MAAHAD").length,
    SECONDARY: schools.filter((s) => s.type.trim().toUpperCase() === "SECONDARY").length,
    PRIMARY: schools.filter((s) => s.type.trim().toUpperCase() === "PRIMARY").length,
    COLLEGE: schools.filter((s) => s.type.trim().toUpperCase() === "COLLEGE").length,
    UNIVERSITY: schools.filter((s) => s.type.trim().toUpperCase() === "UNIVERSITY").length,
  }
  return (
    <>
      <PageHero
        eyebrow={t("home.education.eyebrow")}
        title={t("education.title")}
        description={t("education.desc")}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("nav.education") }]}
      />
      <Section>
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: t("education.maahad"), value: counts.MAAHAD },
            { label: t("education.secondary"), value: counts.SECONDARY },
            { label: t("education.primary"), value: counts.PRIMARY },
            { label: t("education.college"), value: counts.COLLEGE },
            { label: t("education.university"), value: counts.UNIVERSITY },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="font-serif text-2xl font-semibold text-primary">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </div>
          ))}
        </div>
        <SchoolsDirectory
          key={selectedType}
          initialType={selectedType}
          schools={schools.map((s) => ({
            id: s.id,
            slug: s.slug,
            name: localizedField(s, "name", locale, s.name),
            type: s.type.trim().toUpperCase(),
            category: s.category,
            level: s.level,
            gender: s.gender,
            medium: s.medium,
            region: s.region,
            jimboId: s.jimboId,
            jimboName: s.jimbo?.name || null,
            administrativeRegion: s.region || s.jimbo?.administrativeRegion || null,
            about: localizedField(s, "about", locale, s.about),
            image: s.slug.includes("muzdalifah") ? "/images/school_muzdalifah.webp" : publicImage(s.image),
          }))}
          locale={locale}
        />
      </Section>
    </>
  )
}
