"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PasswordRecoveryRequestForm() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true); setMessage(""); setError("")
    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not submit the request.")
      setMessage(data.message)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not submit the request.") }
    finally { setLoading(false) }
  }

  return <Card className="border-0 shadow-2xl"><CardContent className="p-8">
    <h1 className="text-center font-serif text-2xl font-semibold">Forgot password?</h1>
    <p className="mb-6 mt-2 text-center text-sm text-muted-foreground">Enter the email address associated with your administrator account.</p>
    <form onSubmit={submit} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="recovery-email">Email</Label><Input id="recovery-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></div><Button className="w-full" disabled={loading}>{loading ? "Submitting…" : "Send reset instructions"}</Button></form>
    {message && <p role="status" className="mt-4 text-sm text-green-700">{message}</p>}{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    <p className="mt-6 text-center text-sm"><Link href="/admin/login" className="font-medium text-primary hover:underline">Back to sign in</Link></p>
  </CardContent></Card>
}
