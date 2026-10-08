import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { can, writeAudit } from "@/lib/rbac"
import { matchesFileSignature } from "@/lib/file-signature"
import { randomBytes } from "crypto"
import sharp from "sharp"
import { storePublicUpload } from "@/lib/upload-storage"

const IMAGE_TYPES: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}
// This is the source-file limit. The stored image is always reduced to a
// WebP suitable for the public site, so ordinary high-resolution phone photos
// do not need to be resized manually before uploading.
const MAX_IMAGE_SIZE = 20 * 1024 * 1024
const MAX_INPUT_PIXELS = 200_000_000
const IMAGE_DESTINATIONS = {
  region: { permission: "region", folder: "regions", label: "Region image" },
  leader: { permission: "leader", folder: "leaders", label: "Leader image" },
  school: { permission: "school", folder: "schools", label: "School image" },
  event: { permission: "event", folder: "events", label: "Event image" },
  media: { permission: "media", folder: "media", label: "Media image" },
  article: { permission: "article", folder: "news", label: "Article image" },
  programme: { permission: "programme", folder: "programmes", label: "Programme image" },
} as const

function detectImageType(file: File, bytes: Buffer): "jpg" | "png" | "webp" | null {
  const candidates = [IMAGE_TYPES[file.type.toLowerCase()],
    /\.jpe?g$/i.test(file.name) ? "jpg" : undefined,
    /\.png$/i.test(file.name) ? "png" : undefined,
    /\.webp$/i.test(file.name) ? "webp" : undefined,
  ]
  return candidates.find((candidate): candidate is "jpg" | "png" | "webp" => !!candidate && matchesFileSignature(candidate, bytes)) || null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: "Invalid image upload." }, { status: 400 })
  const entity = form.get("entity")
  if (typeof entity !== "string" || !(entity in IMAGE_DESTINATIONS)) return NextResponse.json({ error: "Unsupported image destination." }, { status: 400 })
  const destination = IMAGE_DESTINATIONS[entity as keyof typeof IMAGE_DESTINATIONS]
  if (!can(session.user.role, destination.permission)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const entry = form.get("file")
  const file = entry instanceof File ? entry : null
  if (!file) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 })
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: "The original image must be no larger than 20 MB." }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const extension = detectImageType(file, buffer)
  if (!extension) return NextResponse.json({ error: "The file content is not a valid JPG, PNG, or WebP image." }, { status: 400 })

  let optimized: Buffer
  let outputExtension: "webp" | "jpg" = "webp"
  let outputMimeType = "image/webp"
  try {
    const image = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "none" })
    const metadata = await image.metadata()
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_INPUT_PIXELS) {
      return NextResponse.json({ error: "This image has unsupported dimensions. Choose an image smaller than 200 megapixels." }, { status: 400 })
    }

    optimized = await image
      .rotate()
      .pipelineColourspace("srgb")
      .toColourspace("srgb")
      .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer()
  } catch (webpError) {
    // A few valid camera files fail WebP encoding even though Sharp can decode
    // them. Preserve automatic optimisation by falling back to a compressed JPEG.
    try {
      optimized = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "none" })
        .rotate()
        .pipelineColourspace("srgb")
        .toColourspace("srgb")
        .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer()
      outputExtension = "jpg"
      outputMimeType = "image/jpeg"
      console.warn(`WebP conversion failed; saved an optimized JPEG instead: ${webpError instanceof Error ? webpError.message : String(webpError)}`)
    } catch (error) {
      console.error(`Image optimisation failed (entity=${entity}, type=${file.type}, size=${file.size}); WebP error: ${webpError instanceof Error ? webpError.message : String(webpError)}; JPEG error: ${error instanceof Error ? error.message : String(error)}`)
      return NextResponse.json({ error: "Image processing failed. Please try a standard JPG, PNG, or WebP image." }, { status: 422 })
    }
  }

  const folder = destination.folder
  const filename = `${randomBytes(12).toString("hex")}.${outputExtension}`
  const key = `uploads/images/${folder}/${filename}`
  try {
    await storePublicUpload(key, optimized, outputMimeType)
  } catch (error) {
    console.error(`Image storage failed (entity=${entity}):`, error)
    return NextResponse.json({ error: "The image was processed but could not be saved. Check object storage configuration." }, { status: 500 })
  }
  const url = `/${key}`

  await writeAudit({
    userId: session.user.id,
    userName: session.user.name || "Administrator",
    action: "UPLOAD",
    entity: destination.label,
    detail: `Uploaded optimized ${entity} image (${(optimized.length / 1024).toFixed(0)} KB)`,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0],
  }).catch((error) => console.error("Image upload audit could not be recorded:", error))
  return NextResponse.json({ url, mimeType: outputMimeType, size: optimized.length }, { status: 201 })
}
