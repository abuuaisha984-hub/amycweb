import { PrismaClient } from '@prisma/client'

// This repository's Prisma schema uses SQLite. A developer machine can have a
// stale PostgreSQL or hosted DATABASE_URL in .env; keep local development on
// the checked-in workspace database while production continues to use its
// explicitly configured deployment URL.
if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL?.startsWith('file:')) {
  process.env.DATABASE_URL = 'file:../db/custom.db'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getRuntimeDatabaseUrl() {
  const configuredUrl = process.env.DATABASE_URL
  if (!configuredUrl || process.env.NODE_ENV !== "production") return undefined

  const url = new URL(configuredUrl)
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") return undefined

  // Netlify functions scale horizontally. Keep each function instance's
  // Prisma pool to one connection so total clients do not multiply by the
  // default CPU-based pool size.
  url.searchParams.set("connection_limit", "1")

  // Supabase's shared session pooler (5432) caps clients per role/database.
  // Transaction mode (6543) is designed for serverless traffic and Prisma
  // needs PgBouncer compatibility enabled because transaction mode does not
  // support prepared statements.
  if (
    url.hostname.endsWith(".pooler.supabase.com") &&
    (url.port === "" || url.port === "5432")
  ) {
    url.port = "6543"
  }
  if (url.hostname.endsWith(".pooler.supabase.com") && url.port === "6543") {
    url.searchParams.set("pgbouncer", "true")
  }

  return url.toString()
}

// During `next dev`, Prisma Client can be regenerated while the Node process
// keeps a pre-regeneration singleton on globalThis. Reuse it only when it has
// the analytics delegates now present in the schema.
const cachedPrisma = globalForPrisma.prisma
const hasVisitorAnalytics =
  cachedPrisma &&
  typeof cachedPrisma.visitor !== "undefined" &&
  typeof cachedPrisma.visitEvent !== "undefined"
const runtimeDatabaseUrl = getRuntimeDatabaseUrl()

export const db =
  (hasVisitorAnalytics ? cachedPrisma : undefined) ??
  new PrismaClient({
    ...(runtimeDatabaseUrl ? { datasources: { db: { url: runtimeDatabaseUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

// Reuse the module's client across warm serverless invocations, including
// production. Cold instances still get an isolated one-connection pool.
globalForPrisma.prisma = db
