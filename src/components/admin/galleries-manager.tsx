"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Image as ImageIcon, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AdminImageUpload } from "@/components/admin/image-upload"
import { ImageWithFallback } from "@/components/site/image-with-fallback"
import { AdminPageControls } from "@/components/admin/admin-page-controls"

type GalleryItem = { id?: string; mediaUrl: string; caption: string | null; sortOrder?: number }
type Gallery = { id: string; title: string; slug: string; description: string | null; category: string | null; coverImage: string | null; status: string; items: GalleryItem[] }
const EMPTY = { title: "", slug: "", description: "", category: "", coverImage: "", status: "DRAFT" }
const slugify = (value: string) => value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

export function GalleriesManager() {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<Gallery | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [items, setItems] = useState<GalleryItem[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (query.trim()) params.set("q", query.trim().slice(0, 120))
      const response = await fetch(`/api/admin/galleries?${params}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load galleries.")
      setGalleries(data.galleries || [])
      setPage(data.pagination?.page || 1)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load galleries.")
    } finally {
      setLoading(false)
    }
  }, [page, query])

  useEffect(() => { const timer = window.setTimeout(() => { void load() }, query ? 250 : 0); return () => window.clearTimeout(timer) }, [load, query])

  function change(key: keyof typeof EMPTY, value: string) {
    setForm((current) => ({ ...current, [key]: value, ...(key === "title" && !editing ? { slug: slugify(value) } : {}) }))
  }

  function add() {
    setEditing(null)
    setForm({ ...EMPTY })
    setItems([])
    setOpen(true)
  }

  function edit(gallery: Gallery) {
    setEditing(gallery)
    setForm({ title: gallery.title, slug: gallery.slug, description: gallery.description || "", category: gallery.category || "", coverImage: gallery.coverImage || "", status: gallery.status })
    setItems(gallery.items.map((item, sortOrder) => ({ ...item, caption: item.caption || "", sortOrder })))
    setOpen(true)
  }

  function addImage(url: string) {
    if (!url) return
    if (items.length >= 100) { toast.error("A gallery can contain up to 100 images."); return }
    setItems((current) => [...current, { mediaUrl: url, caption: "", sortOrder: current.length }])
    setForm((current) => ({ ...current, coverImage: current.coverImage || url }))
  }

  function removeImage(index: number) {
    const removed = items[index]
    const remaining = items.filter((_, itemIndex) => itemIndex !== index).map((item, sortOrder) => ({ ...item, sortOrder }))
    setItems(remaining)
    if (removed?.mediaUrl === form.coverImage) {
      setForm((current) => ({ ...current, coverImage: remaining[0]?.mediaUrl || "" }))
    }
  }

  function moveImage(index: number, offset: -1 | 1) {
    setItems((current) => {
      const target = index + offset
      if (target < 0 || target >= current.length) return current
      const reordered = [...current]
      ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
      return reordered.map((item, sortOrder) => ({ ...item, sortOrder }))
    })
  }

  async function save() {
    if (!form.title.trim() || !form.slug.trim()) { toast.error("Enter the gallery title and URL slug."); return }
    setSaving(true)
    try {
      const response = await fetch(editing ? `/api/admin/galleries/${editing.id}` : "/api/admin/galleries", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "The gallery could not be saved.")
      toast.success(editing ? "Gallery updated successfully." : "Gallery created successfully.")
      setOpen(false)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The gallery could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  async function archive(gallery: Gallery) {
    if (!window.confirm(`Delete “${gallery.title}” and all its media records? This cannot be undone.`)) return
    try {
      const response = await fetch(`/api/admin/galleries/${gallery.id}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Could not archive gallery.")
      toast.success("Gallery deleted successfully.")
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete gallery.")
    }
  }

  const visible = galleries

  return <div>
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search galleries" className="h-10 pl-9" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search galleries by title or category" /></div>
      <Button onClick={add}><Plus className="mr-2 h-4 w-4" /> Add gallery</Button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {loading ? <div className="col-span-full flex justify-center py-14"><Loader2 className="h-6 w-6 animate-spin" /></div> : visible.length === 0 ? <div className="col-span-full rounded-xl border border-dashed py-14 text-center text-sm text-muted-foreground"><ImageIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />No galleries match this search.</div> : visible.map((gallery) => <Card key={gallery.id} className="overflow-hidden">
        <div className="aspect-[16/9] bg-secondary">{gallery.coverImage ? <ImageWithFallback src={gallery.coverImage} alt="" className="h-full w-full object-cover" fallback={<ImageIcon className="h-7 w-7" />} /> : <div className="grid h-full place-items-center text-muted-foreground"><ImageIcon className="h-7 w-7" /></div>}</div>
        <CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-serif font-semibold">{gallery.title}</h3><p className="mt-1 text-xs text-muted-foreground">{gallery.items.length} images{gallery.category ? ` · ${gallery.category}` : ""}</p></div><Badge variant={gallery.status === "PUBLISHED" ? "default" : "secondary"}>{gallery.status}</Badge></div><div className="mt-4 flex justify-end gap-1"><Button size="sm" variant="outline" onClick={() => edit(gallery)}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Button><Button size="icon" variant="ghost" aria-label={`Delete ${gallery.title}`} onClick={() => void archive(gallery)}><Trash2 className="h-4 w-4" /></Button></div></CardContent>
      </Card>)}
    </div>
    <AdminPageControls page={page} totalPages={totalPages} onPageChange={setPage} />

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit gallery" : "Create a gallery"}</DialogTitle><DialogDescription>Upload images, add captions, and save the album details. Uploaded images are optimized automatically.</DialogDescription></DialogHeader>
        <div className="space-y-5 py-2">
          <section className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 sm:p-5">
            <h3 className="text-sm font-semibold sm:col-span-2">Album details</h3>
            <div className="space-y-1.5"><Label htmlFor="gallery-title">Gallery title *</Label><Input id="gallery-title" value={form.title} onChange={(event) => change("title", event.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="gallery-slug">URL slug *</Label><Input id="gallery-slug" value={form.slug} disabled={!!editing} onChange={(event) => change("slug", event.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="gallery-category">Category</Label><Input id="gallery-category" value={form.category} placeholder="Events, Schools, Community" onChange={(event) => change("category", event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(value) => change("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["DRAFT", "PUBLISHED"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
            <AdminImageUpload entity="media" value={form.coverImage} onChange={(url) => change("coverImage", url)} label="Gallery cover image" />
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="gallery-description">Description</Label><Textarea id="gallery-description" rows={3} value={form.description} onChange={(event) => change("description", event.target.value)} /></div>
          </section>
          <section className="space-y-4 rounded-xl border bg-background p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold">Gallery images</h3><p className="mt-1 text-xs text-muted-foreground">Upload, caption and review images before saving.</p></div><Badge variant="secondary">{items.length} / 100</Badge></div>
            <AdminImageUpload entity="media" value="" onChange={addImage} label="Choose an image to upload" disabled={items.length >= 100} />
            {items.length ? <div className="grid gap-3 sm:grid-cols-2">{items.map((item, index) => <div key={item.id || `${item.mediaUrl}-${index}`} className="overflow-hidden rounded-lg border bg-card"><ImageWithFallback src={item.mediaUrl} alt={item.caption || `Gallery image ${index + 1}`} className="aspect-[16/9] w-full bg-secondary object-cover" /><div className="flex gap-2 p-2"><Input aria-label={`Caption for image ${index + 1}`} value={item.caption || ""} placeholder="Caption (optional)" onChange={(event) => setItems((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, caption: event.target.value } : candidate))} /><Button type="button" size="icon" variant="ghost" aria-label={`Move image ${index + 1} up`} disabled={index === 0} onClick={() => moveImage(index, -1)}><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" aria-label={`Move image ${index + 1} down`} disabled={index === items.length - 1} onClick={() => moveImage(index, 1)}><ArrowDown className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" aria-label={`Remove image ${index + 1}`} onClick={() => removeImage(index)}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div> : <div className="rounded-lg bg-secondary/40 px-4 py-8 text-center text-sm text-muted-foreground">No images added yet. Choose an image above; it will appear here for review.</div>}
          </section>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button><Button onClick={() => void save()} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{form.status === "PUBLISHED" ? "Publish Gallery" : "Save Draft"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
}
