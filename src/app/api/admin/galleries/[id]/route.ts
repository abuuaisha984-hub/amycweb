import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { can, canRead, writeAudit } from "@/lib/rbac"

const schema = z.object({ title: z.string().trim().min(2).max(200), slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().max(5000).nullable().optional(), category: z.string().trim().max(100).nullable().optional(), coverImage: z.string().trim().max(1000).nullable().optional(), status: z.enum(["DRAFT", "PUBLISHED"]), items: z.array(z.object({ id: z.string().optional(), mediaUrl: z.string().trim().min(1).max(1000), caption: z.string().trim().max(400).nullable().optional(), sortOrder: z.number().int().min(0).optional() })).max(100) })
const optional = (value: string | null | undefined) => value?.trim() || null
async function authorize(access: "read" | "write" = "write") { const session = await getServerSession(authOptions); if (!session?.user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }; const allowed = access === "read" ? canRead(session.user.role, "media") || canRead(session.user.role, "gallery") : can(session.user.role, "media") || can(session.user.role, "gallery"); if (!allowed) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }; return { session } }

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(); if ("response" in auth) return auth.response; const { id } = await params
  const parsed = schema.safeParse(await req.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the gallery details and try again.", fields: parsed.error.flatten().fieldErrors }, { status: 400 })
  if (new Set(parsed.data.items.map((item) => item.mediaUrl)).size !== parsed.data.items.length) return NextResponse.json({ error: "Each image can only be added once to a gallery." }, { status: 400 })
  const suppliedIds = parsed.data.items.flatMap((item) => item.id ? [item.id] : [])
  if (new Set(suppliedIds).size !== suppliedIds.length) return NextResponse.json({ error: "An image was included more than once." }, { status: 400 })
  const current = await db.gallery.findUnique({ where: { id }, select: { id: true, title: true } }); if (!current) return NextResponse.json({ error: "Gallery not found." }, { status: 404 })
  const ownedItems = await db.galleryItem.findMany({ where: { galleryId: id }, select: { id: true } })
  if (suppliedIds.some((itemId) => !ownedItems.some((item) => item.id === itemId))) return NextResponse.json({ error: "An image does not belong to this gallery." }, { status: 400 })
  if (await db.gallery.findFirst({ where: { slug: parsed.data.slug, id: { not: id } }, select: { id: true } })) return NextResponse.json({ error: "That gallery URL is already in use." }, { status: 409 })
  const input = parsed.data
  try {
    const gallery = await db.$transaction(async (tx) => {
      await tx.galleryItem.deleteMany({ where: { galleryId: id, ...(suppliedIds.length ? { id: { notIn: suppliedIds } } : {}) } })
      for (const [index, item] of input.items.entries()) {
        const data = { mediaUrl: item.mediaUrl, caption: optional(item.caption), sortOrder: item.sortOrder ?? index }
        if (item.id) await tx.galleryItem.update({ where: { id: item.id }, data })
        else await tx.galleryItem.create({ data: { ...data, galleryId: id } })
      }
      return tx.gallery.update({ where: { id }, data: { title: input.title, slug: input.slug, description: optional(input.description), category: optional(input.category), coverImage: optional(input.coverImage) || input.items[0]?.mediaUrl || null, status: input.status }, include: { items: { orderBy: { sortOrder: "asc" } } } })
    })
    await writeAudit({ userId: auth.session.user.id, userName: auth.session.user.name || "Administrator", action: "UPDATE", entity: "Gallery", entityId: id, detail: `Updated gallery "${current.title}" with ${gallery.items.length} images`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
    return NextResponse.json({ gallery })
  } catch (error) { console.error("Gallery update failed", error); return NextResponse.json({ error: "The gallery could not be updated. Please try again." }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(); if ("response" in auth) return auth.response; const { id } = await params
  const gallery = await db.gallery.findUnique({ where: { id }, select: { id: true, title: true } }); if (!gallery) return NextResponse.json({ error: "Gallery not found." }, { status: 404 })
  await db.gallery.delete({ where: { id } })
  await writeAudit({ userId: auth.session.user.id, userName: auth.session.user.name || "Administrator", action: "DELETE", entity: "Gallery", entityId: id, detail: `Deleted gallery "${gallery.title}" and its media records`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ success: true })
}
