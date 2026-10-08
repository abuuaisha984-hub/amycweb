import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site/header"
import { SiteFooter } from "@/components/site/footer"
import { BackToTop } from "@/components/site/back-to-top"
import { VisitorTracker } from "@/components/site/visitor-tracker"
import { archiveExpiredAnnouncements } from "@/lib/expire-articles"
import { LOCALES, isLocale, type Locale, isRTL, DEFAULT_LOCALE } from "@/lib/i18n"

export const dynamicParams = false
export const dynamic = "force-dynamic"

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE
  const dir = isRTL(loc) ? "rtl" : "ltr"
  return {
    title: {
      default: "Ansaar Muslim Youth Centre (AMYC) — Official Digital Platform",
      template: "%s · AMYC",
    },
    description:
      loc === "ar"
        ? "المنصة الرقمية الرسمية لمركز شباب الأنصار المسلمين (AMYC) — مؤسسة إسلامية رائدة في تنزانيا منذ 1980."
        : loc === "sw"
        ? "Jukwaa rasmi la kidijitali la Kituo cha Vijana wa Kiislamu cha Ansaar (AMYC) — taasisi ya Kiislamu yenye mwanzo nchini Tanzania tangu 1980."
        : "The official digital platform of the Ansaar Muslim Youth Centre (AMYC) — a pioneering Islamic institution in Tanzania since 1980.",
    alternates: {
      canonical: `/${loc}`,
      languages: {
        en: "/en",
        sw: "/sw",
        ar: "/ar",
        "x-default": "/en",
      },
    },
    openGraph: {
      locale: loc === "ar" ? "ar" : loc === "sw" ? "sw_TZ" : "en_US",
    },
    other: {
      "dir": dir,
    },
  } as Metadata
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const dir = isRTL(loc) ? "rtl" : "ltr"
  await archiveExpiredAnnouncements()

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden" dir={dir} data-locale={loc}>
      <VisitorTracker />
      <SiteHeader />
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <SiteFooter locale={loc} />
      <BackToTop />
    </div>
  )
}
