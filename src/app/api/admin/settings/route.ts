import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeAudit } from "@/lib/rbac"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden — Super Admin only" }, { status: 403 })
  const body = await req.json()
  for (const [key, value] of Object.entries(body)) {
    const existing = await db.siteSetting.findUnique({ where: { key } })
    if (existing) {
      await db.siteSetting.update({ where: { key }, data: { value: JSON.stringify(value) } })
    } else {
      await db.siteSetting.create({ data: { key, value: JSON.stringify(value) } })
    }
  }
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: "UPDATE", entity: "SiteSetting",
    detail: `Updated site settings: ${Object.keys(body).join(", ")}`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ ok: true })
}
