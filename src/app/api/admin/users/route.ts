import { randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { writeAudit } from "@/lib/rbac"

async function superAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (session.user.role !== "SUPER_ADMIN") return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { session }
}

export async function GET() {
  const auth = await superAdmin()
  if ("response" in auth) return auth.response
  const users = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true, role: true, status: true, mustChangePassword: true, lastLoginAt: true, createdAt: true },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  })
  return NextResponse.json({ users })
}

export async function POST(request: NextRequest) {
  const auth = await superAdmin()
  if ("response" in auth) return auth.response
  const schema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254) })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid name and email address." }, { status: 400 })

  const email = parsed.data.email.toLowerCase()
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "An account already uses that email address." }, { status: 409 })
  }

  const temporaryPassword = randomBytes(24).toString("base64url")
  const user = await db.user.create({ data: {
    name: parsed.data.name,
    email,
    role: "ADMIN",
    passwordHash: hashPassword(temporaryPassword),
    status: "ACTIVE",
    mustChangePassword: true,
  }, select: { id: true, name: true, email: true, status: true } })
  await writeAudit({ userId: auth.session.user.id, userName: auth.session.user.name || "Super Admin", action: "CREATE", entity: "User", entityId: user.id, detail: `Created institution administrator account for ${user.email}`, ip: request.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ user, temporaryPassword }, { status: 201 })
}
