"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PasswordResetForm() {
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") || ""
    window.history.replaceState(null, "", window.location.pathname)
    const timeout = window.setTimeout(() => setToken(value), 0)
    return () => window.clearTimeout(timeout)
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage(""); setError("")
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password, confirmPassword }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "The reset link is invalid or expired.")
      setToken(""); setPassword(""); setConfirmPassword("")
      setMessage("Your password has been changed. You can now sign in with your new password.")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The password could not be reset.") }
    finally { setLoading(false) }
  }

  return <Card className="border-0 shadow-2xl"><CardContent className="p-8">
    <h1 className="text-center font-serif text-2xl font-semibold">Set a new password</h1><p className="mb-6 mt-2 text-center text-sm text-muted-foreground">Choose a password with at least 14 characters.</p>
    <form onSubmit={submit} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={14} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={14} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div><Button className="w-full" disabled={loading || token.length < 32}>{loading ? "Saving…" : "Reset password"}</Button></form>
    {message && <p role="status" className="mt-4 text-sm text-green-700">{message}</p>}{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    {!token && !message && <p className="mt-4 text-sm text-muted-foreground">A valid reset link is required. Request a new link if yours is missing or expired.</p>}
    <p className="mt-6 text-center text-sm"><Link href="/admin/login" className="font-medium text-primary hover:underline">Back to sign in</Link></p>
  </CardContent></Card>
}
