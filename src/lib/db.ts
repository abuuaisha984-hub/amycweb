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

// During `next dev`, Prisma Client can be regenerated while the Node process
// keeps a pre-regeneration singleton on globalThis. Reuse it only when it has
// the analytics delegates now present in the schema.
const cachedPrisma = globalForPrisma.prisma
const hasVisitorAnalytics =
  cachedPrisma &&
  typeof cachedPrisma.visitor !== "undefined" &&
  typeof cachedPrisma.visitEvent !== "undefined"

export const db =
  (hasVisitorAnalytics ? cachedPrisma : undefined) ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
