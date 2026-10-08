import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { can, writeAudit } from "@/lib/rbac"
import { getServerSession } from "next-auth"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().trim().min(2).max(180), slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortName: z.string().trim().max(100).nullable().optional(), type: z.enum(["MAAHAD", "PRIMARY", "SECONDARY", "COLLEGE", "UNIVERSITY"]),
  category: z.string().trim().max(100).nullable().optional(), level: z.string().trim().max(120).nullable().optional(),
  gender: z.string().trim().max(60).nullable().optional(), medium: z.string().trim().max(60).nullable().optional(),
  region: z.string().trim().max(120).nullable().optional(), jimboId: z.string().trim().min(1).max(64), district: z.string().trim().max(120).nullable().optional(),
  ward: z.string().trim().max(120).nullable().optional(), address: z.string().trim().max(500).nullable().optional(),
  email: z.string().trim().email().nullable().optional().or(z.literal("")), phone: z.string().trim().max(80).nullable().optional(),
  about: z.string().trim().max(12000), history: z.string().trim().max(8000).nullable().optional(),
  facilities: z.array(z.string().trim().min(1).max(100)).max(50), levelsOffered: z.array(z.string().trim().min(1).max(100)).max(30),
  website: z.string().trim().url().max(500).nullable().optional().or(z.literal("")), logo: z.string().trim().max(1000).nullable().optional(),
  image: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  sortOrder: z.number().int().min(0).max(100000), translations: z.string().max(30000),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "school")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue?.path.join(".")
    return NextResponse.json({ error: field ? `${field}: ${issue.message}` : "Check the school details and try again.", fields: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const current = await db.school.findUnique({ where: { id }, select: { id: true, name: true, slug: true, deletedAt: true } })
  if (!current || current.deletedAt) return NextResponse.json({ error: "School not found." }, { status: 404 })
  if (parsed.data.slug !== current.slug) return NextResponse.json({ error: "School URLs cannot be changed until redirect support is configured; the current URL is preserved." }, { status: 409 })
  const duplicate = await db.school.findFirst({ where: { slug: parsed.data.slug, id: { not: id } }, select: { id: true } })
  if (duplicate) return NextResponse.json({ error: "That school URL is already in use." }, { status: 409 })
  const input = parsed.data
  const jimbo = await db.region.findFirst({ where: { id: input.jimboId, deletedAt: null, status: { not: "ARCHIVED" } }, select: { id: true } })
  if (!jimbo) return NextResponse.json({ error: "Choose a valid AMYC Jimbo for this school." }, { status: 400 })
  try {
    const school = await db.school.update({ where: { id }, data: {
      ...input, shortName: input.shortName?.trim() || null, category: input.category?.trim() || null, level: input.level?.trim() || null,
      gender: input.gender?.trim() || null, medium: input.medium?.trim() || null, region: input.region?.trim() || null,
      district: input.district?.trim() || null, ward: input.ward?.trim() || null, address: input.address?.trim() || null,
      email: input.email?.trim() || null, phone: input.phone?.trim() || null,
      history: input.history?.trim() || null, website: input.website?.trim() || null, logo: input.logo?.trim() || null,
      image: input.image?.trim() || null, facilities: JSON.stringify(input.facilities), levelsOffered: JSON.stringify(input.levelsOffered),
    } })
    await writeAudit({ userId: session.user.id, userName: session.user.name || "Administrator", action: "UPDATE", entity: "School", entityId: id, detail: `Updated school "${current.name}" to "${school.name}" (${school.status})`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
    return NextResponse.json({ school })
  } catch (error) {
    console.error("School update failed", error)
    return NextResponse.json({ error: "The school could not be updated. Please try again." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "school")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const school = await db.school.findUnique({ where: { id }, select: { id: true, name: true, deletedAt: true } })
  if (!school || school.deletedAt) return NextResponse.json({ error: "School not found." }, { status: 404 })
  await db.school.update({ where: { id }, data: { status: "ARCHIVED" } })
  await writeAudit({ userId: session.user.id, userName: session.user.name || "Administrator", action: "ARCHIVE", entity: "School", entityId: id, detail: `Archived school "${school.name}"`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ success: true })
}
