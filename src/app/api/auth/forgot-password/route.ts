import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { isAdminRole } from "@/lib/permissions"
import { allowRecoveryRequest, createResetToken, recoveryResponseMessage, sendPasswordResetEmail } from "@/lib/password-recovery"

const emailSchema = z.object({ email: z.string().trim().email().max(254) })
const genericHeaders = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = emailSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400, headers: genericHeaders })

  const email = parsed.data.email.toLowerCase()
  const ip = request.headers.get("x-nf-client-connection-ip")
  try {
    if (!(await allowRecoveryRequest(email, ip))) {
      return NextResponse.json({ message: recoveryResponseMessage }, { status: 202, headers: genericHeaders })
    }
    const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true, role: true, status: true } })
    if (user && user.status === "ACTIVE" && isAdminRole(user.role)) {
      const { token, tokenHash } = createResetToken()
      const now = new Date()
      const reset = await db.$transaction(async (tx) => {
        await tx.passwordResetToken.updateMany({ where: { userId: user.id, consumedAt: null }, data: { consumedAt: now } })
        return tx.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(now.getTime() + 30 * 60 * 1000) } })
      })
      try {
        await sendPasswordResetEmail(user.email, token)
      } catch {
        await db.passwordResetToken.updateMany({ where: { id: reset.id, consumedAt: null }, data: { consumedAt: new Date() } })
      }
    }
  } catch {
    // Keep responses identical for existing and unknown accounts; do not log PII or reset data.
  }
  return NextResponse.json({ message: recoveryResponseMessage }, { status: 202, headers: genericHeaders })
}
