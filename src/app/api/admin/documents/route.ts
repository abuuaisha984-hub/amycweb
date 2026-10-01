import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { can, writeAudit } from "@/lib/rbac"
import { randomBytes } from "crypto"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

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

  const form = await req.formData()
  const file = form.get("file") as File | null
  const title = (form.get("title") as string)?.trim()
  const description = (form.get("description") as string)?.trim() || ""
  const category = (form.get("category") as string)?.trim() || "Publication"
  const author = (form.get("author") as string)?.trim() || session.user.name || "AMYC"
  const department = (form.get("department") as string)?.trim() || "Headquarters"

  if (!file || !title) return NextResponse.json({ error: "File and title are required" }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 })

  const mime = file.type || "application/octet-stream"
  const ext = ALLOWED_MIME[mime]
  if (!ext) return NextResponse.json({ error: `File type not allowed: ${mime}` }, { status: 400 })

  // Generate secure filename (never use original)
  const safeName = `${randomBytes(8).toString("hex")}.${ext}`
  const uploadDir = path.join(process.cwd(), "public", "uploads", "docs")
  await mkdir(uploadDir, { recursive: true })
  const fullPath = path.join(uploadDir, safeName)
  // Guard against path traversal (safeName has no slashes)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(fullPath, buffer)

  const slug = `${slugify(title)}-${randomBytes(3).toString("hex")}`
  const doc = await db.document.create({
    data: {
      slug, title, description, category,
      fileType: ext, fileName: safeName, filePath: `/uploads/docs/${safeName}`,
      fileSize: file.size, mimeType: mime, author, department,
      status: "PUBLISHED", publishedAt: new Date(),
    },
  })
  await writeAudit({
    userId: session.user.id, userName: session.user.name || "Unknown",
    action: "UPLOAD", entity: "Document", entityId: doc.id,
    detail: `Uploaded document "${title}" (${ext}, ${(file.size / 1024).toFixed(0)} KB)`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  })
  return NextResponse.json({ document: doc })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const documents = await db.document.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } })
  return NextResponse.json({ documents })
}
