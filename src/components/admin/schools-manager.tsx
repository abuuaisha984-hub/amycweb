"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Pencil, Plus, Search, Archive, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminImageUpload } from "@/components/admin/image-upload"
import { TranslationTabs, getTrField, setTrField } from "@/components/admin/translation-tabs"
import { type Locale } from "@/lib/i18n"

type School = {
  id: string; slug: string; name: string; shortName: string | null; type: string; category: string | null; level: string | null; jimboId: string | null; jimbo?: { id: string; name: string; administrativeRegion: string | null } | null
  gender: string | null; medium: string | null; region: string | null; district: string | null; ward: string | null; address: string | null
  email: string | null; phone: string | null
  about: string; history: string | null; facilities: string; levelsOffered: string; website: string | null; logo: string | null
  image: string | null; status: string; sortOrder: number; translations: string
}

const EMPTY = {
  name: "", slug: "", shortName: "", type: "PRIMARY", category: "", level: "", gender: "", medium: "", region: "", jimboId: "", district: "", ward: "", address: "", email: "", phone: "",
  about: "", history: "", facilities: "", levelsOffered: "", website: "", logo: "", image: "",
  status: "DRAFT", sortOrder: "0", translations: "{}",
}

function parseArray(value: string) { try { const out = JSON.parse(value); return Array.isArray(out) ? out.join("\n") : "" } catch { return "" } }
function parseTranslations(value: string) { try { return JSON.parse(value) } catch { return {} } }
function slugify(value: string) { return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }

export function SchoolsManager() {
  const [schools, setSchools] = useState<School[]>([])
  const [jimbos, setJimbos] = useState<Array<{ id: string; name: string; administrativeRegion: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<School | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>(EMPTY)
  const [translations, setTranslations] = useState<Record<string, any>>({})
  const [locale, setLocale] = useState<Locale>("en")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/schools")
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load schools.")
      setSchools(data.schools || [])
      setJimbos(data.regions || [])
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load schools.") }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [load])

  function newSchool() { setEditing(null); setForm({ ...EMPTY }); setTranslations({}); setLocale("en"); setOpen(true) }
  function editSchool(school: School) {
    setEditing(school)
    setTranslations(parseTranslations(school.translations))
    setLocale("en")
    setForm(Object.fromEntries(Object.keys(EMPTY).map((key) => {
      const value = (school as unknown as Record<string, unknown>)[key]
      if (key === "facilities" || key === "levelsOffered") return [key, parseArray(String(value || "[]"))]
      return [key, value == null ? "" : String(value)]
    })))
    setOpen(true)
  }
  function change(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value, ...(key === "name" && !editing ? { slug: slugify(value) } : {}) }))
  }
  async function save() {
    if (!form.name.trim() || !form.slug.trim()) { toast.error("Enter the school name and URL slug."); return }
    setSaving(true)
    try {
      const payload = { ...form, translations: JSON.stringify(translations), sortOrder: Number(form.sortOrder) || 0,
        facilities: form.facilities.split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
        levelsOffered: form.levelsOffered.split(/\r?\n/).map((x) => x.trim()).filter(Boolean) }
      const response = await fetch(editing ? `/api/admin/schools/${editing.id}` : "/api/admin/schools", {
        method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "The school could not be saved.")
      toast.success(editing ? "School updated." : "School saved.")
      setOpen(false); await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : "The school could not be saved.") }
    finally { setSaving(false) }
  }
  async function archive(school: School) {
    if (!window.confirm(`Archive “${school.name}”? It will disappear from the active school directory; its record will remain in the admin archive.`)) return
    const response = await fetch(`/api/admin/schools/${school.id}`, { method: "DELETE" })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) { toast.error(data.error || "Could not archive school."); return }
    toast.success("School archived."); await load()
  }

  const visible = schools.filter((school) => `${school.name} ${school.jimbo?.name || ""} ${school.region || ""} ${school.district || ""}`.toLowerCase().includes(query.toLowerCase()))
  const field = (label: string, key: string, placeholder = "", type = "text") => <div className="space-y-1.5" key={key}><Label htmlFor={`school-${key}`}>{label}</Label><Input id={`school-${key}`} type={type} value={form[key] || ""} placeholder={placeholder} disabled={key === "slug" && !!editing} onChange={(e) => change(key, e.target.value)} /></div>
  const languageLabel = locale === "en" ? "English" : locale === "sw" ? "Kiswahili" : "العربية"
  const localizedInput = (key: string, label: string) => <div className="space-y-1.5" key={key}><Label htmlFor={`school-${locale}-${key}`}>{label} ({languageLabel}){key === "name" && locale === "en" ? " *" : ""}</Label><Input id={`school-${locale}-${key}`} dir={locale === "ar" ? "rtl" : "ltr"} value={locale === "en" ? form[key] || "" : getTrField(translations, locale, key)} onChange={(event) => locale === "en" ? change(key, event.target.value) : setTranslations((current) => setTrField(current, locale, key, event.target.value))} /></div>
  const localizedArea = (key: string, label: string, rows = 4) => <div className="space-y-1.5 sm:col-span-2" key={key}><Label htmlFor={`school-${locale}-${key}`}>{label} ({languageLabel})</Label><Textarea id={`school-${locale}-${key}`} dir={locale === "ar" ? "rtl" : "ltr"} rows={rows} value={locale === "en" ? form[key] || "" : getTrField(translations, locale, key)} onChange={(event) => locale === "en" ? change(key, event.target.value) : setTranslations((current) => setTrField(current, locale, key, event.target.value))} /></div>

  return <div>
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-10 pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search school, region or district" /></div>
      <Button onClick={newSchool} disabled={jimbos.length === 0}><Plus className="mr-2 h-4 w-4" /> Add School</Button>
    </div>
    {jimbos.length === 0 && !loading && <p className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">Create an AMYC Jimbo first, then assign the school to it. Government region (mkoa) is recorded separately.</p>}
    <Card><CardContent className="p-0">
      {loading ? <div className="flex justify-center py-14"><Loader2 className="h-6 w-6 animate-spin" /></div> : visible.length === 0 ? <p className="py-14 text-center text-sm text-muted-foreground">No schools match this search.</p> :
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-secondary/40 text-left text-xs uppercase text-muted-foreground"><tr>
          <th className="px-4 py-3">School</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
        </tr></thead><tbody className="divide-y divide-border">{visible.map((school) => <tr key={school.id} className="hover:bg-secondary/30">
          <td className="px-4 py-3"><div className="font-medium">{school.name}</div><div className="text-xs text-muted-foreground">/{school.slug}</div></td>
          <td className="px-4 py-3"><Badge variant="outline">{school.type}</Badge></td>
          <td className="px-4 py-3 text-xs text-muted-foreground">{[school.jimbo?.name, school.region, school.district].filter(Boolean).join(" · ") || "Information unavailable"}</td>
          <td className="px-4 py-3"><Badge variant={school.status === "PUBLISHED" ? "default" : "secondary"}>{school.status}</Badge></td>
          <td className="px-4 py-3"><div className="flex justify-end gap-1">{school.status === "PUBLISHED" && <Button asChild size="icon" variant="ghost" aria-label={`View ${school.name}`}><a href={`/en/education/${school.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>}<Button size="icon" variant="ghost" onClick={() => editSchool(school)} aria-label={`Edit ${school.name}`}><Pencil className="h-4 w-4" /></Button>{school.status !== "ARCHIVED" && <Button size="icon" variant="ghost" onClick={() => archive(school)} aria-label={`Archive ${school.name}`}><Archive className="h-4 w-4" /></Button>}</div></td>
        </tr>)}</tbody></table></div>}
    </CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit School" : "Add School"}</DialogTitle><DialogDescription>Enter the school’s information and contact details.</DialogDescription></DialogHeader>
      <div className="space-y-5 py-2">
        <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"><h3 className="text-sm font-semibold sm:col-span-2">Identity and publication</h3>{field("URL slug *", "slug", "school-name")}
          <div className="space-y-1.5"><Label>School type</Label><Select value={form.type} onValueChange={(value) => change("type", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[["MAAHAD","Maahad"],["PRIMARY","Primary"],["SECONDARY","Secondary"],["COLLEGE","College"],["UNIVERSITY","University"]].map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(value) => change("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["DRAFT","PUBLISHED","ARCHIVED"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
          {field("Display order", "sortOrder", "0", "number")}</section>
        <section className="rounded-lg border p-4"><TranslationTabs active={locale} onChange={setLocale}>{() => <div className="grid gap-4 sm:grid-cols-2" dir={locale === "ar" ? "rtl" : "ltr"}>{localizedInput("name", "School name")}{localizedInput("shortName", "Short name")}{localizedInput("category", "Category")}{localizedArea("about", "About")}{localizedArea("history", "History", 3)}</div>}</TranslationTabs></section>
        <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"><h3 className="text-sm font-semibold sm:col-span-2">Location and education</h3>
          <div className="space-y-1.5"><Label>AMYC Jimbo *</Label><Select value={form.jimboId || ""} onValueChange={(value) => change("jimboId", value)}><SelectTrigger><SelectValue placeholder="Select the institution's Jimbo" /></SelectTrigger><SelectContent>{jimbos.map((jimbo) => <SelectItem key={jimbo.id} value={jimbo.id}>{jimbo.name}{jimbo.administrativeRegion ? ` — ${jimbo.administrativeRegion}` : ""}</SelectItem>)}</SelectContent></Select></div>
          {field("Government region (mkoa)", "region")}{field("District", "district")}{field("Ward", "ward")}{field("Address", "address")}{field("Email", "email", "", "email")}{field("Phone number", "phone", "", "tel")}{field("Education level", "level")}{field("Gender", "gender")}{field("Language of instruction", "medium")}{field("Levels offered (one per line)", "levelsOffered")}{field("Facilities (one per line)", "facilities")}</section>
        <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"><h3 className="text-sm font-semibold sm:col-span-2">Profile and media</h3>{field("Official website", "website", "https://")}{field("Logo URL", "logo", "/images/...")}<AdminImageUpload entity="school" value={form.image || ""} onChange={(url) => change("image", url)} label="Featured school image" />
          </section>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Save changes" : "Save school"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>
}
