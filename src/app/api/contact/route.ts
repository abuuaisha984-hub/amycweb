import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { consumeRequestLimit, requestAddress } from "@/lib/request-rate-limit"

const contactSchema = z.object({
  name: z.string().trim().min(2).max(140),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(80).optional(),
  subject: z.string().trim().min(2).max(180),
  message: z.string().trim().min(10).max(10_000),
})

export async function POST(req: NextRequest) {
  const address = requestAddress(req.headers)
  const limit = consumeRequestLimit(`contact:${address}`, 5, 10 * 60 * 1000)
  if (!limit.allowed) return NextResponse.json({ ok: false, message: "Too many submissions. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } })

  const data = await req.formData().catch(() => null)
  if (!data) return NextResponse.json({ ok: false, message: "Invalid contact form." }, { status: 400 })
  const value = (key: string) => {
    const entry = data.get(key)
    return typeof entry === "string" ? entry : undefined
  }
  const parsed = contactSchema.safeParse({ name: value("name"), email: value("email"), phone: value("phone"), subject: value("subject"), message: value("message") })
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Check the contact details and try again." }, { status: 400 })
  const { name, email, subject, message } = parsed.data
  const phone = parsed.data.phone?.trim() || null

  try {
    await db.contactMessage.create({
      // Do not persist visitors' IP addresses with contact messages.
      data: { name, email, phone, subject, message, status: "NEW" },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, message: "Could not save message." }, { status: 500 })
  }
}
