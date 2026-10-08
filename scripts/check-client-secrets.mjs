import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const envPath = path.join(root, ".env")
const candidates = ["NEXTAUTH_SECRET", "VISITOR_ANALYTICS_SECRET", "AMYC_INITIAL_ADMIN_PASSWORD"]
const env = await readFile(envPath, "utf8").catch(() => "")
const secrets = candidates.flatMap((key) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = env.match(new RegExp(`^\\s*(?:export\\s+)?${escaped}\\s*=\\s*(['\"]?)([^\\r\\n'\"]+)\\1\\s*$`, "m"))
  const value = match?.[2]?.trim()
  return value && !value.startsWith("replace-with-") ? [{ key, value }] : []
})

async function walk(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(full))
    else if (entry.isFile()) files.push(full)
  }
  return files
}

const roots = [".next/static", "public"]
const violations = []
for (const relativeRoot of roots) {
  const directory = path.join(root, relativeRoot)
  const files = await walk(directory).catch(() => [])
  for (const file of files) {
    const content = await readFile(file).catch(() => null)
    if (!content) continue
    for (const secret of secrets) {
      if (content.includes(Buffer.from(secret.value))) violations.push({ key: secret.key, file: path.relative(root, file) })
    }
  }
}

if (violations.length) {
  for (const violation of violations) console.error(`Possible ${violation.key} exposure in ${violation.file}`)
  process.exitCode = 1
} else {
  console.log(`No values for ${secrets.length} configured server-only secret(s) were found in public/ or .next/static.`)
}
