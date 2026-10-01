import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Simple in-memory rate limiting
const attempts = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 5 // per 10 minutes
const WINDOW = 10 * 60 * 1000

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
  const now = Date.now()
  const rec = attempts.get(ip)
  if (rec && rec.reset > now) {
    if (rec.count >= RATE_LIMIT) {
      return NextResponse.json({ ok: false, message: "Too many submissions. Please try again later." }, { status: 429 })
    }
    rec.count++
  } else {
    attempts.set(ip, { count: 1, reset: now + WINDOW })
  }

  const data = await req.formData().catch(() => null)
  const name = (data?.get("name") as string)?.trim()
  const email = (data?.get("email") as string)?.trim()
  const phone = (data?.get("phone") as string)?.trim() || null
  const subject = (data?.get("subject") as string)?.trim()
  const message = (data?.get("message") as string)?.trim()

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ ok: false, message: "All required fields must be filled." }, { status: 400 })
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, message: "Invalid email address." }, { status: 400 })
  }
  if (message.length < 10) {
    return NextResponse.json({ ok: false, message: "Message is too short." }, { status: 400 })
  }

  try {
    await db.contactMessage.create({
      data: { name, email, phone, subject, message, ipAddress: ip, status: "NEW" },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, message: "Could not save message." }, { status: 500 })
  }
}
