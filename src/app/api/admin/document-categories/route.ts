import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { randomBytes } from "crypto"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { can, writeAudit } from "@/lib/rbac"

const categoryInput = z.object({ name: z.string().trim().min(2).max(100) })
function slugify(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }

async function authorize() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (!can(session.user.role, "document")) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { session }
}

export async function GET() {
  const auth = await authorize()
  if ("response" in auth) return auth.response
  const categories = await db.category.findMany({ where: { type: "DOCUMENT" }, orderBy: { name: "asc" } })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const auth = await authorize()
  if ("response" in auth) return auth.response
  const parsed = categoryInput.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Enter a category name (2–100 characters)." }, { status: 400 })
  if (await db.category.findFirst({ where: { type: "DOCUMENT", name: parsed.data.name } })) return NextResponse.json({ error: "That document category already exists." }, { status: 409 })
  const slug = `${slugify(parsed.data.name)}-${randomBytes(2).toString("hex")}`
  const category = await db.category.create({ data: { name: parsed.data.name, slug, type: "DOCUMENT", active: true } })
  await writeAudit({ userId: auth.session.user.id, userName: auth.session.user.name || "Administrator", action: "CREATE", entity: "Category", entityId: category.id, detail: `Created document category "${category.name}"`, ip: req.headers.get("x-forwarded-for")?.split(",")[0] })
  return NextResponse.json({ category }, { status: 201 })
}
