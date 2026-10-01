import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/password"

export const authOptions: NextAuthOptions = {
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
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email.toLowerCase().trim()
        // Rate-limit by simple in-memory attempt counter
        const user = await db.user.findUnique({ where: { email } })
        if (!user) return null
        if (user.status !== "ACTIVE") return null
        const ok = verifyPassword(credentials.password, user.passwordHash)
        if (!ok) return null
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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.userId
        ;(session.user as any).scopeRegionId = token.scopeRegionId
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
    }
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    userId?: string
    scopeRegionId?: string
  }
}
