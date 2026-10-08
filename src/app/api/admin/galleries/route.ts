import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { can, writeAudit } from "@/lib/rbac"

const schema = z.object({
  title: z.string().trim().min(2).max(200), slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(5000).nullable().optional(), category: z.string().trim().max(100).nullable().optional(), coverImage: z.string().trim().max(1000).nullable().optional(), status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  items: z.array(z.object({ mediaUrl: z.string().trim().min(1).max(1000), caption: z.string().trim().max(400).nullable().optional(), sortOrder: z.number().int().min(0).optional() })).max(100).default([]),
})
const optional = (value: string | null | undefined) => value?.trim() || null
async function authorize() { const session = await getServerSession(authOptions); if (!session?.user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }; if (!can(session.user.role, "media") && !can(session.user.role, "gallery")) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }; return { session } }

export async function GET(req: NextRequest) {
  const auth = await authorize(); if ("response" in auth) return auth.response
  const requestedPage = Math.max(1, Math.min(100_000, Number.parseInt(req.nextUrl.searchParams.get("page") || "1", 10) || 1))
  const pageSize = 12
  const query = req.nextUrl.searchParams.get("q")?.trim().slice(0, 120)
  const where = query ? { OR: [{ title: { contains: query } }, { category: { contains: query } }] } : {}
  const total = await db.gallery.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const galleries = await db.gallery.findMany({ where, include: { items: { orderBy: { sortOrder: "asc" } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize })
  return NextResponse.json({ galleries, pagination: { page, pageSize, total, totalPages } })
}

export async function POST(req: NextRequest) {
  const auth = await authorize(); if ("response" in auth) return auth.response
  const parsed = schema.safeParse(await req.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the gallery details and try again.", fields: parsed.error.flatten().fieldErrors }, { status: 400 })
  const input = parsed.data
  if (new Set(input.items.map((item) => item.mediaUrl)).size !== input.items.length) return NextResponse.json({ error: "Each image can only be added once to a gallery." }, { status: 400 })
  if (await db.gallery.findUnique({ where: { slug: input.slug }, select: { id: true } })) return NextResponse.json({ error: "That gallery URL is already in use." }, { status: 409 })
  try {
    const gallery = await db.gallery.create({ data: { title: input.title, slug: input.slug, description: optional(input.description), category: optional(input.category), coverImage: optional(input.coverImage) || input.items[0]?.mediaUrl || null, status: input.status, items: { create: input.items.map((item, index) => ({ mediaUrl: item.mediaUrl, caption: optional(item.caption), sortOrder: item.sortOrder ?? index })) } }, include: { items: { orderBy: { sortOrder: "asc" } } } })
    await writeAudit({ userId: auth.session.user.id, userName: auth.session.user.name || "Administrator", action: "CREATE", entity: "Gallery", entityId: gallery.id, detail: `Created gallery "${gallery.title}" with ${gallery.items.length} images`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
    return NextResponse.json({ gallery }, { status: 201 })
  } catch (error) { console.error("Gallery create failed", error); return NextResponse.json({ error: "The gallery could not be saved. Please try again." }, { status: 500 }) }
}
