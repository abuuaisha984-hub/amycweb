import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/password"
import { writeAudit } from "@/lib/rbac"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = z.object({ currentPassword: z.string().min(1).max(1024), newPassword: z.string().min(14).max(128) }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "New password must be at least 14 characters." }, { status: 400 })
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, name: true, passwordHash: true } })
  if (!user || !verifyPassword(parsed.data.currentPassword, user.passwordHash)) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 })
  if (verifyPassword(parsed.data.newPassword, user.passwordHash)) return NextResponse.json({ error: "Choose a password different from your current one." }, { status: 400 })
  await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(parsed.data.newPassword), mustChangePassword: false, authVersion: { increment: 1 } } })
  await writeAudit({ userId: user.id, userName: user.name, action: "UPDATE", entity: "User", entityId: user.id, detail: "Changed account password", ip: request.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ success: true })
}
