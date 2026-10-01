import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { RegionsDirectory } from "@/components/site/regions-directory"
import { localizedField, ui, type Locale } from "@/lib/locale-page"
import { lp } from "@/components/site/nav-config"

export default async function RegionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const regions = await db.region.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { sortOrder: "asc" },
  })
  return (
    <>
      <PageHero
        eyebrow={t("home.regions.eyebrow")}
        title={t("regions.title")}
        description={t("regions.desc")}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("nav.regions") }]}
      />
      <Section>
        <RegionsDirectory
          regions={regions.map((r) => ({
            id: r.id,
            slug: r.slug,
            name: localizedField(r, "name", locale, r.name),
            englishName: r.englishName,
            overview: localizedField(r, "overview", locale, r.overview),
          }))}
          locale={locale}
        />
      </Section>
    </>
  )
}
