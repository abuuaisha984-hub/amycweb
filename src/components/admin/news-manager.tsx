"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
import { TranslationTabs, getTrField, setTrField } from "@/components/admin/translation-tabs"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, Newspaper, Search, Bold, Italic, Heading2, List, Link as LinkIcon, Quote } from "lucide-react"
import { ARTICLE_STATUSES } from "@/components/admin/nav-config"
import { type Locale } from "@/lib/i18n"
import { allowedArticleTransitions, type ArticleWorkflowStatus } from "@/lib/article-workflow"
import { AdminImageUpload } from "@/components/admin/image-upload"
import { AdminPageControls } from "@/components/admin/admin-page-controls"

type Article = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  kind: string
  category: string | null
  author: string | null
  status: ArticleWorkflowStatus
  featured: boolean
  featuredImage: string | null
  imageCredit: string | null
  scope: string
  scopeRegionId: string | null
  publishedAt: string | null
  expiresAt: string | null
  translations: string | null
  createdAt: string
}

const EMPTY = {
  title: "", excerpt: "", content: "", kind: "NEWS", category: "", author: "",
  status: "DRAFT", featured: false, featuredImage: "", imageCredit: "", scope: "HQ", scopeRegionId: "",
  publishedAt: "", expiresAt: "",
}

function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function parseTr(raw: string | null): Record<string, any> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

export function NewsManager({ role, regions }: { role: string; regions: Array<{ id: string; name: string }> }) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<Article | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [tr, setTr] = useState<Record<string, any>>({})
  const [langTab, setLangTab] = useState<Locale>("en")
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  function insertMarkup(prefix: string, suffix = prefix, placeholder = "text") {
    const editor = editorRef.current
    const current = langTab === "en" ? form.content : getTrField(tr, langTab, "content")
    const start = editor?.selectionStart ?? current.length
    const end = editor?.selectionEnd ?? current.length
    const selected = current.slice(start, end) || placeholder
    const next = `${current.slice(0, start)}${prefix}${selected}${suffix}${current.slice(end)}`
    if (langTab === "en") setForm((value: typeof form) => ({ ...value, content: next }))
    else setTr((value) => setTrField(value, langTab, "content", next))
    requestAnimationFrame(() => {
      editor?.focus()
      const selectionStart = start + prefix.length
      editor?.setSelectionRange(selectionStart, selectionStart + selected.length)
    })
  }

  function insertLinePrefix(prefix: string) {
    const editor = editorRef.current
    const current = langTab === "en" ? form.content : getTrField(tr, langTab, "content")
    const start = editor?.selectionStart ?? current.length
    const lineStart = current.lastIndexOf("\n", Math.max(0, start - 1)) + 1
    const next = `${current.slice(0, lineStart)}${prefix}${current.slice(lineStart)}`
    if (langTab === "en") setForm((value: typeof form) => ({ ...value, content: next }))
    else setTr((value) => setTrField(value, langTab, "content", next))
    requestAnimationFrame(() => {
      editor?.focus()
      editor?.setSelectionRange(start + prefix.length, start + prefix.length)
    })
  }

  function insertLink() {
    const href = window.prompt("Enter an HTTPS web address or an internal path starting with /")
    if (href?.trim()) insertMarkup("[", `](${href.trim()})`, "link text")
  }

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) })
    if (statusFilter !== "ALL") params.set("status", statusFilter)
    if (q.trim()) params.set("q", q.trim().slice(0, 120))
    const res = await fetch(`/api/admin/news?${params}`)
    const data = await res.json()
    setArticles(data.articles || [])
    setPage(data.pagination?.page || 1)
    setTotalPages(data.pagination?.totalPages || 1)
    setLoading(false)
  }, [page, q, statusFilter])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void load() }, q ? 250 : 0)
    return () => window.clearTimeout(initialLoad)
  }, [load])

  function openNew() {
    setEditing(null)
    setForm({ ...EMPTY, scope: role === "REGIONAL_EDITOR" ? "REGION" : "HQ", scopeRegionId: regions.length === 1 ? regions[0].id : "" })
    setTr({})
    setLangTab("en")
    setOpen(true)
  }
  function openEdit(a: Article) {
    setEditing(a)
    setForm({
      title: a.title, excerpt: a.excerpt, content: a.content, kind: a.kind,
      category: a.category || "", author: a.author || "", status: a.status,
      featured: a.featured, featuredImage: a.featuredImage || "", imageCredit: a.imageCredit || "",
      scope: a.scope,
      scopeRegionId: a.scopeRegionId || "",
      publishedAt: a.publishedAt ? a.publishedAt.slice(0, 10) : "",
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : "",
    })
    setTr(parseTr(a.translations))
    setLangTab("en")
    setOpen(true)
  }

  async function save() {
    const enteredFields = langTab === "en"
      ? { title: form.title, excerpt: form.excerpt, content: form.content }
      : {
          title: getTrField(tr, langTab, "title"),
          excerpt: getTrField(tr, langTab, "excerpt"),
          content: getTrField(tr, langTab, "content"),
        }
    const englishFields = { title: form.title, excerpt: form.excerpt, content: form.content }
    const isComplete = (fields: typeof englishFields) => Boolean(fields.title.trim() && fields.excerpt.trim() && fields.content.trim())
    const contentFields = isComplete(englishFields) ? englishFields : enteredFields
    if (!isComplete(contentFields)) {
      const language = langTab === "sw" ? "Kiswahili" : langTab === "ar" ? "Arabic" : "English"
      toast.error(`Enter a title, short summary and full content in ${language}.`)
      return
    }
    const primaryFields = {
      title: contentFields.title.trim(),
      excerpt: contentFields.excerpt.trim(),
      content: contentFields.content.trim(),
    }
    setSaving(true)
    try {
      const translations = langTab === "en" ? tr : {
        ...tr,
        [langTab]: { ...tr[langTab], ...enteredFields },
      }
      const payload = { ...form, ...primaryFields, translations: JSON.stringify(translations) }
      const url = editing ? `/api/admin/news/${editing.id}` : "/api/admin/news"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.article?.status === "PUBLISHED" ? "Article published." : editing ? "Article updated." : "Draft saved.")
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
    if (!confirm(`Delete "${a.title}"? This removes it from the website and admin list.`)) return
    const res = await fetch(`/api/admin/news/${a.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Article deleted.")
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
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || "Could not change the article status.")
    }
  }

  const filtered = articles.filter((a) => {
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false
    if (q && !a.title.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const statusColor: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PUBLISHED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  }

  // Check translation status for display
  function trStatus(a: Article): { sw: boolean; ar: boolean } {
    const t = parseTr(a.translations)
    return {
      sw: !!(t.sw?.title && t.sw?.excerpt && t.sw?.content),
      ar: !!(t.ar?.title && t.ar?.excerpt && t.ar?.content),
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search articles…" className="pl-9 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
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
                    <th className="px-4 py-3 text-center font-medium">SW</th>
                    <th className="px-4 py-3 text-center font-medium">AR</th>
                    <th className="px-4 py-3 text-left font-medium">Published</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((a) => {
                    const ts = trStatus(a)
                    return (
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
                        <td className="px-4 py-3"><Badge variant="outline" className="text-[0.65rem]">News</Badge></td>
                        <td className="px-4 py-3">
                          <Select value={a.status} onValueChange={(v) => quickStatus(a, v)}>
                            <SelectTrigger className="h-7 w-[120px] border-0 p-0">
                              <Badge className={`${statusColor[a.status]} text-[0.65rem]`} variant="secondary">{a.status}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {[a.status, ...allowedArticleTransitions(a.status)].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-bold ${ts.sw ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{ts.sw ? "✓" : "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-bold ${ts.ar ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{ts.ar ? "✓" : "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(a.publishedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => remove(a)} aria-label={`Delete ${a.title}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <AdminPageControls page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Editor dialog with translation tabs */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Article" : "New Article"}</DialogTitle>
            <DialogDescription>{editing ? "Update the news item details below." : "Create a news item in English, Kiswahili, or Arabic. Use the language tabs to add translations if available."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* General info (shared across languages) */}
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">General Information</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <div className="flex h-10 items-center"><Badge variant="secondary">News</Badge></div>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(editing
                        ? [editing.status, ...allowedArticleTransitions(editing.status)]
                        : ["DRAFT", "PUBLISHED"]
                      ).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Da'wah, Education" />
                </div>
                <div className="space-y-1.5">
                  <Label>Author</Label>
                  <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author / department" />
                </div>
                <div className="space-y-1.5">
                  <Label>Publish date</Label>
                  <Input type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry date (optional)</Label>
                  <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
                </div>
                <AdminImageUpload entity="article" value={form.featuredImage} onChange={(url) => setForm({ ...form, featuredImage: url })} label="Featured image" />
                <div className="space-y-1.5">
                  <Label>Image credit</Label>
                  <Input value={form.imageCredit} onChange={(e) => setForm({ ...form, imageCredit: e.target.value })} placeholder="Photographer / source" />
                </div>
                <div className="space-y-1.5">
                  <Label>Scope</Label>
                  <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(role === "REGIONAL_EDITOR" ? ["REGION"] : ["HQ", "REGION", "SCHOOL", "PROGRAMME"]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {form.scope === "REGION" && <div className="space-y-1.5 sm:col-span-2">
                  <Label>Region</Label>
                  <Select value={form.scopeRegionId || ""} onValueChange={(v) => setForm({ ...form, scopeRegionId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select a region" /></SelectTrigger>
                    <SelectContent>{regions.map((region) => <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>}
                <div className="flex items-center gap-2 rounded-lg border border-border p-3 sm:col-span-2">
                  <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} id="featured" />
                  <Label htmlFor="featured" className="cursor-pointer text-sm">Feature this article on the homepage</Label>
                </div>
              </div>
            </div>

            {/* Content with language tabs */}
            <div className="rounded-lg border border-border p-4">
              <TranslationTabs active={langTab} onChange={setLangTab}>
                {(locale) => (
                  <div className="space-y-4">
                    {locale === "en" ? (
                      <>
                        <div className="space-y-1.5">
                          <Label>Title (English){langTab === "en" ? " *" : ""}</Label>
                          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Article title" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Excerpt (English){langTab === "en" ? " *" : ""}</Label>
                          <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Short summary shown in cards" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Content (English){langTab === "en" ? " *" : ""}</Label>
                          <div className="mb-2 flex flex-wrap gap-1" role="toolbar" aria-label="Article formatting">
                            <Button type="button" size="sm" variant="outline" aria-label="Bold" title="Bold" onClick={() => insertMarkup("**")}><Bold className="h-4 w-4" /></Button>
                            <Button type="button" size="sm" variant="outline" aria-label="Italic" title="Italic" onClick={() => insertMarkup("*")}><Italic className="h-4 w-4" /></Button>
                            <Button type="button" size="sm" variant="outline" aria-label="Heading" title="Heading" onClick={() => insertLinePrefix("## ")}><Heading2 className="h-4 w-4" /></Button>
                            <Button type="button" size="sm" variant="outline" aria-label="Bulleted list" title="Bulleted list" onClick={() => insertLinePrefix("- ")}><List className="h-4 w-4" /></Button>
                            <Button type="button" size="sm" variant="outline" aria-label="Link" title="Link" onClick={insertLink}><LinkIcon className="h-4 w-4" /></Button>
                            <Button type="button" size="sm" variant="outline" aria-label="Quote" title="Quote" onClick={() => insertLinePrefix("> ")}><Quote className="h-4 w-4" /></Button>
                          </div>
                          <Textarea ref={editorRef} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={9} placeholder="Write the story here. Use the toolbar to format it." />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <Label>Title ({locale === "sw" ? "Kiswahili" : "العربية"}){langTab === locale && (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) ? " *" : ""}</Label>
                          <Input
                            value={getTrField(tr, locale, "title")}
                            onChange={(e) => setTr((t) => setTrField(t, locale, "title", e.target.value))}
                            placeholder={locale === "sw" ? "Kichwa cha habari" : "العنوان"}
                            dir={locale === "ar" ? "rtl" : "ltr"}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Excerpt ({locale === "sw" ? "Kiswahili" : "العربية"}){langTab === locale && (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) ? " *" : ""}</Label>
                          <Textarea
                            value={getTrField(tr, locale, "excerpt")}
                            onChange={(e) => setTr((t) => setTrField(t, locale, "excerpt", e.target.value))}
                            rows={2}
                            placeholder={locale === "sw" ? "Muhtasari" : "الملخص"}
                            dir={locale === "ar" ? "rtl" : "ltr"}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Content ({locale === "sw" ? "Kiswahili" : "العربية"}){langTab === locale && (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) ? " *" : ""}</Label>
                          <div className="mb-2 flex flex-wrap gap-1" role="toolbar" aria-label="Article formatting">
                            <Button type="button" size="sm" variant="outline" aria-label="Bold" title="Bold" onClick={() => insertMarkup("**")}><Bold className="h-4 w-4" /></Button>
                            <Button type="button" size="sm" variant="outline" aria-label="Italic" title="Italic" onClick={() => insertMarkup("*")}><Italic className="h-4 w-4" /></Button>
                            <Button type="button" size="sm" variant="outline" aria-label="Heading" title="Heading" onClick={() => insertLinePrefix("## ")}><Heading2 className="h-4 w-4" /></Button>
                            <Button type="button" size="sm" variant="outline" aria-label="Bulleted list" title="Bulleted list" onClick={() => insertLinePrefix("- ")}><List className="h-4 w-4" /></Button>
                            <Button type="button" size="sm" variant="outline" aria-label="Link" title="Link" onClick={insertLink}><LinkIcon className="h-4 w-4" /></Button>
                            <Button type="button" size="sm" variant="outline" aria-label="Quote" title="Quote" onClick={() => insertLinePrefix("> ")}><Quote className="h-4 w-4" /></Button>
                          </div>
                          <Textarea
                            ref={editorRef}
                            value={getTrField(tr, locale, "content")}
                            onChange={(e) => setTr((t) => setTrField(t, locale, "content", e.target.value))}
                            rows={6}
                            placeholder={locale === "sw" ? "Maudhui kamili" : "المحتوى الكامل"}
                            dir={locale === "ar" ? "rtl" : "ltr"}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </TranslationTabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-primary" disabled={saving}>
              {saving ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…</> : form.status === "PUBLISHED" ? "Publish" : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
