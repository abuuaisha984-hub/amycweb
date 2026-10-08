import type { Metadata } from "next"
import { ui, type Locale } from "@/lib/i18n"

export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://amyc.or.tz"

export function publicPageMetadata(
  locale: Locale,
  route: string,
  title: string,
  description: string,
  image?: string | null,
): Metadata {
  const pathname = `/${locale}${route === "/" ? "" : route}`
  const url = new URL(pathname, SITE_ORIGIN).toString()
  const imageUrl = image && (image.startsWith("/") || /^https:\/\//i.test(image))
    ? new URL(image, SITE_ORIGIN).toString()
    : undefined

  return {
    title,
    description: description.slice(0, 300),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(([
        ["en", `/en${route === "/" ? "" : route}`],
        ["sw", `/sw${route === "/" ? "" : route}`],
        ["ar", `/ar${route === "/" ? "" : route}`],
        ["x-default", `/en${route === "/" ? "" : route}`],
      ]).map(([key, path]) => [key, new URL(path, SITE_ORIGIN).toString()])),
    },
    openGraph: {
      title,
      description: description.slice(0, 300),
      url,
      siteName: "Ansaar Muslim Youth Centre (AMYC)",
      locale: locale === "ar" ? "ar" : locale === "sw" ? "sw_TZ" : "en_US",
      type: "website",
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description: description.slice(0, 300),
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    robots: { index: true, follow: true },
  }
}

export function staticPageMetadata(locale: Locale, route: string, titleKey: string, descriptionKey: string): Metadata {
  return publicPageMetadata(locale, route, ui(locale, titleKey), ui(locale, descriptionKey))
}
