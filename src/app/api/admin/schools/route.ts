import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { can, writeAudit } from "@/lib/rbac"
import { getServerSession } from "next-auth"

const schoolSchema = z.object({
  name: z.string().trim().min(2).max(180),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortName: z.string().trim().max(100).nullable().optional(),
  type: z.enum(["MAAHAD", "PRIMARY", "SECONDARY", "COLLEGE", "UNIVERSITY"]),
  category: z.string().trim().max(100).nullable().optional(),
  level: z.string().trim().max(120).nullable().optional(),
  gender: z.string().trim().max(60).nullable().optional(),
  medium: z.string().trim().max(60).nullable().optional(),
  region: z.string().trim().max(120).nullable().optional(),
  jimboId: z.string().trim().min(1).max(64),
  district: z.string().trim().max(120).nullable().optional(),
  ward: z.string().trim().max(120).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  email: z.string().trim().email().nullable().optional().or(z.literal("")),
  phone: z.string().trim().max(80).nullable().optional(),
  about: z.string().trim().max(12000).default(""),
  history: z.string().trim().max(8000).nullable().optional(),
  facilities: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  levelsOffered: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  website: z.string().trim().url().max(500).nullable().optional().or(z.literal("")),
  logo: z.string().trim().max(1000).nullable().optional(),
  image: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  sortOrder: z.number().int().min(0).max(100000).default(0),
  translations: z.string().max(30000).default("{}"),
})

function cleanOptional(value: string | null | undefined) {
  return value?.trim() || null
}

async function authorize() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (!can(session.user.role, "school")) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { session }
}

export async function GET() {
  const auth = await authorize()
  if ("response" in auth) return auth.response
  const [schools, regions] = await Promise.all([
    db.school.findMany({ where: { deletedAt: null }, include: { jimbo: { select: { id: true, name: true, administrativeRegion: true } } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.region.findMany({ where: { deletedAt: null, status: { not: "ARCHIVED" } }, select: { id: true, name: true, administrativeRegion: true }, orderBy: { name: "asc" } }),
  ])
  return NextResponse.json({ schools, regions })
}

export async function POST(req: NextRequest) {
  const auth = await authorize()
  if ("response" in auth) return auth.response
  const parsed = schoolSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue?.path.join(".")
    return NextResponse.json({ error: field ? `${field}: ${issue.message}` : "Check the school details and try again.", fields: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const input = parsed.data
  const jimbo = await db.region.findFirst({ where: { id: input.jimboId, deletedAt: null, status: { not: "ARCHIVED" } }, select: { id: true } })
  if (!jimbo) return NextResponse.json({ error: "Choose a valid AMYC Jimbo for this school." }, { status: 400 })
  const exists = await db.school.findUnique({ where: { slug: input.slug }, select: { id: true } })
  if (exists) return NextResponse.json({ error: "That school URL is already in use. Choose another slug." }, { status: 409 })
  try {
    const school = await db.school.create({ data: {
      ...input,
      shortName: cleanOptional(input.shortName), category: cleanOptional(input.category), level: cleanOptional(input.level),
      gender: cleanOptional(input.gender), medium: cleanOptional(input.medium), region: cleanOptional(input.region),
      district: cleanOptional(input.district), ward: cleanOptional(input.ward), address: cleanOptional(input.address),
      email: cleanOptional(input.email), phone: cleanOptional(input.phone),
      history: cleanOptional(input.history), website: cleanOptional(input.website), logo: cleanOptional(input.logo),
      image: cleanOptional(input.image), facilities: JSON.stringify(input.facilities), levelsOffered: JSON.stringify(input.levelsOffered),
      deletedAt: null,
    } })
    await writeAudit({ userId: auth.session.user.id, userName: auth.session.user.name || "Administrator", action: "CREATE", entity: "School", entityId: school.id, detail: `Created school record "${school.name}" (${school.status})`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
    return NextResponse.json({ school }, { status: 201 })
  } catch (error) {
    console.error("School create failed", error)
    return NextResponse.json({ error: "The school could not be saved. Please check the details and try again." }, { status: 500 })
  }
}
