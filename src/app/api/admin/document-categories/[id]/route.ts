import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { can, writeAudit } from "@/lib/rbac"

const inputSchema = z.object({ name: z.string().trim().min(2).max(100) })

async function checkAccess() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (!can(session.user.role, "document")) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { session }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await checkAccess()
  if ("response" in access) return access.response
  const { id } = await params
  const parsed = inputSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Enter a category name (2–100 characters)." }, { status: 400 })
  const category = await db.category.findFirst({ where: { id, type: "DOCUMENT" } })
  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 })
  const nameExists = await db.category.findFirst({ where: { id: { not: id }, type: "DOCUMENT", name: parsed.data.name } })
  if (nameExists) return NextResponse.json({ error: "A document category with that name already exists." }, { status: 409 })
  await db.$transaction([
    db.document.updateMany({ where: { category: category.name }, data: { category: parsed.data.name } }),
    db.category.update({ where: { id }, data: { name: parsed.data.name } }),
  ])
  await writeAudit({ userId: access.session.user.id, userName: access.session.user.name || "Administrator", action: "UPDATE", entity: "Category", entityId: id, detail: `Renamed document category "${category.name}" to "${parsed.data.name}"`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await checkAccess()
  if ("response" in access) return access.response
  const { id } = await params
  const category = await db.category.findFirst({ where: { id, type: "DOCUMENT" } })
  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 })
  await db.category.update({ where: { id }, data: { active: !category.active } })
  await writeAudit({ userId: access.session.user.id, userName: access.session.user.name || "Administrator", action: category.active ? "ARCHIVE" : "RESTORE", entity: "Category", entityId: id, detail: `${category.active ? "Archived" : "Restored"} document category "${category.name}"`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ active: !category.active })
}
