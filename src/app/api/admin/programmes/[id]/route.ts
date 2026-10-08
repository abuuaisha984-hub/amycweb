import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { can, writeAudit } from "@/lib/rbac"

const imageSchema = z.object({
  image: z.string().trim().regex(/^\/uploads\/images\/programmes\/[a-f0-9]{24}\.(webp|jpg)$/).nullable(),
})

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "programme")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await context.params
  const parsed = imageSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid programme image." }, { status: 400 })

  const current = await db.programme.findUnique({ where: { id }, select: { id: true, name: true } })
  if (!current) return NextResponse.json({ error: "Programme not found." }, { status: 404 })

  try {
    const programme = await db.programme.update({ where: { id }, data: { image: parsed.data.image || null }, select: { id: true, slug: true, name: true, image: true, status: true } })
    await writeAudit({
      userId: session.user.id,
      userName: session.user.name || "Administrator",
      action: "UPDATE",
      entity: "Programme",
      entityId: id,
      detail: `Updated image for programme "${current.name}"`,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0],
    })
    return NextResponse.json({ programme })
  } catch (error) {
    console.error("Programme image update failed", error)
    return NextResponse.json({ error: "The programme image could not be saved." }, { status: 500 })
  }
}
