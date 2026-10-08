import { readFile, mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

const root = process.cwd()
const sourcePath = resolve(root, "prisma/schema.prisma")
const targetPath = resolve(root, "prisma-postgres/schema.prisma")
const source = await readFile(sourcePath, "utf8")
const matches = source.match(/provider\s*=\s*"sqlite"/g) || []
if (matches.length !== 1) throw new Error("Expected exactly one SQLite datasource provider in prisma/schema.prisma")
const postgres = source.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"')
await mkdir(dirname(targetPath), { recursive: true })
await writeFile(targetPath, postgres)
console.log("Synchronized PostgreSQL schema from the local SQLite schema.")
