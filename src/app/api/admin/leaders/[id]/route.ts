import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { can, writeAudit } from "@/lib/rbac"

const schema = z.object({
  name: z.string().trim().min(1, "Enter the leader's name.").max(500, "The leader name is too long."),
  position: z.string().trim().min(1, "Enter the leader's position.").max(500, "The position is too long."), category: z.enum(["NATIONAL", "REGIONAL"]),
  regionId: z.string().nullable().optional(), department: z.string().trim().max(160).nullable().optional(), level: z.string().trim().max(120).nullable().optional(),
  photo: z.string().trim().max(1000).nullable().optional(), photoAlt: z.string().trim().max(240).nullable().optional(), photoCredit: z.string().trim().max(240).nullable().optional(),
  bio: z.string().trim().max(10000).nullable().optional(), email: z.string().trim().email().max(180).nullable().optional().or(z.literal("")), phone: z.string().trim().max(80).nullable().optional(),
  startDate: z.coerce.date().nullable().optional(), endDate: z.coerce.date().nullable().optional(), sortOrder: z.number().int().min(0).max(100000),
  featured: z.boolean(), status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]), translations: z.string().max(30000),
})
const optional = (value: string | null | undefined) => value?.trim() || null

function validationError(error: z.ZodError) {
  const issue = error.issues[0]
  const labels: Record<string, string> = { name: "Leader name", position: "Position", category: "Organization scope", regionId: "Region", email: "Public email" }
  return `${labels[String(issue?.path[0])] || "Leader details"}: ${issue?.message || "invalid value"}`
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "leader")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const current = await db.leader.findUnique({ where: { id }, select: { id: true, name: true, category: true, regionId: true, deletedAt: true } })
  if (!current || current.deletedAt) return NextResponse.json({ error: "Leader not found." }, { status: 404 })
  if (session.user.role === "REGIONAL_EDITOR" && (current.category !== "REGIONAL" || current.regionId !== session.user.scopeRegionId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: validationError(parsed.error), fields: parsed.error.flatten().fieldErrors }, { status: 400 })
  const input = parsed.data
  if (input.category === "REGIONAL" && !input.regionId) return NextResponse.json({ error: "Choose the region for this leader." }, { status: 400 })
  if (session.user.role === "REGIONAL_EDITOR" && (input.category !== "REGIONAL" || input.regionId !== session.user.scopeRegionId)) return NextResponse.json({ error: "You can only manage leaders for your assigned region." }, { status: 403 })
  if (input.regionId && !await db.region.findFirst({ where: { id: input.regionId, deletedAt: null }, select: { id: true } })) return NextResponse.json({ error: "Selected region was not found." }, { status: 400 })
  const updated = await db.leader.update({ where: { id }, data: {
    ...input, regionId: input.category === "REGIONAL" ? input.regionId : null,
    department: optional(input.department), level: optional(input.level), photo: optional(input.photo), photoAlt: optional(input.photoAlt),
    photoCredit: optional(input.photoCredit), bio: optional(input.bio), email: optional(input.email), phone: optional(input.phone),
  } })
  await writeAudit({ userId: session.user.id, userName: session.user.name || "Administrator", action: input.status === "ACTIVE" ? "PUBLISH" : "UPDATE", entity: "Leader", entityId: id, detail: `Updated leadership record "${current.name}" (${input.status})`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ leader: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "leader") || session.user.role === "REGIONAL_EDITOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const leader = await db.leader.findUnique({ where: { id }, select: { id: true, name: true, deletedAt: true } })
  if (!leader || leader.deletedAt) return NextResponse.json({ error: "Leader not found." }, { status: 404 })
  await db.leader.update({ where: { id }, data: { status: "ARCHIVED" } })
  await writeAudit({ userId: session.user.id, userName: session.user.name || "Administrator", action: "ARCHIVE", entity: "Leader", entityId: id, detail: `Archived leadership record "${leader.name}"`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ success: true })
}
