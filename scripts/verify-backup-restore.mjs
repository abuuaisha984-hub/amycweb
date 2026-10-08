import { createHash, randomUUID } from "node:crypto"
import { cp, copyFile, mkdir, readFile, readdir, rm, stat } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { PrismaClient } from "@prisma/client"

const projectRoot = process.cwd()
const backupDirectory = path.resolve(process.argv[2] || "")
const expectedBackupRoot = path.resolve(projectRoot, "db", "backups")
if (!process.argv[2] || !backupDirectory.startsWith(`${expectedBackupRoot}${path.sep}`)) {
  throw new Error("Pass a backup directory located inside db/backups.")
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex")
}

async function fileList(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error("Backup verification does not follow symbolic links.")
    if (entry.isDirectory()) files.push(...await fileList(absolute, base))
    else if (entry.isFile()) files.push(path.relative(base, absolute).split(path.sep).join("/"))
  }
  return files.sort()
}

const manifest = JSON.parse(await readFile(path.join(backupDirectory, "manifest.json"), "utf8"))
if (manifest.formatVersion !== 1 || manifest.databaseFile !== "database.sqlite" || manifest.uploadsDirectory !== "uploads") {
  throw new Error("Unsupported backup manifest.")
}

const sourceDb = path.join(backupDirectory, manifest.databaseFile)
const sourceUploads = path.join(backupDirectory, manifest.uploadsDirectory)
if (await sha256(sourceDb) !== manifest.databaseSha256) throw new Error("Database backup hash does not match the manifest.")

const actualFiles = await fileList(sourceUploads)
const expectedFiles = manifest.uploadFiles.map((file) => file.path).sort()
if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) throw new Error("Upload backup file list does not match the manifest.")
for (const entry of manifest.uploadFiles) {
  const safePath = path.resolve(sourceUploads, entry.path)
  if (!safePath.startsWith(`${path.resolve(sourceUploads)}${path.sep}`)) throw new Error("Unsafe upload path in backup manifest.")
  if (await sha256(safePath) !== entry.sha256) throw new Error(`Upload hash does not match: ${entry.path}`)
}

const stagingRoot = path.join(os.tmpdir(), `amyc-restore-check-${randomUUID()}`)
const restoredDbPath = path.join(stagingRoot, "database.sqlite")
const restoredUploadsPath = path.join(stagingRoot, "uploads")
await mkdir(restoredUploadsPath, { recursive: true })

try {
  await copyFile(sourceDb, restoredDbPath)
  await cp(sourceUploads, restoredUploadsPath, { recursive: true })

  const relativeDbPath = path.relative(path.join(projectRoot, "prisma"), restoredDbPath).split(path.sep).join("/")
  const restoredDb = new PrismaClient({ datasources: { db: { url: `file:${relativeDbPath}` } } })
  let tableCount = 0
  try {
    const integrity = await restoredDb.$queryRawUnsafe("PRAGMA quick_check")
    if (integrity.length !== 1 || integrity[0].quick_check !== "ok") throw new Error("Restored SQLite database failed quick_check.")
    const tables = await restoredDb.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    for (const { name } of tables) await restoredDb.$queryRawUnsafe(`SELECT COUNT(*) FROM "${String(name).replaceAll('"', '""')}"`)
    tableCount = tables.length
  } finally {
    await restoredDb.$disconnect()
  }

  const restoredFiles = await fileList(restoredUploadsPath)
  if (JSON.stringify(restoredFiles) !== JSON.stringify(expectedFiles)) throw new Error("Restored uploads do not match the backup file list.")
  for (const entry of manifest.uploadFiles) {
    if (await sha256(path.join(restoredUploadsPath, entry.path)) !== entry.sha256) throw new Error(`Restored upload hash does not match: ${entry.path}`)
  }
  console.log(`Restore verification passed: SQLite integrity, ${tableCount} tables readable, ${restoredFiles.length} uploads hash-verified.`)
} finally {
  const resolvedTemp = path.resolve(stagingRoot)
  const resolvedOsTemp = path.resolve(os.tmpdir())
  if (resolvedTemp.startsWith(`${resolvedOsTemp}${path.sep}`) && path.basename(resolvedTemp).startsWith("amyc-restore-check-")) {
    await rm(resolvedTemp, { recursive: true, force: true })
  }
}
