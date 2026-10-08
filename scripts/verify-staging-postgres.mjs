import nextEnv from "@next/env"
import { PrismaClient } from "@prisma/client"

nextEnv.loadEnvConfig(process.cwd())

const databaseUrl = process.env.DATABASE_URL || ""
const testSslRequire = process.argv.includes("--test-ssl-require")
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const backendKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ""
const bucket = process.env.SUPABASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "amyc-public"
const expectedModels = [
  "User", "AuditLog", "Category", "Article", "Event", "School", "Region", "Programme", "Project", "Document",
  "MediaItem", "Gallery", "GalleryItem", "Page", "Leader", "ContactMessage", "VisitEvent", "Visitor", "SiteSetting",
  "SocialLink", "ExternalLink",
]

const missing = []
if (!databaseUrl) missing.push("DATABASE_URL")
if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) missing.push("DATABASE_URL (must be PostgreSQL)")
if (!supabaseUrl) missing.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
if (!backendKey) missing.push("SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY")
if (bucket !== "amyc-public") missing.push("Storage bucket must be amyc-public")
if (missing.length) {
  console.log(JSON.stringify({ configurationPass: false, missing }))
  process.exit(1)
}

let sameProject = false
let connectionSummary
let prismaConnectionUrl = databaseUrl
try {
  const sb = new URL(supabaseUrl)
  const db = new URL(databaseUrl)
  const ref = sb.hostname.split(".")[0]
  sameProject = db.hostname === `db.${ref}.supabase.co` || db.username.startsWith(`postgres.${ref}`)
  const port = Number(db.port || "5432")
  connectionSummary = {
    validPostgresUrl: ["postgres:", "postgresql:"].includes(db.protocol),
    host: db.hostname,
    port,
    database: decodeURIComponent(db.pathname.replace(/^\//, "")),
    username: decodeURIComponent(db.username),
    passwordPresent: Boolean(db.password),
    sslmode: db.searchParams.get("sslmode") || "unspecified",
    pooler: db.hostname.includes("pooler.supabase.com")
      ? port === 5432 ? "session-pooler"
        : port === 6543 ? "transaction-pooler"
          : "supabase-pooler-unclassified-port"
      : "not-session-pooler-host",
  }
  if (testSslRequire && !db.searchParams.has("sslmode")) {
    db.searchParams.set("sslmode", "require")
    prismaConnectionUrl = db.toString()
  }
} catch {}
if (!sameProject) {
  console.log(JSON.stringify({ configurationPass: false, databaseProjectMatchesSupabase: false, connectionSummary: connectionSummary || { validPostgresUrl: false } }))
  process.exit(1)
}

function safeError(error) {
  let message = typeof error?.message === "string" ? error.message : "PostgreSQL connection failed with an unclassified error."
  try {
    const password = new URL(databaseUrl).password
    if (password) {
      message = message.replaceAll(password, "[redacted]")
      try { message = message.replaceAll(decodeURIComponent(password), "[redacted]") } catch {}
    }
  } catch {}
  message = message
    .replace(/((?:postgres|postgresql):\/\/)[^\s`'"<>]+/gi, (value) => value.replace(/\/\/[^/@\s]+@/, "//[redacted]@"))
    .replace(/((?:password|pwd)=)[^&\s]+/gi, "$1[redacted]")
  return message
}

const client = new PrismaClient({ datasources: { db: { url: prismaConnectionUrl } }, log: [] })
try {
  await client.$connect()
  const identity = await client.$queryRaw`SELECT current_database() AS database_name, current_schema() AS schema_name`
  const listed = await client.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  const names = new Set(listed.map((row) => row.table_name))
  const tableCounts = {}
  for (const model of expectedModels) {
    if (!names.has(model)) continue
    const rows = await client.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "public"."${model}"`)
    tableCounts[model] = rows[0].count
  }
  let migrationRows = 0
  if (names.has("_prisma_migrations")) {
    const rows = await client.$queryRaw`SELECT COUNT(*)::int AS count FROM public._prisma_migrations`
    migrationRows = rows[0].count
  }
  const applicationTablesPresent = Object.keys(tableCounts).length
  const nonemptyTables = Object.entries(tableCounts).filter(([, count]) => count > 0).map(([table]) => table)
  console.log(JSON.stringify({
    configurationPass: true,
    databaseProjectMatchesSupabase: sameProject,
    connectionSummary,
    testedSslmode: testSslRequire ? "require (in-memory diagnostic only)" : connectionSummary.sslmode,
    connectionPass: identity.length === 1,
    applicationTablesPresent,
    applicationTableCounts: tableCounts,
    nonemptyTables,
    prismaMigrationRows: migrationRows,
    emptyForBaseline: applicationTablesPresent === 0 && migrationRows === 0,
  }))
  if (applicationTablesPresent > 0 || migrationRows > 0) process.exitCode = 2
} catch (error) {
  console.log(JSON.stringify({
    configurationPass: true,
    databaseProjectMatchesSupabase: true,
    connectionSummary,
    testedSslmode: testSslRequire ? "require (in-memory diagnostic only)" : connectionSummary.sslmode,
    connectionPass: false,
    errorName: typeof error?.name === "string" ? error.name : "Error",
    errorCode: typeof error?.errorCode === "string" ? error.errorCode : typeof error?.code === "string" ? error.code : "unknown",
    errorMessage: safeError(error),
  }))
  process.exitCode = 1
} finally {
  await client.$disconnect().catch(() => {})
}
