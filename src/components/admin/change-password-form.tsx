"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { getSession, signIn } from "next-auth/react"
import { toast } from "sonner"
import { Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ChangePasswordForm({ required = false }: { required?: boolean }) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newPassword !== confirmPassword) { toast.error("The new passwords do not match."); return }
    setSaving(true)
    try {
      const currentSession = await getSession()
      const email = currentSession?.user?.email
      if (!email) throw new Error("Your session expired. Sign in again before changing your password.")
      const response = await fetch("/api/admin/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not change password.")
      const refreshed = await signIn("credentials", { email, password: newPassword, redirect: false })
      if (!refreshed?.ok) {
        router.replace("/admin/login?passwordChanged=1")
        return
      }
      toast.success("Password changed successfully.")
      router.replace("/admin")
      router.refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not change password.") }
    finally { setSaving(false) }
  }

  return <Card className="max-w-xl">
    <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Change account password</CardTitle>
      <p className="text-sm text-muted-foreground">{required ? "For security, choose a personal password before continuing to the admin dashboard." : "Your account email is managed by the Super Admin and cannot be changed here."}</p>
    </CardHeader>
    <CardContent><form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5"><Label htmlFor="current-password">Current or temporary password</Label><Input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={14} maxLength={128} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><p className="text-xs text-muted-foreground">Use at least 14 characters.</p></div>
      <div className="space-y-1.5"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={14} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
      <Button type="submit" disabled={saving}>{saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}Save password</Button>
    </form></CardContent>
  </Card>
}
