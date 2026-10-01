import { withAuth } from "next-auth/middleware"

/**
 * Protects all /admin routes except the login page.
 */
export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname
      // Allow the login page without auth
      if (path === "/admin/login") return true
      return !!token
    },
  },
})

export const config = {
  matcher: ["/admin/:path*"],
}
