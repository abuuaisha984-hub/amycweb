import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeAudit } from "@/lib/rbac"
import { z } from "zod"

const statsSchema = z.record(
  z.string().trim().min(1).max(60).regex(/^[a-zA-Z0-9_-]+$/),
  z.object({
    label: z.string().trim().max(100),
    value: z.string().trim().max(80),
    note: z.string().trim().max(240).optional(),
  }).strict(),
).refine((stats) => Object.keys(stats).length <= 25)

const settingsSchema = z.object({
  orgName: z.string().trim().min(1).max(160),
  orgShortName: z.string().trim().max(80),
  tagline: z.string().trim().max(2000),
  mission: z.string().trim().max(5000),
  vision: z.string().trim().max(5000),
  foundedYear: z.string().trim().max(20),
  headquarters: z.string().trim().max(180),
  email: z.union([z.string().trim().email().max(254), z.literal("")]),
  phone: z.string().trim().max(100),
  address: z.string().trim().max(500),
  officeHours: z.string().trim().max(240),
  radioStation: z.string().trim().max(160),
  stats: statsSchema,
}).strict()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 })
  const parsed = settingsSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Check the institution details and statistics." }, { status: 400 })
  const body = parsed.data
  try {
    await db.$transaction(Object.entries(body).map(([key, value]) => db.siteSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    })))
  } catch (error) {
    console.error("Site settings update failed", error)
    return NextResponse.json({ error: "Settings could not be saved. Please try again." }, { status: 500 })
  }
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: "UPDATE", entity: "SiteSetting",
    detail: `Updated site settings: ${Object.keys(body).join(", ")}`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ ok: true })
}
