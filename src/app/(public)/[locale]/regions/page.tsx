import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { RegionsDirectory } from "@/components/site/regions-directory"
import { localizedField, ui, type Locale } from "@/lib/locale-page"
import { lp } from "@/components/site/nav-config"
import { isRegionBandKey } from "@/lib/region-bands"
import type { Metadata } from "next"
import { publicPageMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: value } = await params
  const locale = value === "sw" || value === "ar" ? value : "en"
  return publicPageMetadata(locale, "/regions", ui(locale, "regions.title"), ui(locale, "regions.desc"))
}

export default async function RegionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [{ locale: localeStr }, query] = await Promise.all([params, searchParams])
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const requestedBand = Array.isArray(query.kanda) ? query.kanda[0] : query.kanda
  const selectedBand = isRegionBandKey(requestedBand) ? requestedBand : null
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
            overview: (() => { const overview = localizedField(r, "overview", locale, r.overview); return overview.startsWith("This Jimbo is listed in the AMYC directory.") ? "" : overview })(),
            administrativeRegion: r.administrativeRegion,
            district: r.district,
          }))}
          locale={locale}
          selectedBand={selectedBand}
        />
      </Section>
    </>
  )
}
