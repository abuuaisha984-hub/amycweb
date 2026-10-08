import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { can, writeAudit } from "@/lib/rbac"

const eventSchema = z.object({
  title: z.string().trim().min(2).max(220), slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().max(12000),
  image: z.string().trim().max(1000).nullable().optional(), startDate: z.coerce.date(), endDate: z.coerce.date().nullable().optional(), startTime: z.string().trim().max(40).nullable().optional(), endTime: z.string().trim().max(40).nullable().optional(),
  venue: z.string().trim().max(220).nullable().optional(), location: z.string().trim().max(220).nullable().optional(), organizer: z.string().trim().max(180).nullable().optional(), registrationLink: z.string().trim().url().max(500).nullable().optional().or(z.literal("")), contact: z.string().trim().max(300).nullable().optional(), category: z.string().trim().max(100).nullable().optional(), status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "CANCELLED"]), translations: z.string().max(30000),
})
const optional = (value: string | null | undefined) => value?.trim() || null

async function authorize() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (!can(session.user.role, "event")) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { session }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(); if ("response" in auth) return auth.response
  const { id } = await params; const parsed = eventSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the event details and try again.", fields: parsed.error.flatten().fieldErrors }, { status: 400 })
  const current = await db.event.findUnique({ where: { id }, select: { id: true, title: true, deletedAt: true } })
  if (!current || current.deletedAt) return NextResponse.json({ error: "Event not found." }, { status: 404 })
  if (await db.event.findFirst({ where: { slug: parsed.data.slug, id: { not: id } }, select: { id: true } })) return NextResponse.json({ error: "That event URL is already in use." }, { status: 409 })
  const input = parsed.data
  try {
    const event = await db.event.update({ where: { id }, data: { ...input, image: optional(input.image), startTime: optional(input.startTime), endTime: optional(input.endTime), venue: optional(input.venue), location: optional(input.location), organizer: optional(input.organizer), registrationLink: optional(input.registrationLink), contact: optional(input.contact), category: optional(input.category) } })
    await writeAudit({ userId: auth.session.user.id, userName: auth.session.user.name || "Administrator", action: "UPDATE", entity: "Event", entityId: id, detail: `Updated event "${current.title}" to "${event.title}" (${event.status})`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
    return NextResponse.json({ event })
  } catch (error) { console.error("Event update failed", error); return NextResponse.json({ error: "The event could not be updated. Please try again." }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(); if ("response" in auth) return auth.response
  const { id } = await params; const event = await db.event.findUnique({ where: { id }, select: { id: true, title: true, deletedAt: true } })
  if (!event || event.deletedAt) return NextResponse.json({ error: "Event not found." }, { status: 404 })
  await db.event.update({ where: { id }, data: { status: "ARCHIVED", deletedAt: new Date() } })
  await writeAudit({ userId: auth.session.user.id, userName: auth.session.user.name || "Administrator", action: "ARCHIVE", entity: "Event", entityId: id, detail: `Archived event "${event.title}"`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ success: true })
}
