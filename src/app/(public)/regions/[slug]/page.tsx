import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, Eyebrow } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Globe, Mail, Phone, ArrowRight, Users2, Activity } from "lucide-react"

function parseArr<T = any>(s: string | null): T[] {
  if (!s) return []
  try { return JSON.parse(s) as T[] } catch { return [] }
}

export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const region = await db.region.findUnique({ where: { slug } })
  if (!region || region.status !== "PUBLISHED" || region.deletedAt) notFound()

  const leadership = parseArr<{ position: string; name: string }>(region.leadership)
  const activities = parseArr<string>(region.activities)
  const branches = parseArr<{ name: string; note?: string }>(region.branches)

  return (
    <>
      <PageHero
        eyebrow="Jimbo · Regional Branch"
        title={region.name}
        description={region.englishName ? `English: ${region.englishName}` : region.overview}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Regions", href: "/regions" }, { label: region.name }]}
      >
        {region.website && (
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <a href={region.website} target="_blank" rel="noopener noreferrer">
              <Globe className="mr-1.5 h-3.5 w-3.5" /> Visit Regional Website
            </a>
          </Button>
        )}
      </PageHero>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-10">
            <div>
              <Eyebrow>Overview</Eyebrow>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{region.overview}</p>
            </div>

            {region.history && (
              <div>
                <Eyebrow>History</Eyebrow>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{region.history}</p>
              </div>
            )}

            {activities.length > 0 && (
              <div>
                <Eyebrow>Activities</Eyebrow>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activities.map((a) => (
                    <Badge key={a} variant="secondary" className="rounded-full border border-primary/15 bg-background px-3 py-1">
                      <Activity className="mr-1 h-3 w-3 text-primary" /> {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {branches.length > 0 && (
              <div>
                <Eyebrow>Branches</Eyebrow>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {branches.map((b, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-3 text-sm">
                      <span className="font-medium text-foreground">{b.name}</span>
                      {b.note && <p className="text-xs text-muted-foreground">{b.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leadership.length > 0 && (
              <div>
                <Eyebrow>Leadership</Eyebrow>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {leadership.map((l, i) => (
                    <Card key={i} className="border-border">
                      <CardContent className="flex items-center gap-3 p-4">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Users2 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs text-muted-foreground">{l.position}</p>
                          <p className="text-sm font-semibold text-foreground">{l.name}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Leadership names are to be confirmed with AMYC before publication.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card className="border-primary/15 bg-secondary/30">
              <CardContent className="p-6">
                <h3 className="font-serif text-base font-semibold">Contact</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {region.contact && <li>{region.contact}</li>}
                  {region.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {region.email}</li>}
                  {region.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {region.phone}</li>}
                  {!region.contact && !region.email && !region.phone && <li className="text-xs">Contact details are to be confirmed with AMYC.</li>}
                </ul>
              </CardContent>
            </Card>
            <Button asChild variant="outline" className="w-full">
              <Link href="/regions">← Back to all Majimbo</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
