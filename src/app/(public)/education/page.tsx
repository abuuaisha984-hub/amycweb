import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { SchoolsDirectory } from "@/components/site/schools-directory"

export default async function EducationPage() {
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
        eyebrow="Education Network"
        title="Schools & Educational Institutions"
        description="AMYC runs a nationwide network of Islamic seminaries (Maahad), primary and secondary schools, and a teachers' college — integrating authentic Islamic knowledge with modern academic disciplines."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Education" }]}
      />
      <Section>
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Maahad (Religious)", value: counts.MAAHAD },
            { label: "Secondary Schools", value: counts.SECONDARY },
            { label: "Primary Schools", value: counts.PRIMARY },
            { label: "Teachers College", value: counts.COLLEGE },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="font-serif text-2xl font-semibold text-primary">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </div>
          ))}
        </div>
        <SchoolsDirectory schools={schools} />
      </Section>
    </>
  )
}
