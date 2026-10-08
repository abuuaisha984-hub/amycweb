import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { can, writeAudit } from "@/lib/rbac"
import { articleInputSchema, parseArticleDate } from "@/lib/article-input"
import { articleStatusAuditAction, type ArticleWorkflowStatus } from "@/lib/article-workflow"

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "article")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const raw = await req.json().catch(() => null)
  const parsed = articleInputSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: "Invalid article data", issues: parsed.error.issues }, { status: 400 })
  const body = parsed.data
  const existing = await db.article.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (session.user.role === "REGIONAL_EDITOR" && (!session.user.scopeRegionId || existing.scope !== "REGION" || existing.scopeRegionId !== session.user.scopeRegionId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data: Prisma.ArticleUpdateInput = {}
  const editableFields = {
    title: body.title,
    excerpt: body.excerpt,
    content: body.content,
    kind: body.kind,
    category: body.category,
    author: body.author,
    featuredImage: body.featuredImage,
    imageCredit: body.imageCredit,
    scope: body.scope,
  }
  for (const [key, value] of Object.entries(editableFields)) {
    if (value !== undefined) Object.assign(data, { [key]: value })
  }
  if (session.user.role === "REGIONAL_EDITOR" && (("scope" in body && body.scope !== "REGION") || ("scopeRegionId" in body && body.scopeRegionId !== session.user.scopeRegionId))) {
    return NextResponse.json({ error: "Regional editors cannot change their assigned region" }, { status: 403 })
  }
  const nextScope = body.scope || existing.scope
  const nextScopeRegionId = "scopeRegionId" in body ? body.scopeRegionId : existing.scopeRegionId
  if (nextScope === "REGION") {
    const region = nextScopeRegionId
      ? await db.region.findFirst({ where: { id: nextScopeRegionId, status: "PUBLISHED", deletedAt: null }, select: { id: true } })
      : null
    if (!region) return NextResponse.json({ error: "Select a valid published region for regional content" }, { status: 400 })
  }
  if (existing.status !== "DRAFT" && existing.status !== "PUBLISHED") {
    return NextResponse.json({ error: "The saved content has an unsupported status" }, { status: 409 })
  }
  const currentStatus = existing.status as ArticleWorkflowStatus
  const nextStatus = (body.status || currentStatus) as ArticleWorkflowStatus
  if (nextStatus !== currentStatus || "status" in body) data.status = nextStatus
  if ("scopeRegionId" in body) data.scopeRegionId = body.scope === "REGION" || (!body.scope && existing.scope === "REGION") ? body.scopeRegionId : null
  else if (body.scope && body.scope !== "REGION") data.scopeRegionId = null
  if ("featured" in body) data.featured = !!body.featured
  const publishedAt = "publishedAt" in body ? parseArticleDate(body.publishedAt) : existing.publishedAt
  const expiresAt = "expiresAt" in body ? parseArticleDate(body.expiresAt) : existing.expiresAt
  if (publishedAt instanceof Date && expiresAt instanceof Date && expiresAt <= publishedAt) {
    return NextResponse.json({ error: "Expiry date must be later than the publication date" }, { status: 400 })
  }
  if ("publishedAt" in body) data.publishedAt = publishedAt
  else if (nextStatus === "PUBLISHED" && currentStatus !== "PUBLISHED") data.publishedAt = new Date()
  if ("expiresAt" in body) data.expiresAt = expiresAt
  if ("translations" in body) {
    data.translations = typeof body.translations === "string" ? body.translations : JSON.stringify(body.translations || {})
  }
  if (body.title && body.title !== existing.title) {
    let s = slugify(body.slug || body.title)
    const clash = await db.article.findUnique({ where: { slug: s } })
    if (clash && clash.id !== id) s = `${s}-${Date.now().toString(36)}`
    data.slug = s
  }

  const article = await db.article.update({ where: { id }, data })
  const statusAction = currentStatus === nextStatus
    ? null
    : articleStatusAuditAction(currentStatus, nextStatus)
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: statusAction || "UPDATE", entity: "Article", entityId: id,
    detail: statusAction
      ? `${statusAction.replaceAll("_", " ")} "${article.title}" (${currentStatus} → ${nextStatus})`
      : `Updated article "${article.title}"`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ article })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "article")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const existing = await db.article.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (session.user.role === "REGIONAL_EDITOR" && (!session.user.scopeRegionId || existing.scope !== "REGION" || existing.scopeRegionId !== session.user.scopeRegionId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const article = await db.article.update({ where: { id }, data: { deletedAt: new Date(), status: "DRAFT" } })
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: "DELETE", entity: "Article", entityId: id,
    detail: `Archived article "${article.title}"`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ ok: true })
}
