import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

export default async function MediaPage() {
  const galleries = await db.gallery.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: { items: { take: 4, orderBy: { sortOrder: "asc" } } },
  })
  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="Media & Gallery"
        description="Moments from AMYC's events, schools, projects, da'wah and community work across Tanzania."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Media" }]}
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {galleries.map((g) => (
            <Card key={g.id} className="group overflow-hidden border-border transition hover:shadow-card">
              <div className="grid grid-cols-2 gap-1 bg-primary/5">
                {g.items.slice(0, 4).map((it, i) => (
                  <div key={it.id} className={`relative ${i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"}`}>
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/10">
                      <Sparkles className="h-6 w-6 text-primary/30" />
                    </div>
                  </div>
                ))}
              </div>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-semibold">{g.title}</h3>
                  {g.category && <Badge variant="secondary" className="text-[0.65rem]">{g.category}</Badge>}
                </div>
                {g.description && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{g.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </>
  )
}
