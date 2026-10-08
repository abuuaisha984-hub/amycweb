import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { can, writeAudit } from "@/lib/rbac"
import { z } from "zod"
import { deletePublicUpload } from "@/lib/upload-storage"

const updateSchema = z.object({
  title: z.string().trim().min(2).max(240).optional(),
  description: z.string().trim().max(4000).optional(),
  category: z.string().trim().min(2).max(100).optional(),
  author: z.string().trim().max(160).nullable().optional(),
  department: z.string().trim().max(160).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
}).refine((value) => Object.keys(value).length > 0)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "document")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Check document details and try again." }, { status: 400 })
  const current = await db.document.findFirst({ where: { id, deletedAt: null } })
  if (!current) return NextResponse.json({ error: "Document not found." }, { status: 404 })
  const input = parsed.data
  const category = input.category || current.category
  if ((input.category || input.status === "PUBLISHED") && !await db.category.findFirst({ where: { type: "DOCUMENT", name: category, active: true }, select: { id: true } })) {
    return NextResponse.json({ error: "Choose an active document category before publishing." }, { status: 400 })
  }
  const status = input.status
  const doc = await db.document.update({ where: { id }, data: {
    ...input,
    ...(status === "PUBLISHED" && current.status !== "PUBLISHED" ? { publishedAt: new Date(), archiveDate: null } : {}),
  } })
  const action = status === "PUBLISHED" ? "PUBLISH" : status === "DRAFT" && current.status === "PUBLISHED" ? "UNPUBLISH" : "UPDATE"
  await writeAudit({ userId: session.user.id, userName: session.user.name || "Unknown", action, entity: "Document", entityId: id, detail: `Updated document "${doc.title}" (${doc.status})`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ document: doc })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "document")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const doc = await db.document.update({ where: { id }, data: { deletedAt: new Date(), status: "DRAFT" } })
  try {
    await deletePublicUpload(doc.filePath)
  } catch (error) {
    console.error("Document was archived but its stored file could not be removed:", error)
    return NextResponse.json({ error: "The document was removed from listings, but its stored file could not be deleted." }, { status: 502 })
  }
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: "DELETE", entity: "Document", entityId: id,
    detail: `Deleted document "${doc.title}"`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ ok: true })
}
