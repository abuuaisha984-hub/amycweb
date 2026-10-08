"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { AmycLogo } from "@/components/site/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck, Loader2, Lock, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AdminLoginPage() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center">Loading sign in…</div>}><AdminLoginForm /></Suspense>
}

function AdminLoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const callback = params.get("callbackUrl") || "/admin"

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const email = (form.email as HTMLInputElement).value
    const password = (form.password as HTMLInputElement).value
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      toast.error("Invalid email or password.")
    } else if (res?.ok) {
      toast.success("Welcome back.")
      router.push(callback)
      router.refresh()
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4">
      <div className="absolute inset-0 bg-pattern opacity-[0.06]" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-xl bg-primary-foreground/10 p-3 ring-1 ring-primary-foreground/20 backdrop-blur">
            <AmycLogo className="[&_span]:text-primary-foreground [&_.text-muted-foreground]:text-primary-foreground/60" />
          </div>
        </div>
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="mb-6 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h1 className="mt-4 font-serif text-2xl font-semibold">Admin Sign In</h1>
              <p className="mt-1 text-sm text-muted-foreground">Secure access to the AMYC management dashboard.</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" name="email" type="email" required autoComplete="username" className="pl-9" placeholder="you@amyc.or.tz" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" name="password" type="password" required autoComplete="current-password" className="pl-9" placeholder="••••••••" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary" disabled={loading}>
                {loading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Signing in…</> : "Sign In"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-3 w-3" /> Back to website
              </Link>
            </div>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-primary-foreground/60">
          Protected by RBAC · Audit logging · Secure sessions
        </p>
      </div>
    </div>
  )
}
