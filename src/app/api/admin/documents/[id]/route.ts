import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { can, writeAudit } from "@/lib/rbac"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "document")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const doc = await db.document.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } })
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: "DELETE", entity: "Document", entityId: id,
    detail: `Archived document "${doc.title}"`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ ok: true })
}
