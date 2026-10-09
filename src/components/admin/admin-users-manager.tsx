"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { ArrowRightLeft, Check, Clipboard, KeyRound, Loader2, Plus, Shield, UserRound, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type AdminUser = { id: string; name: string; email: string; role: string; status: string; mustChangePassword?: boolean; lastLoginAt?: string | null; createdAt?: string }

export function AdminUsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState("")
  const [copied, setCopied] = useState(false)
  const [transferUser, setTransferUser] = useState<AdminUser | null>(null)
  const [transferName, setTransferName] = useState("")
  const [transferEmail, setTransferEmail] = useState("")
  const [transferConfirmed, setTransferConfirmed] = useState(false)
  const [transferPhrase, setTransferPhrase] = useState("")
  const [actionBusy, setActionBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load administrator accounts.")
      setUsers(data.users || [])
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load administrator accounts.") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [load])

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not create account.")
      setTemporaryPassword(data.temporaryPassword)
      setOpen(false)
      setName(""); setEmail("")
      toast.success("Institution administrator account created.")
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create account.") }
    finally { setSaving(false) }
  }

  async function toggleStatus(user: AdminUser) {
    const status = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
    if (!window.confirm(`${status === "SUSPENDED" ? "Suspend" : "Reactivate"} ${user.name}'s account? Existing sessions will be revoked.`)) return
    const response = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) { toast.error(data.error || "Could not update account."); return }
    toast.success(status === "ACTIVE" ? "Administrator account enabled." : "Administrator account suspended.")
    await load()
  }

  async function issueTemporaryPassword(user: AdminUser) {
    if (!window.confirm(`Set a new one-time password for ${user.name}? Existing sessions will be revoked and the account holder must change it at next sign-in.`)) return
    setActionBusy(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "temporary-password" }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not set temporary password.")
      setTempPasswordValue(data.temporaryPassword)
      toast.success("Temporary password set. Share it with the administrator through a private channel.")
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not set temporary password.") }
    finally { setActionBusy(false) }
  }

  function setTempPasswordValue(value: string) {
    setTemporaryPassword(value)
    setCopied(false)
  }

  async function transferAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!transferUser || !transferConfirmed || transferPhrase !== "TRANSFER ADMIN ACCOUNT") return
    setActionBusy(true)
    try {
      const response = await fetch(`/api/admin/users/${transferUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transfer", name: transferName, email: transferEmail, confirmation: "TRANSFER ADMIN ACCOUNT" }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not transfer account.")
      setTempPasswordValue(data.temporaryPassword)
      toast.success("Account transferred. The incoming administrator must change the one-time password at first sign-in.")
      setTransferUser(null); setTransferName(""); setTransferEmail(""); setTransferConfirmed(false); setTransferPhrase("")
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not transfer account.") }
    finally { setActionBusy(false) }
  }

  async function copyPassword() {
    try { await navigator.clipboard.writeText(temporaryPassword); setCopied(true); toast.success("Temporary password copied.") }
    catch { toast.error("Copy is unavailable. Select and copy the temporary password manually.") }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-sm text-muted-foreground">Create a separate account for a replacement (recommended), or deliberately transfer an existing Admin account after confirming the incoming person&apos;s authorization. New and reset accounts must replace their one-time password at first sign-in.</p><Button onClick={() => setOpen(true)}><Plus className="me-2 h-4 w-4" />Create Admin account</Button></div>
    {temporaryPassword && <Card className="border-primary/30 bg-primary/5"><CardContent className="space-y-3 p-5"><div className="flex items-center gap-2 font-semibold"><Shield className="h-4 w-4 text-primary" />One-time temporary password</div><p className="text-sm text-muted-foreground">Share it directly with the account holder through a private channel. It will not be shown again after you close or reload this page.</p><div className="flex flex-wrap gap-2"><code className="min-w-0 flex-1 select-all break-all rounded-md border bg-background p-3 font-mono text-sm">{temporaryPassword}</code><Button type="button" variant="outline" onClick={() => void copyPassword()}>{copied ? <Check className="me-2 h-4 w-4" /> : <Clipboard className="me-2 h-4 w-4" />}{copied ? "Copied" : "Copy"}</Button><Button type="button" variant="ghost" onClick={() => { setTemporaryPassword(""); setCopied(false) }}>Close</Button></div></CardContent></Card>}
    <Card><CardContent className="p-0">{loading ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div> : users.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No institution administrator accounts yet.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-secondary/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Administrator</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Account status</th><th className="px-4 py-3">Last sign-in</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y">{users.map((user) => <tr key={user.id}><td className="px-4 py-3"><div className="flex items-center gap-2 font-medium"><UserRound className="h-4 w-4 text-primary" />{user.name}</div><div className="ps-6 text-xs text-muted-foreground">{user.email}</div></td><td className="px-4 py-3"><Badge variant="outline">{user.role}</Badge></td><td className="px-4 py-3"><Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>{user.status === "ACTIVE" ? "Active" : "Suspended"}</Badge>{user.mustChangePassword && <span className="ms-2 text-xs text-amber-700">Password change required</span>}</td><td className="px-4 py-3 text-xs text-muted-foreground">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={actionBusy} title="Revoke sessions and require a password change" onClick={() => void issueTemporaryPassword(user)}><KeyRound className="me-1.5 h-4 w-4" />Reset password</Button><Button size="sm" variant="outline" disabled={actionBusy} onClick={() => void toggleStatus(user)}>{user.status === "ACTIVE" ? <><UserX className="me-1.5 h-4 w-4" />Suspend</> : <><Check className="me-1.5 h-4 w-4" />Enable</>}</Button><Button size="sm" variant="ghost" disabled={actionBusy} onClick={() => { setTransferUser(user); setTransferName(user.name); setTransferEmail(""); setTransferConfirmed(false); setTransferPhrase("") }}><ArrowRightLeft className="me-1.5 h-4 w-4" />Transfer</Button></div></td></tr>)}</tbody></table></div>}</CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Create institution Admin</DialogTitle><DialogDescription>The system generates a one-time password. The new Admin changes it after first sign-in.</DialogDescription></DialogHeader><form onSubmit={create} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="admin-account-name">Full name</Label><Input id="admin-account-name" autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="admin-account-email">Account email</Label><Input id="admin-account-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /><p className="text-xs text-muted-foreground">This email becomes the sign-in username and cannot be changed by the Admin.</p></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}Create account</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={!!transferUser} onOpenChange={(isOpen) => { if (!isOpen && !actionBusy) setTransferUser(null) }}><DialogContent><DialogHeader><DialogTitle>Transfer Admin account</DialogTitle><DialogDescription>This keeps the same account record and role, revokes existing sessions, consumes outstanding reset links, and requires the incoming administrator to change a one-time password. Historical content and audit snapshots will remain. Verify the incoming person&apos;s identity and authorization before continuing. Prefer creating a separate account when practical.</DialogDescription></DialogHeader><form onSubmit={transferAccount} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="transfer-admin-name">Incoming administrator name</Label><Input id="transfer-admin-name" autoComplete="name" required minLength={2} maxLength={120} value={transferName} onChange={(event) => setTransferName(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="transfer-admin-email">Incoming administrator email</Label><Input id="transfer-admin-email" type="email" autoComplete="email" required maxLength={254} value={transferEmail} onChange={(event) => setTransferEmail(event.target.value)} /></div><label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={transferConfirmed} onChange={(event) => setTransferConfirmed(event.target.checked)} /><span>I confirmed the incoming person&apos;s identity and authorization, and approve transferring this account.</span></label><div className="space-y-1.5"><Label htmlFor="transfer-admin-confirmation">Type TRANSFER ADMIN ACCOUNT to confirm</Label><Input id="transfer-admin-confirmation" autoComplete="off" required value={transferPhrase} onChange={(event) => setTransferPhrase(event.target.value)} /></div><DialogFooter><Button type="button" variant="outline" disabled={actionBusy} onClick={() => setTransferUser(null)}>Cancel</Button><Button type="submit" disabled={actionBusy || !transferConfirmed || transferPhrase !== "TRANSFER ADMIN ACCOUNT"}>{actionBusy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}Transfer account</Button></DialogFooter></form></DialogContent></Dialog>
  </div>
}
