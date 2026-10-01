import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { SchoolsDirectory } from "@/components/site/schools-directory"
import { localizedField, ui, type Locale } from "@/lib/locale-page"
import { lp } from "@/components/site/nav-config"

export default async function EducationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const schools = await db.school.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  const counts = {
    MAAHAD: schools.filter((s) => s.type === "MAAHAD").length,
    SECONDARY: schools.filter((s) => s.type === "SECONDARY").length,
    PRIMARY: schools.filter((s) => s.type === "PRIMARY").length,
    COLLEGE: schools.filter((s) => s.type === "COLLEGE").length,
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
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: t("education.maahad"), value: counts.MAAHAD },
            { label: t("education.secondary"), value: counts.SECONDARY },
            { label: t("education.primary"), value: counts.PRIMARY },
            { label: t("education.college"), value: counts.COLLEGE },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="font-serif text-2xl font-semibold text-primary">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </div>
          ))}
        </div>
        <SchoolsDirectory
          schools={schools.map((s) => ({
            id: s.id,
            slug: s.slug,
            name: localizedField(s, "name", locale, s.name),
            type: s.type,
            category: s.category,
            level: s.level,
            gender: s.gender,
            medium: s.medium,
            region: s.region,
            about: localizedField(s, "about", locale, s.about),
          }))}
          locale={locale}
        />
      </Section>
    </>
  )
}
