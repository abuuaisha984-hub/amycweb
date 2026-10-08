import { randomUUID, createHash } from "node:crypto"
import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import nextEnv from "@next/env"
import { PrismaClient } from "@prisma/client"

const projectRoot = process.cwd()
nextEnv.loadEnvConfig(projectRoot, process.env.NODE_ENV !== "production")

function databasePathFromUrl(value) {
  if (!value?.startsWith("file:")) throw new Error("DATABASE_URL must use SQLite file: for this backup script.")
  const rawPath = decodeURIComponent(value.slice(5).split("?")[0])
  if (!rawPath) throw new Error("DATABASE_URL does not contain a database file path.")
  return path.isAbsolute(rawPath) ? path.resolve(rawPath) : path.resolve(projectRoot, "prisma", rawPath)
}

async function filesUnder(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`Uploads backup does not follow symlinks: ${path.relative(base, absolute)}`)
    if (entry.isDirectory()) files.push(...await filesUnder(absolute, base))
    else if (entry.isFile()) files.push({ path: path.relative(base, absolute).split(path.sep).join("/"), size: (await stat(absolute)).size })
  }
  return files
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex")
}

const sourceDbPath = databasePathFromUrl(process.env.DATABASE_URL)
const sourceUploadsPath = path.join(projectRoot, "public", "uploads")
const backupRoot = path.join(projectRoot, "db", "backups")
const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")
const temporaryDirectory = path.join(backupRoot, `.pending-${stamp}-${randomUUID()}`)
const finalDirectory = path.join(backupRoot, `amyc-${stamp}`)
const databaseBackupPath = path.join(temporaryDirectory, "database.sqlite")
const uploadsBackupPath = path.join(temporaryDirectory, "uploads")
const db = new PrismaClient()

try {
  await mkdir(backupRoot, { recursive: true })
  await mkdir(temporaryDirectory, { recursive: false })
  await mkdir(uploadsBackupPath, { recursive: true })
  await stat(sourceDbPath)

  const quotedDestination = databaseBackupPath.replaceAll("'", "''")
  await db.$executeRawUnsafe(`VACUUM INTO '${quotedDestination}'`)
  await db.$disconnect()

  try {
    const uploadEntries = await readdir(sourceUploadsPath, { withFileTypes: true })
    for (const entry of uploadEntries) {
      await cp(path.join(sourceUploadsPath, entry.name), path.join(uploadsBackupPath, entry.name), {
        recursive: true,
        dereference: false,
        errorOnExist: true,
      })
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error
  }

  const uploadFiles = await filesUnder(uploadsBackupPath)
  const uploadBytes = uploadFiles.reduce((sum, file) => sum + file.size, 0)
  const manifest = {
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    databaseFile: "database.sqlite",
    databaseSha256: await sha256(databaseBackupPath),
    uploadsDirectory: "uploads",
    uploadFileCount: uploadFiles.length,
    uploadBytes,
    uploadFiles: await Promise.all(uploadFiles.map(async (file) => ({ ...file, sha256: await sha256(path.join(uploadsBackupPath, file.path)) }))),
  }
  await writeFile(path.join(temporaryDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" })
  await rename(temporaryDirectory, finalDirectory)
  console.log(`Backup created: ${path.relative(projectRoot, finalDirectory)}`)
  console.log(`Database SHA-256: ${manifest.databaseSha256}`)
  console.log(`Uploads: ${manifest.uploadFileCount} files, ${manifest.uploadBytes} bytes`)
} catch (error) {
  await db.$disconnect().catch(() => undefined)
  const resolvedRoot = path.resolve(backupRoot)
  const resolvedTemporary = path.resolve(temporaryDirectory)
  if (resolvedTemporary.startsWith(`${resolvedRoot}${path.sep}`) && path.basename(resolvedTemporary).startsWith(".pending-")) {
    await rm(resolvedTemporary, { recursive: true, force: true }).catch(() => undefined)
  }
  console.error(error instanceof Error ? error.message : "Backup failed.")
  process.exitCode = 1
}
