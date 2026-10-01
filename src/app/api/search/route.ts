import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ results: {} })
  }

  const [pages, articles, schools, regions, events, documents] = await Promise.all([
    db.page.findMany({
      where: { status: "PUBLISHED", OR: [{ title: { contains: q } }, { content: { contains: q } }, { excerpt: { contains: q } }] },
      take: 6,
    }),
    db.article.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        OR: [{ title: { contains: q } }, { excerpt: { contains: q } }, { content: { contains: q } }],
      },
      orderBy: { publishedAt: "desc" },
      take: 8,
    }),
    db.school.findMany({
      where: { status: "PUBLISHED", deletedAt: null, OR: [{ name: { contains: q } }, { about: { contains: q } }, { region: { contains: q } }] },
      take: 8,
    }),
    db.region.findMany({
      where: { status: "PUBLISHED", deletedAt: null, OR: [{ name: { contains: q } }, { englishName: { contains: q } }, { overview: { contains: q } }] },
      take: 8,
    }),
    db.event.findMany({
      where: { status: "PUBLISHED", deletedAt: null, OR: [{ title: { contains: q } }, { description: { contains: q } }, { location: { contains: q } }] },
      take: 6,
    }),
    db.document.findMany({
      where: { status: "PUBLISHED", deletedAt: null, OR: [{ title: { contains: q } }, { description: { contains: q } }, { category: { contains: q } }] },
      take: 6,
    }),
  ])

  const results = {
    page: pages.map((p) => ({ type: "page", title: p.title, href: p.slug === "about" ? "/about" : `/page/${p.slug}`, excerpt: p.excerpt || "" })),
    article: articles.map((a) => ({ type: "article", title: a.title, href: `/news/${a.slug}`, excerpt: a.excerpt })),
    school: schools.map((s) => ({ type: "school", title: s.name, href: `/education/${s.slug}`, excerpt: s.region ? `${s.type} · ${s.region}` : s.type })),
    region: regions.map((r) => ({ type: "region", title: r.name, href: `/regions/${r.slug}`, excerpt: r.englishName || r.overview.slice(0, 80) })),
    event: events.map((e) => ({ type: "event", title: e.title, href: "/events", excerpt: `${e.venue || ""} ${e.location || ""}`.trim() })),
    document: documents.map((d) => ({ type: "document", title: d.title, href: "/documents", excerpt: `${d.category} · ${d.fileType.toUpperCase()}` })),
  }

  return NextResponse.json({ results })
}
