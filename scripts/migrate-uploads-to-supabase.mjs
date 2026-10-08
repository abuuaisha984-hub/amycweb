import { lstat, readdir, readFile } from "node:fs/promises"
import path from "node:path"

const sourceRoot = path.resolve(process.argv.find((value) => value.startsWith("--source="))?.slice("--source=".length) || "public/uploads")
const apply = process.argv.includes("--apply")
const bucket = process.env.SUPABASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "amyc-public"
const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.replace(/\/$/, "")
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
const isNewSecretKey = !process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.SUPABASE_SECRET_KEY
const storageHeaders = serviceKey
  ? isNewSecretKey ? { apikey: serviceKey } : { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey }
  : {}
const types = new Map([
  [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".png", "image/png"], [".webp", "image/webp"],
  [".pdf", "application/pdf"], [".doc", "application/msword"], [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".xls", "application/vnd.ms-excel"], [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  [".ppt", "application/vnd.ms-powerpoint"], [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"], [".zip", "application/zip"],
])

async function listFiles(directory, result = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name)
    const info = await lstat(absolutePath)
    if (info.isSymbolicLink()) throw new Error("Upload migration will not follow symbolic links.")
    if (info.isDirectory()) await listFiles(absolutePath, result)
    else if (info.isFile()) {
      const relativePath = path.relative(sourceRoot, absolutePath).split(path.sep).join("/")
      const mimeType = types.get(path.extname(entry.name).toLowerCase())
      if (!mimeType) throw new Error(`Unsupported upload file extension in source inventory: ${path.extname(entry.name) || "(none)"}`)
      result.push({ absolutePath, key: `uploads/${relativePath}`, mimeType, size: info.size })
    }
  }
  return result
}

const files = await listFiles(sourceRoot)
const totals = new Map()
for (const file of files) totals.set(file.mimeType, (totals.get(file.mimeType) || 0) + 1)
console.log(`Local upload files discovered: ${files.length}`)
for (const [mimeType, count] of totals) console.log(`  ${mimeType}: ${count}`)
if (!apply) {
  console.log("Dry run only. The source files are unchanged. Review the inventory before using --apply with staging Supabase credentials.")
  process.exit(0)
}
if (!baseUrl || !serviceKey) throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY (or the legacy equivalents) in the protected environment before applying the upload migration.")

for (const file of files) {
  const key = file.key.split("/").map(encodeURIComponent).join("/")
  const response = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${key}`, {
    method: "POST",
    headers: {
      ...storageHeaders,
      "Content-Type": file.mimeType,
      "x-upsert": "true",
    },
    body: new Uint8Array(await readFile(file.absolutePath)),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`Storage upload failed with HTTP ${response.status}; source files were retained. Correct the staging bucket and rerun the idempotent copy.`)
}
console.log(`Uploaded ${files.length} files to bucket ${bucket}. The local source files were retained.`)
