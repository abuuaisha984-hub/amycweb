import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await db.page.findUnique({ where: { slug } })
  if (!page || page.status !== "PUBLISHED") notFound()
  return (
    <>
      <PageHero
        eyebrow="Legal & Information"
        title={page.title}
        description={page.excerpt}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: page.title }]}
      />
      <Section>
        <div className="mx-auto max-w-3xl">
          <div className="space-y-4">
            {page.content.split("\n").map((line, i) => {
              if (line.startsWith("## ")) return <h2 key={i} className="mt-8 font-serif text-xl font-semibold text-foreground">{line.slice(3)}</h2>
              if (line.startsWith("### ")) return <h3 key={i} className="mt-6 font-serif text-lg font-semibold text-foreground">{line.slice(4)}</h3>
              if (line.startsWith("- ")) return <li key={i} className="ml-4 text-muted-foreground">{line.slice(2)}</li>
              if (line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 list-decimal text-muted-foreground">{line.replace(/^\d+\.\s/, "")}</li>
              if (line.trim() === "") return <div key={i} className="h-3" />
              return <p key={i} className="text-base leading-relaxed text-muted-foreground">{line}</p>
            })}
          </div>
        </div>
      </Section>
    </>
  )
}
