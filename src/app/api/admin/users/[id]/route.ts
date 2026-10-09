import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { writeAudit } from "@/lib/rbac"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const body = await request.json().catch(() => null)
  const statusAction = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) }).safeParse(body)
  const temporaryPasswordAction = z.object({ action: z.literal("temporary-password") }).safeParse(body)
  const transferAction = z.object({
    action: z.literal("transfer"),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    confirmation: z.literal("TRANSFER ADMIN ACCOUNT"),
  }).safeParse(body)

  if (temporaryPasswordAction.success) {
    const target = await db.user.findUnique({ where: { id }, select: { id: true, role: true } })
    if (!target || target.role !== "ADMIN") return NextResponse.json({ error: "Institution administrator account not found." }, { status: 404 })

    const temporaryPassword = randomBytes(24).toString("base64url")
    const passwordHash = hashPassword(temporaryPassword)
    try {
      await db.$transaction(async (tx) => {
        await tx.user.update({ where: { id }, data: { passwordHash, mustChangePassword: true, authVersion: { increment: 1 } } })
        await tx.passwordResetToken.updateMany({ where: { userId: id, consumedAt: null }, data: { consumedAt: new Date() } })
        await tx.auditLog.create({ data: { userId: session.user.id, userName: session.user.name || "Super Admin", action: "UPDATE", entity: "User", entityId: id, detail: "Issued a temporary password and required a first-login password change." } })
      })
    } catch {
      return NextResponse.json({ error: "Could not set a temporary password. No account changes were saved." }, { status: 500 })
    }
    return NextResponse.json({ temporaryPassword })
  }

  if (transferAction.success) {
    const email = transferAction.data.email.toLowerCase()
    const target = await db.user.findUnique({ where: { id }, select: { id: true, role: true } })
    if (!target || target.role !== "ADMIN") return NextResponse.json({ error: "Institution administrator account not found." }, { status: 404 })
    const conflict = await db.user.findFirst({ where: { email, NOT: { id } }, select: { id: true } })
    if (conflict) return NextResponse.json({ error: "An account already uses that email address." }, { status: 409 })

    const temporaryPassword = randomBytes(24).toString("base64url")
    const passwordHash = hashPassword(temporaryPassword)
    try {
      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id },
          data: { name: transferAction.data.name, email, passwordHash, mustChangePassword: true, authVersion: { increment: 1 } },
        })
        await tx.passwordResetToken.updateMany({ where: { userId: id, consumedAt: null }, data: { consumedAt: new Date() } })
        await tx.auditLog.create({ data: { userId: session.user.id, userName: session.user.name || "Super Admin", action: "UPDATE", entity: "User", entityId: id, detail: "Transferred an administrator account identity; historical records were retained." } })
      })
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        return NextResponse.json({ error: "An account already uses that email address." }, { status: 409 })
      }
      return NextResponse.json({ error: "Could not transfer this account. No account changes were saved." }, { status: 500 })
    }
    return NextResponse.json({ temporaryPassword })
  }

  if (!statusAction.success) return NextResponse.json({ error: "Choose a valid account action." }, { status: 400 })
  const target = await db.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true } })
  if (!target || target.role !== "ADMIN") return NextResponse.json({ error: "Institution administrator account not found." }, { status: 404 })
  const user = await db.user.update({ where: { id }, data: { status: statusAction.data.status, authVersion: { increment: 1 } }, select: { id: true, name: true, email: true, status: true } })
  await writeAudit({ userId: session.user.id, userName: session.user.name || "Super Admin", action: "PERMISSION_CHANGE", entity: "User", entityId: id, detail: `Set institution administrator ${target.email} to ${user.status}`, ip: request.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ user })
}
