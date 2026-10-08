import { NextRequest, NextResponse } from "next/server"
import { createHmac, randomBytes } from "crypto"
import { db } from "@/lib/db"
import { isLocale } from "@/lib/i18n"
import { consumeRequestLimit, requestAddress } from "@/lib/request-rate-limit"

const PAGE_PATH = /^\/(en|sw|ar)(?:\/[a-zA-Z0-9%._~!$&'()*+,;=:@/-]*)?\/?$/
const COOKIE_NAME = "amyc_visitor_id"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function visitorDigest(identifier: string) {
  const secret = process.env.VISITOR_ANALYTICS_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("Visitor analytics secret is not configured")
  return createHmac("sha256", secret).update(identifier).digest("hex")
}

function locationValue(value: string | null) {
  if (!value) return "Unknown"
  let normalized = value
  try { normalized = decodeURIComponent(value) } catch { /* keep the proxy header value */ }
  normalized = normalized.replace(/[\u0000-\u001f\u007f]/g, "").trim()
  return normalized && normalized.length <= 100 ? normalized : "Unknown"
}

function locationFromHeaders(req: NextRequest) {
  const rawCountry = (req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || "").trim().toUpperCase()
  return {
    country: /^[A-Z]{2}$/.test(rawCountry) && rawCountry !== "XX" ? rawCountry : "Unknown",
    region: locationValue(req.headers.get("cf-region") || req.headers.get("x-vercel-ip-country-region")),
    city: locationValue(req.headers.get("cf-ipcity") || req.headers.get("x-vercel-ip-city")),
  }
}

export async function POST(req: NextRequest) {
  const address = requestAddress(req.headers)
  const limit = consumeRequestLimit(`analytics:${address}`, 120, 5 * 60 * 1000)
  if (!limit.allowed) return NextResponse.json({ ok: false }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } })

  const body: unknown = await req.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const { pathname, referrer } = body as { pathname?: unknown; referrer?: unknown }
  if (typeof pathname !== "string" || pathname.length > 300 || !PAGE_PATH.test(pathname)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const locale = pathname.split("/")[1]
  if (!isLocale(locale)) return NextResponse.json({ ok: false }, { status: 400 })

  let referrerHost: string | null = null
  if (typeof referrer === "string" && referrer.length <= 500) {
    try {
      const host = new URL(referrer).hostname.toLowerCase()
      if (host && host !== req.nextUrl.hostname) referrerHost = host.slice(0, 150)
    } catch {
      // Ignore malformed referrers; never store the URL or its query string.
    }
  }

  try {
    const existingCookie = req.cookies.get(COOKIE_NAME)?.value
    const identifier = existingCookie && /^[A-Za-z0-9_-]{40,60}$/.test(existingCookie)
      ? existingCookie
      : randomBytes(32).toString("base64url")
    const location = locationFromHeaders(req)
    const visitorHash = visitorDigest(identifier)
    const visitor = await db.visitor.upsert({
      where: { visitorHash },
      create: { visitorHash, ...location },
      update: {
        lastVisitedAt: new Date(),
        ...(location.country !== "Unknown" ? { country: location.country } : {}),
        ...(location.region !== "Unknown" ? { region: location.region } : {}),
        ...(location.city !== "Unknown" ? { city: location.city } : {}),
      },
      select: { id: true },
    })
    await db.visitEvent.create({ data: { visitorId: visitor.id, pathname, locale, referrerHost, ...location } })
    const response = NextResponse.json({ ok: true }, { status: 202 })
    if (!existingCookie || !/^[A-Za-z0-9_-]{40,60}$/.test(existingCookie)) {
      response.cookies.set(COOKIE_NAME, identifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || req.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      })
    }
    return response
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
