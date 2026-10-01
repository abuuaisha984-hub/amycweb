"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, Newspaper, Search } from "lucide-react"
import { ARTICLE_STATUSES, ARTICLE_KINDS } from "@/components/admin/nav-config"

type Article = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  kind: string
  category: string | null
  author: string | null
  status: string
  featured: boolean
  featuredImage: string | null
  imageCredit: string | null
  scope: string
  publishedAt: string | null
  expiresAt: string | null
  createdAt: string
}

const EMPTY = {
  title: "", excerpt: "", content: "", kind: "NEWS", category: "", author: "",
  status: "DRAFT", featured: false, featuredImage: "", imageCredit: "", scope: "HQ",
  publishedAt: "", expiresAt: "",
}

function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function NewsManager() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [editing, setEditing] = useState<Article | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/news")
    const data = await res.json()
    setArticles(data.articles || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }
  function openEdit(a: Article) {
    setEditing(a)
    setForm({
      title: a.title, excerpt: a.excerpt, content: a.content, kind: a.kind,
      category: a.category || "", author: a.author || "", status: a.status,
      featured: a.featured, featuredImage: a.featuredImage || "", imageCredit: a.imageCredit || "",
      scope: a.scope,
      publishedAt: a.publishedAt ? a.publishedAt.slice(0, 10) : "",
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : "",
    })
    setOpen(true)
  }

  async function save() {
    if (!form.title || !form.excerpt || !form.content) {
      toast.error("Title, excerpt and content are required.")
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/admin/news/${editing.id}` : "/api/admin/news"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(editing ? "Article updated." : "Article created.")
        setOpen(false)
        load()
      } else {
        toast.error(data.error || "Failed to save.")
      }
    } catch {
      toast.error("Network error.")
    } finally {
      setSaving(false)
    }
  }

  async function remove(a: Article) {
    if (!confirm(`Archive "${a.title}"? This will move it to archived (soft delete).`)) return
    const res = await fetch(`/api/admin/news/${a.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Article archived.")
      load()
    } else {
      toast.error("Failed to delete.")
    }
  }

  async function quickStatus(a: Article, status: string) {
    const res = await fetch(`/api/admin/news/${a.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, publishedAt: status === "PUBLISHED" && !a.publishedAt ? new Date().toISOString() : a.publishedAt }),
    })
    if (res.ok) {
      toast.success(`Status set to ${status}.`)
      load()
    }
  }

  const filtered = articles.filter((a) => {
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false
    if (q && !a.title.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const statusColor: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    PUBLISHED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    ARCHIVED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles…" className="pl-9 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ARTICLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="bg-primary h-10"><Plus className="mr-1.5 h-4 w-4" /> New Article</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Newspaper className="mx-auto mb-3 h-10 w-10 opacity-40" />
              No articles found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-secondary/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Kind</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Published</th>
                    <th className="px-4 py-3 text-left font-medium">Expires</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((a) => (
                    <tr key={a.id} className="transition hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{a.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{a.category || a.kind}</p>
                          </div>
                          {a.featured && <Badge className="bg-accent text-accent-foreground text-[0.6rem] shrink-0">Featured</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[0.65rem]">{a.kind}</Badge></td>
                      <td className="px-4 py-3">
                        <Select value={a.status} onValueChange={(v) => quickStatus(a, v)}>
                          <SelectTrigger className="h-7 w-[120px] border-0 p-0">
                            <Badge className={`${statusColor[a.status]} text-[0.65rem]`} variant="secondary">{a.status}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {ARTICLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(a.publishedAt)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(a.expiresAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => remove(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Article" : "New Article"}</DialogTitle>
            <DialogDescription>{editing ? "Update the article details below." : "Create a new news item or announcement."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Article title" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Kind</Label>
                <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ARTICLE_KINDS.map((k) => <SelectItem key={k} value={k}>{k === "NEWS" ? "News" : "Announcement"}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ARTICLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Da'wah, Education" />
              </div>
              <div className="space-y-1.5">
                <Label>Author</Label>
                <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author / department" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Excerpt *</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Short summary shown in cards" />
            </div>
            <div className="space-y-1.5">
              <Label>Content *</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} placeholder="Full article content. Use ## for headings." />
            </div>
            <div className="space-y-1.5">
              <Label>Featured image URL</Label>
              <Input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} placeholder="/images/news-…jpg" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Image credit</Label>
                <Input value={form.imageCredit} onChange={(e) => setForm({ ...form, imageCredit: e.target.value })} placeholder="Photographer / source" />
              </div>
              <div className="space-y-1.5">
                <Label>Scope</Label>
                <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["HQ", "REGION", "SCHOOL", "PROGRAMME"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Publish date</Label>
                <Input type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Expiry date (announcements)</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
                <p className="text-[0.65rem] text-muted-foreground">When reached, the item auto-archives (not deleted).</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border p-3">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} id="featured" />
              <Label htmlFor="featured" className="cursor-pointer text-sm">Feature this article on the homepage</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-primary" disabled={saving}>
              {saving ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…</> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
