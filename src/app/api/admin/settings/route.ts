import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/** Institutional settings are available for oversight but are not writable here. */
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ error: "Institutional settings are read-only." }, { status: 403 })
}
