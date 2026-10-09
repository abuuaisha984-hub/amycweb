import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/password"
import { isAdminRole } from "@/lib/permissions"

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_MAX_FAILURES = 8
const failedLogins = new Map<string, { count: number; expiresAt: number }>()

function isLoginThrottled(key: string) {
  const now = Date.now()
  for (const [entryKey, entry] of failedLogins) if (entry.expiresAt <= now) failedLogins.delete(entryKey)
  const entry = failedLogins.get(key)
  return !!entry && entry.count >= LOGIN_MAX_FAILURES && entry.expiresAt > now
}

function recordFailedLogin(key: string) {
  if (failedLogins.size >= 10_000 && !failedLogins.has(key)) {
    const oldest = failedLogins.keys().next().value
    if (oldest) failedLogins.delete(oldest)
  }
  const entry = failedLogins.get(key)
  if (!entry || entry.expiresAt <= Date.now()) failedLogins.set(key, { count: 1, expiresAt: Date.now() + LOGIN_WINDOW_MS })
  else entry.count += 1
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "AMYC Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || credentials.password.length > 1024) return null
        const email = credentials.email.toLowerCase().trim()
        if (email.length > 254 || isLoginThrottled(email)) return null
        const user = await db.user.findUnique({ where: { email } })
        if (!user || user.status !== "ACTIVE" || !isAdminRole(user.role) || !verifyPassword(credentials.password, user.passwordHash)) {
          recordFailedLogin(email)
          return null
        }
        failedLogins.delete(email)
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          scopeRegionId: user.scopeRegionId ?? undefined,
          mustChangePassword: user.mustChangePassword,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.userId = (user as any).id
        token.scopeRegionId = (user as any).scopeRegionId
        token.mustChangePassword = (user as any).mustChangePassword
        return token
      }
      if (token.userId) {
        const currentUser = await db.user.findUnique({
          where: { id: String(token.userId) },
          select: { role: true, status: true, scopeRegionId: true, mustChangePassword: true },
        })
        if (!currentUser || currentUser.status !== "ACTIVE" || !isAdminRole(currentUser.role)) {
          token.role = undefined
          token.userId = undefined
          token.scopeRegionId = undefined
          token.mustChangePassword = undefined
        } else {
          token.role = currentUser.mustChangePassword ? undefined : currentUser.role
          token.scopeRegionId = currentUser.scopeRegionId ?? undefined
          token.mustChangePassword = currentUser.mustChangePassword
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.userId
        ;(session.user as any).scopeRegionId = token.scopeRegionId
        ;(session.user as any).mustChangePassword = token.mustChangePassword
      }
      return session
    },
  },
  pages: {
    signIn: "/admin/login",
  },
}

// Extend types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      role?: string
      scopeRegionId?: string
      mustChangePassword?: boolean
    }
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    userId?: string
    scopeRegionId?: string
    mustChangePassword?: boolean
  }
}
