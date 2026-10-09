import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { can, canRead, writeAudit } from "@/lib/rbac"

const schema = z.object({
  name: z.string().trim().min(2), slug: z.string().trim().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  englishName: z.string().trim().nullable().optional(), administrativeRegion: z.string().trim().nullable().optional(),
  district: z.string().trim().nullable().optional(),
  overview: z.string().trim().default(""), history: z.string().trim().nullable().optional(),
  leadership: z.array(z.object({ position: z.string().trim().min(1), name: z.string().trim().min(1) })).default([]),
  activities: z.array(z.string().trim().min(1)).default([]),
  branches: z.array(z.object({ name: z.string().trim().min(1), note: z.string().trim().optional() })).default([]),
  contact: z.string().trim().nullable().optional(), email: z.string().trim().email().nullable().optional().or(z.literal("")),
  phone: z.string().trim().nullable().optional(), website: z.string().trim().url().nullable().optional().or(z.literal("")),
  image: z.string().trim().nullable().optional(), sortOrder: z.number().int().min(0).default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"), translations: z.string().default("{}"),
})
const optional = (value: string | null | undefined) => value?.trim() || null

function validationError(error: z.ZodError) {
  const issue = error.issues[0]
  const field = String(issue?.path[0] || "region details")
  return `${field}: ${issue?.message || "invalid value"}`
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canRead(session.user.role, "region")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const where = { deletedAt: null, ...(session.user.role === "REGIONAL_EDITOR" ? { id: session.user.scopeRegionId || "" } : {}) }
  const regions = await db.region.findMany({ where, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  return NextResponse.json({ regions })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "region") || session.user.role === "REGIONAL_EDITOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: validationError(parsed.error), fields: parsed.error.flatten().fieldErrors }, { status: 400 })
  const input = parsed.data
  if (await db.region.findUnique({ where: { slug: input.slug }, select: { id: true } })) return NextResponse.json({ error: "That region URL is already in use." }, { status: 409 })
  try {
    const region = await db.region.create({ data: {
      ...input, englishName: optional(input.englishName), administrativeRegion: optional(input.administrativeRegion), district: optional(input.district),
      history: optional(input.history), contact: optional(input.contact),
      email: optional(input.email), phone: optional(input.phone), website: optional(input.website), image: optional(input.image),
      leadership: JSON.stringify(input.leadership), activities: JSON.stringify(input.activities), branches: JSON.stringify(input.branches), deletedAt: null,
    } })
    await writeAudit({ userId: session.user.id, userName: session.user.name || "Administrator", action: "CREATE", entity: "Region", entityId: region.id, detail: `Created region "${region.name}" (${region.status})`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
    return NextResponse.json({ region }, { status: 201 })
  } catch (error) {
    console.error("Region create failed", error)
    return NextResponse.json({ error: "The region could not be saved. Please check the details and try again." }, { status: 500 })
  }
}
