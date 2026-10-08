import { withAuth } from "next-auth/middleware"
import { getToken } from "next-auth/jwt"
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server"
import { canAccessAdminPath } from "@/lib/permissions"

const protectAdmin = withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname
      if (path === "/admin/login") return true
      if (!token) return false
      if (token.mustChangePassword) return path === "/admin/account/password"
      if (canAccessAdminPath(String(token.role || ""), path)) return true
      return false
    },
  },
})

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const path = req.nextUrl.pathname
  if (path.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (token?.mustChangePassword && path !== "/admin/account/password" && path !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/account/password", req.url))
    }
    return protectAdmin(req as Parameters<typeof protectAdmin>[0], event)
  }

  const locale = path.match(/^\/(en|sw|ar)(?:\/|$)/)?.[1] || "en"
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-amyc-locale", locale)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  // Admin APIs authorize each request inside its route handler. Keeping API
  // bodies out of Proxy also avoids Next's default 10 MB proxy buffering cap,
  // which would silently truncate the supported 20–25 MB uploads.
  matcher: ["/((?!api(?:/|$)|_next/static|_next/image|favicon.ico).*)"],
}
