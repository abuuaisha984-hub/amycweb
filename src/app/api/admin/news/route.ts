import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { can, writeAudit } from "@/lib/rbac"
import { articleInputSchema, parseArticleDate } from "@/lib/article-input"

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "article")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const sp = req.nextUrl.searchParams
  const status = sp.get("status") || undefined
  const kind = sp.get("kind") || undefined
  const query = sp.get("q")?.trim().slice(0, 120)
  const where: any = { deletedAt: null }
  if (session.user.role === "REGIONAL_EDITOR") {
    if (!session.user.scopeRegionId) return NextResponse.json({ error: "Regional scope is not configured" }, { status: 403 })
    where.scope = "REGION"
    where.scopeRegionId = session.user.scopeRegionId
  }
  if (status) where.status = status
  if (kind) where.kind = kind
  if (query) where.OR = [{ title: { contains: query } }, { excerpt: { contains: query } }]
  const page = Math.max(1, Math.min(100_000, Number.parseInt(sp.get("page") || "1", 10) || 1))
  const pageSize = 50
  const total = await db.article.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const articles = await db.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * pageSize,
    take: pageSize,
  })
  return NextResponse.json({ articles, pagination: { page: safePage, pageSize, total, totalPages } })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "article")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const raw = await req.json().catch(() => null)
  const parsed = articleInputSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: "Invalid article data", issues: parsed.error.issues }, { status: 400 })
  const body = parsed.data
  const {
    title, excerpt, content, kind = "NEWS", category, author, status = "DRAFT",
    featured = false, publishedAt, expiresAt, featuredImage, imageCredit, scope = "HQ",
    translations, scopeRegionId,
  } = body

  if (!["NEWS", "ANNOUNCEMENT"].includes(kind) || !["HQ", "REGION", "SCHOOL", "PROGRAMME"].includes(scope)) {
    return NextResponse.json({ error: "Invalid content kind or scope" }, { status: 400 })
  }
  if (status !== "DRAFT" && status !== "PUBLISHED") {
    return NextResponse.json({ error: "Status must be DRAFT or PUBLISHED" }, { status: 400 })
  }

  if (!title || !excerpt || !content) {
    return NextResponse.json({ error: "Title, excerpt and content are required" }, { status: 400 })
  }
  if (session.user.role === "REGIONAL_EDITOR" && (scope !== "REGION" || scopeRegionId !== session.user.scopeRegionId)) {
    return NextResponse.json({ error: "Regional editors may create content only for their assigned region" }, { status: 403 })
  }
  if (scope === "REGION") {
    const region = scopeRegionId
      ? await db.region.findFirst({ where: { id: scopeRegionId, status: "PUBLISHED", deletedAt: null }, select: { id: true } })
      : null
    if (!region) return NextResponse.json({ error: "Select a valid published region for regional content" }, { status: 400 })
  }
  const publishDate = publishedAt ? parseArticleDate(publishedAt) : status === "PUBLISHED" ? new Date() : null
  const expiryDate = expiresAt ? parseArticleDate(expiresAt) : null
  if (publishDate instanceof Date && expiryDate instanceof Date && expiryDate <= publishDate) {
    return NextResponse.json({ error: "Expiry date must be later than the publication date" }, { status: 400 })
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
      scopeRegionId: scope === "REGION" ? scopeRegionId || null : null,
      featuredImage: featuredImage || null,
      imageCredit: imageCredit || null,
      publishedAt: publishDate,
      expiresAt: expiryDate,
      translations: typeof translations === "string" ? translations : JSON.stringify(translations || {}),
    },
  })
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: status === "PUBLISHED" ? "PUBLISH" : "CREATE", entity: "Article", entityId: article.id,
    detail: `${status === "PUBLISHED" ? "Published" : "Created draft"} ${kind.toLowerCase()} "${title}" (${status})`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ article })
}
