import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, Eyebrow } from "@/components/site/sections"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Globe, Building2, GraduationCap, BookOpen, ExternalLink, ShieldCheck, Info } from "lucide-react"

function parseArr(s: string | null): string[] {
  if (!s) return []
  try { return JSON.parse(s) } catch { return [] }
}

export default async function SchoolProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const school = await db.school.findUnique({ where: { slug } })
  if (!school || school.status !== "PUBLISHED" || school.deletedAt) notFound()

  const facilities = parseArr(school.facilities)
  const levels = parseArr(school.levelsOffered)
  const TYPE_LABEL: Record<string, string> = {
    MAAHAD: "Islamic Seminary (Maahad)",
    SECONDARY: "Secondary School",
    PRIMARY: "Primary School",
    COLLEGE: "Teachers College",
  }

  return (
    <>
      <PageHero
        eyebrow={TYPE_LABEL[school.type] || "Institution"}
        title={school.name}
        description={school.shortName || school.category || ""}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Education", href: "/education" },
          { label: school.name },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          {school.region && (
            <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
              <MapPin className="mr-1 h-3 w-3" /> {school.region}{school.district ? `, ${school.district}` : ""}
            </Badge>
          )}
          {school.gender && (
            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">{school.gender}</Badge>
          )}
          {school.medium && (
            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">{school.medium} Medium</Badge>
          )}
          {school.website && (
            <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <a href={school.website} target="_blank" rel="noopener noreferrer">
                <Globe className="mr-1.5 h-3.5 w-3.5" /> Visit School Website
              </a>
            </Button>
          )}
        </div>
      </PageHero>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-10">
            {/* About */}
            <div>
              <Eyebrow>About the School</Eyebrow>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{school.about}</p>
            </div>

            {/* History */}
            {school.history && (
              <div>
                <Eyebrow>History</Eyebrow>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{school.history}</p>
              </div>
            )}

            {/* Education */}
            <div>
              <Eyebrow>Education</Eyebrow>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Card className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-primary"><GraduationCap className="h-4 w-4" /><h3 className="text-sm font-semibold">Levels Offered</h3></div>
                    {levels.length ? (
                      <ul className="mt-3 space-y-1.5">
                        {levels.map((l) => <li key={l} className="text-sm text-muted-foreground">• {l}</li>)}
                      </ul>
                    ) : <p className="mt-2 text-xs text-muted-foreground">Information currently unavailable.</p>}
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-primary"><BookOpen className="h-4 w-4" /><h3 className="text-sm font-semibold">Category</h3></div>
                    <p className="mt-3 text-sm text-muted-foreground">{school.category || "—"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Medium: {school.medium || "—"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Gender: {school.gender || "—"}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <Eyebrow>Facilities</Eyebrow>
              {facilities.length ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {facilities.map((f) => (
                    <div key={f} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
                      <Building2 className="h-4 w-4 text-primary" /> {f}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <Info className="mr-1.5 inline h-4 w-4" /> Facility details are to be verified with AMYC before publication.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-primary/15 bg-secondary/30">
              <CardContent className="p-6">
                <h3 className="font-serif text-base font-semibold">Location</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Region</dt><dd className="font-medium">{school.region || "To be verified"}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-muted-foreground">District</dt><dd className="font-medium">{school.district || "—"}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Ward</dt><dd className="font-medium">{school.ward || "—"}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Address</dt><dd className="font-medium text-right">{school.address || "To be verified"}</dd></div>
                </dl>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`h-5 w-5 ${school.verificationStatus === "VERIFIED" ? "text-emerald-600" : "text-amber-500"}`} />
                  <h3 className="font-serif text-base font-semibold">Verification</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Status: <strong className="text-foreground">{school.verificationStatus}</strong>
                </p>
                {school.sourceName && <p className="mt-1 text-xs text-muted-foreground">Source: {school.sourceName}</p>}
                {school.sourceUrl && (
                  <a href={school.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    View source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Location, enrolment and detailed facility data are to be confirmed with AMYC.
                </p>
              </CardContent>
            </Card>

            <Button asChild variant="outline" className="w-full">
              <Link href="/education">← Back to all schools</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
