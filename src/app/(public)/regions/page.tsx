import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { RegionsDirectory } from "@/components/site/regions-directory"

export default async function RegionsPage() {
  const regions = await db.region.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: { sortOrder: "asc" },
  })
  return (
    <>
      <PageHero
        eyebrow="Regions · Majimbo"
        title="A nationwide network of regional branches"
        description={`AMYC coordinates its work through ${regions.length} Majimbo across Tanzania — each overseeing da'wah, education, welfare and youth programmes in its locality.`}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Regions" }]}
      />
      <Section>
        <RegionsDirectory regions={regions} />
      </Section>
    </>
  )
}
