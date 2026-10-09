import { createHash, createHmac, randomBytes } from "node:crypto"
import { db } from "@/lib/db"

const WINDOW_MS = 60 * 60 * 1000
const EMAIL_LIMIT = 3
const IP_LIMIT = 10

export function createResetToken() {
  const token = randomBytes(32).toString("base64url")
  return { token, tokenHash: createHash("sha256").update(token).digest("hex") }
}

function rateKey(value: string) {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("Password recovery requires NEXTAUTH_SECRET.")
  return createHmac("sha256", secret).update(value).digest("hex")
}

async function incrementLimit(keyHash: string, limit: number, now: Date) {
  const cutoff = new Date(now.getTime() - WINDOW_MS)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.$transaction(async (tx) => {
        const current = await tx.passwordRecoveryRateLimit.upsert({
          where: { keyHash },
          create: { keyHash, windowStart: now, count: 1 },
          update: { count: { increment: 1 } },
        })
        const updated = current.windowStart <= cutoff
          ? await tx.passwordRecoveryRateLimit.update({ where: { keyHash }, data: { windowStart: now, count: 1 } })
          : current
        return updated.count <= limit
      }, { isolationLevel: "Serializable" })
    } catch (error) {
      if ((error as { code?: string }).code !== "P2034" || attempt === 2) throw error
    }
  }
  return false
}

export async function allowRecoveryRequest(email: string, ip: string | null) {
  const now = new Date()
  await db.passwordRecoveryRateLimit.deleteMany({ where: { updatedAt: { lt: new Date(now.getTime() - 24 * WINDOW_MS) } } })
  const checks = [incrementLimit(rateKey(`email:${email}`), EMAIL_LIMIT, now)]
  if (ip) checks.push(incrementLimit(rateKey(`ip:${ip}`), IP_LIMIT, now))
  const results = await Promise.all(checks)
  return results.every(Boolean)
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  const configuredOrigin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (!apiKey || !from || !configuredOrigin) throw new Error("Password recovery email is not configured.")
  const origin = new URL(configuredOrigin)
  if (origin.protocol !== "https:" && origin.hostname !== "localhost") throw new Error("Password recovery origin must use HTTPS.")
  const resetUrl = new URL("/admin/reset-password", origin)
  resetUrl.hash = new URLSearchParams({ token }).toString()
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your AMYC admin password",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><h1>AMYC password reset</h1><p>We received a request to reset the password for your AMYC administrator account.</p><p><a href="${resetUrl.toString()}" style="display:inline-block;padding:12px 20px;background:#123b63;color:#fff;text-decoration:none;border-radius:6px">Reset password</a></p><p>This link expires in 30 minutes and can be used once.</p><p>If you did not request this reset, you can ignore this email.</p></div>`,
      text: `Reset your AMYC administrator password: ${resetUrl.toString()}\nThis link expires in 30 minutes and can be used once. If you did not request it, ignore this email.`,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}.`)
}

export const recoveryResponseMessage = "If an eligible account exists, a reset email may be sent. If one does not arrive, contact the system administrator."
