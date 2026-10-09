import type { Metadata } from "next"
import { AmycLogo } from "@/components/site/logo"
import { PasswordRecoveryRequestForm } from "@/components/auth/password-recovery-request-form"

export const metadata: Metadata = { robots: { index: false, follow: false, noarchive: true } }

export default function ForgotPasswordPage() {
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4">
    <div className="absolute inset-0 bg-pattern opacity-[0.06]" /><div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85" />
    <div className="relative w-full max-w-md"><div className="mb-6 flex justify-center"><div className="rounded-xl bg-primary-foreground/10 p-3 ring-1 ring-primary-foreground/20 backdrop-blur"><AmycLogo className="[&_span]:text-primary-foreground [&_.text-muted-foreground]:text-primary-foreground/60" /></div></div><PasswordRecoveryRequestForm /></div>
  </main>
}
