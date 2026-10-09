import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { can, canRead, writeAudit } from "@/lib/rbac"
import { randomBytes } from "crypto"
import { matchesFileSignature } from "@/lib/file-signature"
import { storePublicUpload, deletePublicUpload } from "@/lib/upload-storage"

const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/zip": "zip",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
}
const MAX_SIZE = 25 * 1024 * 1024 // 25 MB

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!can(session.user.role, "document")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let form: FormData
  try { form = await req.formData() } catch { return NextResponse.json({ error: "Invalid upload form" }, { status: 400 }) }
  const entry = form.get("file")
  const file = entry instanceof File ? entry : null
  const title = typeof form.get("title") === "string" ? (form.get("title") as string).trim() : ""
  const description = (typeof form.get("description") === "string" ? form.get("description") as string : "").trim()
  const category = (typeof form.get("category") === "string" ? form.get("category") as string : "Publication").trim()
  const author = (typeof form.get("author") === "string" ? form.get("author") as string : session.user.name || "AMYC").trim()
  const department = (typeof form.get("department") === "string" ? form.get("department") as string : "Headquarters").trim()
  const statusValue = typeof form.get("status") === "string" ? form.get("status") as string : "DRAFT"
  const status = statusValue === "PUBLISHED" ? "PUBLISHED" : "DRAFT"

  if (!file || !title) return NextResponse.json({ error: "File and title are required" }, { status: 400 })
  if (!(await db.category.findFirst({ where: { type: "DOCUMENT", name: category, active: true }, select: { id: true } }))) {
    return NextResponse.json({ error: "Select an active document category." }, { status: 400 })
  }
  if (title.length > 240 || description.length > 4000 || category.length > 100 || author.length > 160 || department.length > 160) {
    return NextResponse.json({ error: "Document metadata exceeds the allowed length" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 })

  const mime = file.type || "application/octet-stream"
  const ext = ALLOWED_MIME[mime]
  if (!ext) return NextResponse.json({ error: `File type not allowed: ${mime}` }, { status: 400 })

  // Generate secure filename (never use original)
  const safeName = `${randomBytes(8).toString("hex")}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  if (!matchesFileSignature(ext, buffer)) return NextResponse.json({ error: "File content does not match the selected file type" }, { status: 400 })
  const filePath = `/uploads/docs/${safeName}`
  try {
    await storePublicUpload(filePath, buffer, mime)
  } catch (error) {
    console.error("Document storage failed:", error)
    return NextResponse.json({ error: "The document could not be saved to object storage." }, { status: 500 })
  }

  const slug = `${slugify(title)}-${randomBytes(3).toString("hex")}`
  let doc
  try {
    doc = await db.document.create({
      data: {
        slug, title, description, category,
        fileType: ext, fileName: safeName, filePath,
        fileSize: file.size, mimeType: mime, author, department,
        status, publishedAt: status === "PUBLISHED" ? new Date() : new Date(0),
      },
    })
  } catch {
    await deletePublicUpload(filePath).catch((error) => console.error("Orphaned document upload could not be removed:", error))
    return NextResponse.json({ error: "Could not save document metadata" }, { status: 500 })
  }
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: status === "PUBLISHED" ? "PUBLISH" : "UPLOAD", entity: "Document", entityId: doc.id,
    detail: `${status === "PUBLISHED" ? "Uploaded and published" : "Uploaded draft"} document "${title}" (${ext}, ${(file.size / 1024).toFixed(0)} KB)`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ document: doc })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canRead(session.user.role, "document")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const requestedPage = Math.max(1, Math.min(100_000, Number.parseInt(req.nextUrl.searchParams.get("page") || "1", 10) || 1))
  const pageSize = 25
  const where = { deletedAt: null }
  const total = await db.document.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const documents = await db.document.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize })
  return NextResponse.json({ documents, pagination: { page, pageSize, total, totalPages } })
}
