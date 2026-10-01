"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { toast } from "sonner"
import { Save, Loader2 } from "lucide-react"

type Stats = Record<string, { label: string; value: string; note?: string }>

export function SettingsForm({ initial }: { initial: Record<string, any> }) {
  const [org, setOrg] = useState({
    orgName: initial.orgName || "",
    orgShortName: initial.orgShortName || "",
    tagline: initial.tagline || "",
    mission: initial.mission || "",
    vision: initial.vision || "",
    foundedYear: initial.foundedYear || "",
    headquarters: initial.headquarters || "",
    email: initial.email || "",
    phone: initial.phone || "",
    address: initial.address || "",
    officeHours: initial.officeHours || "",
    radioStation: initial.radioStation || "",
  })
  const [stats, setStats] = useState<Stats>(initial.stats || {})
  const [saving, setSaving] = useState(false)

  function updateStat(key: string, field: "label" | "value" | "note", v: string) {
    setStats((s) => ({ ...s, [key]: { ...s[key], [field]: v } }))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...org, stats }),
      })
      if (res.ok) toast.success("Settings saved.")
      else toast.error("Failed to save.")
    } catch {
      toast.error("Network error.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3"><h2 className="font-serif text-lg font-semibold">Institutional Information</h2></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Organization name</Label><Input value={org.orgName} onChange={(e) => setOrg({ ...org, orgName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Short name</Label><Input value={org.orgShortName} onChange={(e) => setOrg({ ...org, orgShortName: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Tagline</Label><Textarea value={org.tagline} onChange={(e) => setOrg({ ...org, tagline: e.target.value })} rows={2} /></div>
          <div className="space-y-1.5"><Label>Mission</Label><Textarea value={org.mission} onChange={(e) => setOrg({ ...org, mission: e.target.value })} rows={2} /></div>
          <div className="space-y-1.5"><Label>Vision</Label><Textarea value={org.vision} onChange={(e) => setOrg({ ...org, vision: e.target.value })} rows={2} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5"><Label>Founded year</Label><Input value={org.foundedYear} onChange={(e) => setOrg({ ...org, foundedYear: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Headquarters</Label><Input value={org.headquarters} onChange={(e) => setOrg({ ...org, headquarters: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Radio station</Label><Input value={org.radioStation} onChange={(e) => setOrg({ ...org, radioStation: e.target.value })} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Email</Label><Input value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={org.phone} onChange={(e) => setOrg({ ...org, phone: e.target.value })} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Address</Label><Input value={org.address} onChange={(e) => setOrg({ ...org, address: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Office hours</Label><Input value={org.officeHours} onChange={(e) => setOrg({ ...org, officeHours: e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><h2 className="font-serif text-lg font-semibold">Homepage Statistics</h2></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats).map(([key, s]) => (
              <div key={key} className="rounded-lg border border-border p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{key}</p>
                <div className="space-y-2">
                  <Input value={s.label} onChange={(e) => updateStat(key, "label", e.target.value)} placeholder="Label" className="h-8 text-sm" />
                  <Input value={s.value} onChange={(e) => updateStat(key, "value", e.target.value)} placeholder="Value" className="h-8 text-sm" />
                  <Input value={s.note || ""} onChange={(e) => updateStat(key, "note", e.target.value)} placeholder="Note" className="h-8 text-xs" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} className="bg-primary" disabled={saving}>
          {saving ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…</> : <><Save className="mr-1.5 h-4 w-4" /> Save Settings</>}
        </Button>
      </div>
    </div>
  )
}
