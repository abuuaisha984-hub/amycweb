import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Baby, BookOpen, GraduationCap, Hammer, HeartHandshake, Radio, Sparkles, Sprout, Stethoscope, Users } from "lucide-react"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, Eyebrow } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgrammeImageGallery } from "@/components/site/programme-image-gallery"
import { lp } from "@/components/site/nav-config"
import { localizedField, ui, type Locale } from "@/lib/locale-page"
import { parseTranslations } from "@/lib/i18n"
import { assertPresent } from "@/lib/assert-present"
import { publicImage } from "@/lib/public-image"
import { collectProgrammeGalleryImages } from "@/lib/programme-gallery"
import { publicPageMetadata } from "@/lib/seo"

const ICONS: Record<string, typeof Sparkles> = {
  dawah: BookOpen, education: GraduationCap, "social-welfare": HeartHandshake, "community-services": Hammer,
  healthcare: Stethoscope, "youth-development": Users, "development-projects": Sprout, "media-communication": Radio, "orphan-welfare": Baby,
}

type PageProps = { params: Promise<{ slug: string; locale: string }> }

function localeOf(value: string): Locale {
  return value === "sw" || value === "ar" ? value : "en"
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale: localeValue } = await params
  const locale = localeOf(localeValue)
  const programme = await db.programme.findUnique({ where: { slug }, select: { name: true, shortDescription: true, translations: true, status: true } })
  if (!programme || programme.status !== "PUBLISHED") return { title: "Programme" }
  return publicPageMetadata(locale, `/programmes/${encodeURIComponent(slug)}`, localizedField(programme, "name", locale, programme.name), localizedField(programme, "shortDescription", locale, programme.shortDescription))
}

export default async function ProgrammePage({ params }: PageProps) {
  const { slug, locale: localeValue } = await params
  const locale = localeOf(localeValue)
  const t = (key: string) => ui(locale, key)
  const programme = await db.programme.findUnique({ where: { slug } })
  assertPresent(programme)
  if (!programme || programme.status !== "PUBLISHED") notFound()

  const others = await db.programme.findMany({
    where: { status: "PUBLISHED", slug: { not: slug } },
    orderBy: { sortOrder: "asc" },
    take: 4,
  })
  const translations = parseTranslations(programme.translations)
  const localizedContent = translations[locale] || {}
  const galleryImagePaths = collectProgrammeGalleryImages(programme.image, translations, locale)
  const heroImagePath = programme.image || galleryImagePaths[0]
  const heroImage = publicImage(heroImagePath || programme.image)
  const name = localizedField(programme, "name", locale, programme.name)
  const shortDescription = localizedField(programme, "shortDescription", locale, programme.shortDescription)
  const description = localizedField(programme, "description", locale, programme.description)
  const sections: { heading: string; content: string }[] = Array.isArray(localizedContent.sections) && localizedContent.sections.length
    ? localizedContent.sections
    : description.trim().split(/\n\s*\n/).filter(Boolean).map((content: string, index: number) => ({
      heading: index === 0 ? t("programmes.aboutProgramme") : index === 1 ? t("programmes.delivery") : t("programmes.community"),
      content: content.trim(),
    }))
  const images = galleryImagePaths
    .map((image) => publicImage(image))
    .filter((image: string | null): image is string => Boolean(image))
  const Icon = ICONS[programme.slug] || Sparkles

  return (
    <>
      <PageHero
        eyebrow={t("programmes.detailEyebrow")}
        title={name}
        description={shortDescription}
        image={heroImage}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("nav.programmes"), href: lp(locale, "/programmes") }, { label: name }]}
      >
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href={lp(locale, "/contact")}>{t("cta.getInvolved")}</Link>
        </Button>
      </PageHero>

      <Section>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:gap-12">
          <div className="space-y-7">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <Eyebrow>{t("programmes.aboutProgramme")}</Eyebrow>
                <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight">{name}</h2>
              </div>
            </div>

            <div className="space-y-7">
              {sections.map((section, index) => (
                <article key={`${index}-${section.heading}`} className="border-s-2 border-primary/15 ps-5">
                  <h3 className="font-serif text-lg font-semibold text-foreground">{section.heading}</h3>
                  <p className="mt-2 whitespace-pre-line text-base leading-8 text-muted-foreground text-pretty">{section.content}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <ProgrammeImageGallery images={images} name={name} label={t("programmes.galleryLabel")} previousLabel={t("programmes.previousImage")} nextLabel={t("programmes.nextImage")} showLabel={t("programmes.showImage")} />
            <Card className="border-primary/10 bg-secondary/30">
              <CardContent className="p-5 sm:p-6">
                <Eyebrow>{t("programmes.relatedProgrammes")}</Eyebrow>
                <ul className="mt-3 space-y-1">
                  {others.map((other) => (
                    <li key={other.id}>
                      <Link href={lp(locale, `/programmes/${other.slug}`)} className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-accent/20">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary">{localizedField(other, "name", locale, other.name)}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      </Section>

      <Section className="bg-secondary/30">
        <div className="mx-auto max-w-4xl rounded-2xl border border-primary/10 bg-card p-6 shadow-soft sm:p-10">
          <Eyebrow>{t("programmes.community")}</Eyebrow>
          <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">{t("programmes.partnershipTitle")}</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{t("programmes.partnershipDesc")}</p>
          <Button asChild className="mt-6 bg-primary">
            <Link href={lp(locale, "/contact")}>{t("cta.getInvolved")} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" aria-hidden="true" /></Link>
          </Button>
        </div>
      </Section>
    </>
  )
}
