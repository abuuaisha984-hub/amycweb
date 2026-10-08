import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { can, writeAudit } from "@/lib/rbac"

const schema = z.object({
  name: z.string().trim().min(2), slug: z.string().trim().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  englishName: z.string().trim().nullable().optional(), administrativeRegion: z.string().trim().nullable().optional(), district: z.string().trim().nullable().optional(),
  overview: z.string().trim(), history: z.string().trim().nullable().optional(),
  leadership: z.array(z.object({ position: z.string().trim().min(1), name: z.string().trim().min(1) })),
  activities: z.array(z.string().trim().min(1)), branches: z.array(z.object({ name: z.string().trim().min(1), note: z.string().trim().optional() })),
  contact: z.string().trim().nullable().optional(), email: z.string().trim().email().nullable().optional().or(z.literal("")), phone: z.string().trim().nullable().optional(),
  website: z.string().trim().url().nullable().optional().or(z.literal("")), image: z.string().trim().nullable().optional(),
  sortOrder: z.number().int().min(0), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]), translations: z.string(),
})
const optional = (value: string | null | undefined) => value?.trim() || null

function validationError(error: z.ZodError) {
  const issue = error.issues[0]
  const field = String(issue?.path[0] || "region details")
  return `${field}: ${issue?.message || "invalid value"}`
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "region")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  if (session.user.role === "REGIONAL_EDITOR" && session.user.scopeRegionId !== id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: validationError(parsed.error), fields: parsed.error.flatten().fieldErrors }, { status: 400 })
  const current = await db.region.findUnique({ where: { id }, select: { id: true, name: true, slug: true, deletedAt: true } })
  if (!current || current.deletedAt) return NextResponse.json({ error: "Region not found." }, { status: 404 })
  if (parsed.data.slug !== current.slug) return NextResponse.json({ error: "Region URLs cannot be changed until redirect support is configured; the current URL is preserved." }, { status: 409 })
  const input = parsed.data
  if (await db.region.findFirst({ where: { slug: input.slug, id: { not: id } }, select: { id: true } })) return NextResponse.json({ error: "That region URL is already in use." }, { status: 409 })
  try {
    const region = await db.region.update({ where: { id }, data: {
      ...input, englishName: optional(input.englishName), administrativeRegion: optional(input.administrativeRegion), district: optional(input.district),
      history: optional(input.history), contact: optional(input.contact),
      email: optional(input.email), phone: optional(input.phone), website: optional(input.website), image: optional(input.image),
      leadership: JSON.stringify(input.leadership), activities: JSON.stringify(input.activities), branches: JSON.stringify(input.branches),
    } })
    await writeAudit({ userId: session.user.id, userName: session.user.name || "Administrator", action: "UPDATE", entity: "Region", entityId: id, detail: `Updated region "${current.name}" (${region.status})`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
    return NextResponse.json({ region })
  } catch (error) {
    console.error("Region update failed", error)
    return NextResponse.json({ error: "The region could not be updated. Please try again." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "region") || session.user.role === "REGIONAL_EDITOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const region = await db.region.findUnique({ where: { id }, select: { id: true, name: true, deletedAt: true } })
  if (!region || region.deletedAt) return NextResponse.json({ error: "Region not found." }, { status: 404 })
  await db.region.update({ where: { id }, data: { status: "ARCHIVED" } })
  await writeAudit({ userId: session.user.id, userName: session.user.name || "Administrator", action: "ARCHIVE", entity: "Region", entityId: id, detail: `Archived region "${region.name}"`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ success: true })
}
