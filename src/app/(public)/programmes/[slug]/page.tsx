import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, Eyebrow } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, BookOpen, GraduationCap, HeartHandshake, Hammer, Stethoscope, Users, Sprout, Radio, Baby, Sparkles, CheckCircle2 } from "lucide-react"

const ICONS: Record<string, any> = {
  dawah: BookOpen, education: GraduationCap, "social-welfare": HeartHandshake, "community-services": Hammer,
  healthcare: Stethoscope, "youth-development": Users, "development-projects": Sprout, "media-communication": Radio, "orphan-welfare": Baby,
}

export default async function ProgrammePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const programme = await db.programme.findUnique({ where: { slug } })
  if (!programme || programme.status !== "PUBLISHED") notFound()
  const others = await db.programme.findMany({
    where: { status: "PUBLISHED", slug: { not: slug } },
    orderBy: { sortOrder: "asc" },
    take: 4,
  })
  const Icon = ICONS[programme.slug] || Sparkles

  return (
    <>
      <PageHero
        eyebrow="Programme"
        title={programme.name}
        description={programme.shortDescription}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Programmes", href: "/programmes" }, { label: programme.name }]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/contact">Get Involved</Link>
          </Button>
          <Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
            <Link href="/news">Related News</Link>
          </Button>
        </div>
      </PageHero>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <h2 className="mt-5 font-serif text-2xl font-semibold tracking-tight">About this programme</h2>
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground text-pretty">{programme.description}</p>
          </div>
          <div className="space-y-4">
            <Card className="border-primary/15 bg-secondary/30">
              <CardContent className="p-6">
                <Eyebrow>Explore More</Eyebrow>
                <ul className="mt-4 space-y-2">
                  {others.map((o) => (
                    <li key={o.id}>
                      <Link href={`/programmes/${o.slug}`} className="group flex items-center justify-between gap-2 rounded-lg p-2 transition hover:bg-accent/20">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary">{o.name}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-accent/30">
              <CardContent className="p-6">
                <h3 className="font-serif text-base font-semibold">Want to support this programme?</h3>
                <p className="mt-2 text-sm text-muted-foreground">Partner with AMYC or volunteer your time to help expand our reach across Tanzania.</p>
                <Button asChild className="mt-4 w-full bg-primary">
                  <Link href="/contact">Contact AMYC</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>
    </>
  )
}
