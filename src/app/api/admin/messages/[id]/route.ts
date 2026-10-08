import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { can, writeAudit } from "@/lib/rbac"
import { z } from "zod"

const statusSchema = z.object({ status: z.enum(["NEW", "READ", "REPLIED", "CLOSED"]) }).strict()

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "contact")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid message status" }, { status: 400 })
  const msg = await db.contactMessage.update({ where: { id }, data: { status: parsed.data.status } })
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: "UPDATE", entity: "ContactMessage", entityId: id,
    detail: `Marked message "${msg.subject}" as ${parsed.data.status}`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ ok: true })
}
