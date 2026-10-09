import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { isAdminRole } from "@/lib/permissions"

const bodySchema = z.object({ token: z.string().min(32).max(128), password: z.string().min(14).max(128), confirmPassword: z.string().min(14).max(128) })
const genericHeaders = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success || parsed.data.password !== parsed.data.confirmPassword) {
    return NextResponse.json({ error: "The reset link or password is invalid." }, { status: 400, headers: genericHeaders })
  }
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex")
  const now = new Date()
  try {
    const result = await db.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true, expiresAt: true, consumedAt: true } })
      if (!token || token.consumedAt || token.expiresAt <= now) return false
      const consumed = await tx.passwordResetToken.updateMany({ where: { id: token.id, tokenHash, consumedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } })
      if (consumed.count !== 1) return false
      const activeAdmin = await tx.user.findFirst({ where: { id: token.userId, status: "ACTIVE" }, select: { id: true, role: true } })
      if (!activeAdmin || !isAdminRole(activeAdmin.role)) return false
      await tx.user.update({ where: { id: activeAdmin.id }, data: { passwordHash: hashPassword(parsed.data.password), mustChangePassword: false, authVersion: { increment: 1 } } })
      return true
    }, { isolationLevel: "Serializable" })
    if (!result) return NextResponse.json({ error: "The reset link is invalid, expired, or already used." }, { status: 400, headers: genericHeaders })
    return NextResponse.json({ success: true }, { headers: genericHeaders })
  } catch {
    return NextResponse.json({ error: "The password could not be reset. Request a new link and try again." }, { status: 500, headers: genericHeaders })
  }
}
