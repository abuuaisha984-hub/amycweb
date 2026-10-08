import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeAudit } from "@/lib/rbac"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const parsed = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid account status." }, { status: 400 })
  const target = await db.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true } })
  if (!target || target.role !== "ADMIN") return NextResponse.json({ error: "Institution administrator account not found." }, { status: 404 })
  const user = await db.user.update({ where: { id }, data: { status: parsed.data.status }, select: { id: true, name: true, email: true, status: true } })
  await writeAudit({ userId: session.user.id, userName: session.user.name || "Super Admin", action: "PERMISSION_CHANGE", entity: "User", entityId: id, detail: `Set institution administrator ${target.email} to ${user.status}`, ip: request.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ user })
}
