import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { SITE_ORIGIN } from "@/lib/seo"

export const dynamic = "force-dynamic"

const locales = ["en", "sw", "ar"] as const
const staticRoutes = ["", "/about", "/programmes", "/education", "/regions", "/news", "/events", "/media", "/documents", "/contact"]

function localizedUrl(locale: string, route: string) {
  return new URL(`/${locale}${route}`, SITE_ORIGIN).toString()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = locales.flatMap((locale) => staticRoutes.map((route) => ({
    url: localizedUrl(locale, route),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/about" ? 0.8 : 0.7,
  })))

  try {
    const [articles, schools, regions, programmes, pages] = await Promise.all([
      db.article.findMany({
        where: { status: "PUBLISHED", deletedAt: null, publishedAt: { lte: now }, AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }] },
        select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" }, take: 2000,
      }),
      db.school.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { slug: true, updatedAt: true }, take: 2000 }),
      db.region.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { slug: true, updatedAt: true }, take: 1000 }),
      db.programme.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true }, take: 500 }),
      db.page.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true }, take: 500 }),
    ])

    for (const locale of locales) {
      entries.push(
        ...articles.map((row) => ({ url: localizedUrl(locale, `/news/${encodeURIComponent(row.slug)}`), lastModified: row.updatedAt, changeFrequency: "monthly" as const, priority: 0.65 })),
        ...schools.map((row) => ({ url: localizedUrl(locale, `/education/${encodeURIComponent(row.slug)}`), lastModified: row.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
        ...regions.map((row) => ({ url: localizedUrl(locale, `/regions/${encodeURIComponent(row.slug)}`), lastModified: row.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
        ...programmes.map((row) => ({ url: localizedUrl(locale, `/programmes/${encodeURIComponent(row.slug)}`), lastModified: row.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
        ...pages.map((row) => ({ url: localizedUrl(locale, `/info/${encodeURIComponent(row.slug)}`), lastModified: row.updatedAt, changeFrequency: "yearly" as const, priority: 0.3 })),
      )
    }
  } catch (error) {
    console.error("Sitemap content query failed; returning public static routes only.", error)
  }

  return entries
}
