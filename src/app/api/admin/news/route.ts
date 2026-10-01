import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { can, writeAudit } from "@/lib/rbac"

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const sp = req.nextUrl.searchParams
  const status = sp.get("status") || undefined
  const kind = sp.get("kind") || undefined
  const where: any = { deletedAt: null }
  if (status) where.status = status
  if (kind) where.kind = kind
  const articles = await db.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  })
  return NextResponse.json({ articles })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "article")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const {
    title, excerpt, content, kind = "NEWS", category, author, status = "DRAFT",
    featured = false, publishedAt, expiresAt, featuredImage, imageCredit, scope = "HQ",
  } = body

  if (!title || !excerpt || !content) {
    return NextResponse.json({ error: "Title, excerpt and content are required" }, { status: 400 })
  }
  let slug = slugify(body.slug || title)
  if (!slug) slug = `article-${Date.now()}`
  // ensure unique
  const existing = await db.article.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  const article = await db.article.create({
    data: {
      slug, title, excerpt, content, kind, category, author, status,
      featured: !!featured, scope,
      featuredImage: featuredImage || null,
      imageCredit: imageCredit || null,
      publishedAt: publishedAt ? new Date(publishedAt) : (status === "PUBLISHED" ? new Date() : null),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: "CREATE", entity: "Article", entityId: article.id,
    detail: `Created ${kind.toLowerCase()} "${title}" (${status})`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ article })
}
