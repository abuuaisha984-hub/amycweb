"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Archive, ExternalLink, Loader2, MapPin, Pencil, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminImageUpload } from "@/components/admin/image-upload"
import { TranslationTabs } from "@/components/admin/translation-tabs"
import type { Locale } from "@/lib/i18n"

type Region = { id: string; slug: string; name: string; englishName: string | null; administrativeRegion: string | null; district: string | null; overview: string; history: string | null; leadership: string; activities: string; branches: string; contact: string | null; email: string | null; phone: string | null; website: string | null; image: string | null; sortOrder: number; status: string; translations: string }
const EMPTY = { name: "", slug: "", englishName: "", administrativeRegion: "", district: "", overview: "", history: "", leadership: "", activities: "", branches: "", contact: "", email: "", phone: "", website: "", image: "", sortOrder: "0", status: "DRAFT", translations: "{}" }
function slugify(value: string) { return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }
function list(raw: string) { try { const values = JSON.parse(raw); return Array.isArray(values) ? values : [] } catch { return [] } }
function lines(value: string) { return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) }
function normalizedUrl(value: string) { const trimmed = value.trim(); return trimmed && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed }

export function RegionsManager({ role }: { role: string }) {
  const [regions, setRegions] = useState<Region[]>([]); const [loading, setLoading] = useState(true); const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<Region | null>(null); const [open, setOpen] = useState(false); const [saving, setSaving] = useState(false); const [form, setForm] = useState<Record<string, string>>(EMPTY)
  const [translations, setTranslations] = useState<Record<string, any>>({}); const [locale, setLocale] = useState<Locale>("en")
  const load = useCallback(async () => { setLoading(true); try { const response = await fetch("/api/admin/regions"); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not load regions."); setRegions(data.regions || []) } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load regions.") } finally { setLoading(false) } }, [])
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [load])
  function change(key: string, value: string) { setForm((current) => ({ ...current, [key]: value, ...(key === "name" && !editing ? { slug: slugify(value) } : {}) })) }
  function add() { setEditing(null); setTranslations({}); setLocale("en"); setForm({ ...EMPTY }); setOpen(true) }
  function edit(region: Region) {
    setEditing(region)
    try { setTranslations(JSON.parse(region.translations || "{}")) } catch { setTranslations({}) }; setLocale("en")
    const leaders = list(region.leadership).map((item: {position?:string;name?:string}) => `${item.position || ""} | ${item.name || ""}`).join("\n")
    const activities = list(region.activities).join("\n")
    const branches = list(region.branches).map((item: {name?:string;note?:string}) => item.note ? `${item.name || ""} | ${item.note}` : item.name || "").join("\n")
    setForm(Object.fromEntries(Object.keys(EMPTY).map((key) => [key, key === "leadership" ? leaders : key === "activities" ? activities : key === "branches" ? branches : ((region as unknown as Record<string, unknown>)[key] == null ? "" : String((region as unknown as Record<string, unknown>)[key]))])))
    setOpen(true)
  }
  async function save() {
    if (!form.name.trim() || !form.slug.trim()) { toast.error("Enter the region name and URL slug."); return }
    setSaving(true)
    try {
      const leadership = lines(form.leadership).map((row) => { const [position, ...nameParts] = row.split("|"); return { position: position.trim(), name: nameParts.join("|").trim() } })
      const branches = lines(form.branches).map((row) => { const [name, ...notes] = row.split("|"); return { name: name.trim(), ...(notes.length ? { note: notes.join("|").trim() } : {}) } })
      const payload = { ...form, website: normalizedUrl(form.website), sortOrder: Number(form.sortOrder) || 0, leadership, branches, activities: lines(form.activities), translations: JSON.stringify(translations) }
      const response = await fetch(editing ? `/api/admin/regions/${editing.id}` : "/api/admin/regions", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "The region could not be saved.")
      toast.success(editing ? "Region updated." : "Region saved."); setOpen(false); await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : "The region could not be saved.") } finally { setSaving(false) }
  }
  async function archive(region: Region) {
    if (!window.confirm(`Archive “${region.name}”? It will disappear from public directories, but its record and related information will remain.`)) return
    const response = await fetch(`/api/admin/regions/${region.id}`, { method: "DELETE" }); const data = await response.json().catch(() => ({}))
    if (!response.ok) { toast.error(data.error || "Could not archive region."); return }; toast.success("Region archived."); await load()
  }
  const visible = regions.filter((region) => `${region.name} ${region.englishName || ""} ${region.administrativeRegion || ""} ${region.district || ""}`.toLowerCase().includes(query.toLowerCase()))
  const field = (label: string, key: string, placeholder = "") => <div className="space-y-1.5" key={key}><Label htmlFor={`region-${key}`}>{label}</Label><Input id={`region-${key}`} value={form[key] || ""} placeholder={placeholder} disabled={key === "slug" && !!editing} onChange={(event) => change(key, event.target.value)} /></div>
  const area = (label: string, key: string, placeholder = "", rows = 4) => <div className="space-y-1.5 sm:col-span-2" key={key}><Label htmlFor={`region-${key}`}>{label}</Label><Textarea id={`region-${key}`} value={form[key] || ""} placeholder={placeholder} rows={rows} onChange={(event) => change(key, event.target.value)} /></div>
  const trValue = (key: string) => locale === "en" ? form[key] || "" : Array.isArray(translations?.[locale]?.[key]) ? translations[locale][key].map((v: any) => typeof v === "string" ? v : key === "leadership" ? `${v.position || ""} | ${v.name || ""}` : v.note ? `${v.name || ""} | ${v.note}` : v.name || "").join("\n") : translations?.[locale]?.[key] || ""
  const trChange = (key: string, value: string) => { if (locale === "en") { change(key, value); return }; let next: any = value; if (key === "activities") next = lines(value); if (key === "leadership") next = lines(value).map(row => { const [position, ...name] = row.split("|"); return { position: position.trim(), name: name.join("|").trim() } }); if (key === "branches") next = lines(value).map(row => { const [name, ...note] = row.split("|"); return { name: name.trim(), ...(note.length ? { note: note.join("|").trim() } : {}) } }); setTranslations(current => { const copy = { ...current, [locale]: { ...(current[locale] || {}), [key]: next } }; return copy }) }
  const trArea = (label: string, key: string, placeholder = "", rows = 4) => <div className="space-y-1.5 sm:col-span-2" key={key}><Label htmlFor={`region-tr-${key}`}>{label}</Label><Textarea id={`region-tr-${key}`} value={trValue(key)} placeholder={placeholder} rows={rows} onChange={e => trChange(key, e.target.value)} /></div>

  return <div>
    <div className="mb-4 flex flex-wrap items-center gap-3"><div className="relative min-w-[200px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-10 pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search region or administrative location" /></div>{role !== "REGIONAL_EDITOR" && <Button onClick={add}><Plus className="mr-2 h-4 w-4" /> Add Region</Button>}</div>
    <Card><CardContent className="p-0">{loading ? <div className="flex justify-center py-14"><Loader2 className="h-6 w-6 animate-spin" /></div> : visible.length === 0 ? <div className="py-14 text-center text-sm text-muted-foreground"><MapPin className="mx-auto mb-2 h-8 w-8 opacity-40" />No regions match this search.</div> :
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-secondary/40 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Region</th><th className="px-4 py-3">Administrative location</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border">{visible.map((region) => <tr key={region.id} className="hover:bg-secondary/30"><td className="px-4 py-3"><div className="font-medium">{region.name}</div><div className="text-xs text-muted-foreground">/{region.slug}{region.englishName ? ` · ${region.englishName}` : ""}</div></td><td className="px-4 py-3 text-xs text-muted-foreground">{[region.district, region.administrativeRegion].filter(Boolean).join(" · ") || ""}</td><td className="px-4 py-3"><Badge variant={region.status === "PUBLISHED" ? "default" : "secondary"}>{region.status}</Badge></td><td className="px-4 py-3"><div className="flex justify-end gap-1">{region.status === "PUBLISHED" && <Button asChild size="icon" variant="ghost" aria-label={`View ${region.name}`}><a href={`/en/regions/${region.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>}<Button size="icon" variant="ghost" onClick={() => edit(region)} aria-label={`Edit ${region.name}`}><Pencil className="h-4 w-4" /></Button>{role !== "REGIONAL_EDITOR" && region.status !== "ARCHIVED" && <Button size="icon" variant="ghost" onClick={() => archive(region)} aria-label={`Archive ${region.name}`}><Archive className="h-4 w-4" /></Button>}</div></td></tr>)}</tbody></table></div>}
    </CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit Region" : "Add Region"}</DialogTitle><DialogDescription>Enter the region’s information and contact details.</DialogDescription></DialogHeader><div className="space-y-5 py-2">
      <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"><h3 className="text-sm font-semibold sm:col-span-2">Identity and publication</h3>{field("English name", "englishName")}{field("URL slug *", "slug")}
        <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(value) => change("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["DRAFT","PUBLISHED","ARCHIVED"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
        {field("Display order", "sortOrder")}</section>
      <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"><h3 className="text-sm font-semibold sm:col-span-2">Administrative location</h3>{field("Administrative region (mkoa)", "administrativeRegion")}{field("District", "district")}</section>
      <section className="rounded-lg border p-4"><h3 className="mb-4 text-sm font-semibold">Region name, public information and translations</h3><TranslationTabs active={locale} onChange={setLocale}>{() => <div className="grid gap-4 sm:grid-cols-2">{<div className="space-y-1.5"><Label>Region name {locale === "en" ? "*" : ""}</Label><Input value={locale === "en" ? form.name : translations?.[locale]?.name || ""} onChange={e => locale === "en" ? change("name", e.target.value) : setTranslations(current => ({ ...current, [locale]: { ...(current[locale] || {}), name: e.target.value } }))} /></div>}{trArea("Overview", "overview")}{trArea("History", "history")}{trArea("Leadership (one per line: Position | Full name)", "leadership", "Chairperson | Name")}{trArea("Activities (one per line)", "activities")}{trArea("Branches (one per line: Branch | Location note)", "branches", "Branch name | Ward or town")}</div>}</TranslationTabs></section>
      <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"><h3 className="text-sm font-semibold sm:col-span-2">Contact and image</h3>{field("Email", "email")}{field("Phone", "phone")}{field("Contact address", "contact")}{field("Official website", "website", "https://")}<AdminImageUpload entity="region" value={form.image || ""} onChange={(url) => change("image", url)} label="Region image" /></section>
    </div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Save changes" : "Save region"}</Button></DialogFooter></DialogContent></Dialog>
  </div>
}
