import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { can, writeAudit } from "@/lib/rbac"

const eventSchema = z.object({
  title: z.string().trim().min(2).max(220),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(12000).default(""),
  image: z.string().trim().max(1000).nullable().optional(),
  startDate: z.coerce.date(), endDate: z.coerce.date().nullable().optional(),
  startTime: z.string().trim().max(40).nullable().optional(), endTime: z.string().trim().max(40).nullable().optional(),
  venue: z.string().trim().max(220).nullable().optional(), location: z.string().trim().max(220).nullable().optional(),
  organizer: z.string().trim().max(180).nullable().optional(), registrationLink: z.string().trim().url().max(500).nullable().optional().or(z.literal("")),
  contact: z.string().trim().max(300).nullable().optional(), category: z.string().trim().max(100).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "CANCELLED"]).default("DRAFT"), translations: z.string().max(30000).default("{}"),
})

const optional = (value: string | null | undefined) => value?.trim() || null

async function authorize() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (!can(session.user.role, "event")) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { session }
}

export async function GET() {
  const auth = await authorize()
  if ("response" in auth) return auth.response
  const events = await db.event.findMany({ where: { deletedAt: null }, orderBy: [{ startDate: "desc" }, { createdAt: "desc" }] })
  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const auth = await authorize()
  if ("response" in auth) return auth.response
  const parsed = eventSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the event details and try again.", fields: parsed.error.flatten().fieldErrors }, { status: 400 })
  const input = parsed.data
  if (await db.event.findUnique({ where: { slug: input.slug }, select: { id: true } })) return NextResponse.json({ error: "That event URL is already in use." }, { status: 409 })
  try {
    const event = await db.event.create({ data: { ...input, image: optional(input.image), startTime: optional(input.startTime), endTime: optional(input.endTime), venue: optional(input.venue), location: optional(input.location), organizer: optional(input.organizer), registrationLink: optional(input.registrationLink), contact: optional(input.contact), category: optional(input.category) } })
    await writeAudit({ userId: auth.session.user.id, userName: auth.session.user.name || "Administrator", action: "CREATE", entity: "Event", entityId: event.id, detail: `Created event "${event.title}" (${event.status})`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error("Event create failed", error)
    return NextResponse.json({ error: "The event could not be saved. Please try again." }, { status: 500 })
  }
}
