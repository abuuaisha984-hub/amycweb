import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { can, writeAudit } from "@/lib/rbac"

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "article")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const existing = await db.article.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data: any = {}
  for (const k of ["title", "excerpt", "content", "kind", "category", "author", "status", "featuredImage", "imageCredit", "scope"]) {
    if (k in body) data[k] = body[k]
  }
  if ("featured" in body) data.featured = !!body.featured
  if ("publishedAt" in body) data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null
  if ("expiresAt" in body) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
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
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: "UPDATE", entity: "Article", entityId: id,
    detail: `Updated article "${article.title}"`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ article })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "article")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const article = await db.article.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } })
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: "DELETE", entity: "Article", entityId: id,
    detail: `Archived article "${article.title}"`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ ok: true })
}
