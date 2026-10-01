import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const data = await req.formData().catch(() => null)
  const email = data?.get("email") as string
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, message: "Invalid email" }, { status: 400 })
  }
  return NextResponse.json({ ok: true, message: "Subscribed" })
}
