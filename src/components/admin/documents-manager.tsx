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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { AdminPageControls } from "@/components/admin/admin-page-controls"
import { publicAssetUrl } from "@/lib/public-asset-url"
import { Upload, Trash2, Loader2, FileText, Download, ShieldCheck, Archive, Pencil, Tags } from "lucide-react"

type Doc = {
  id: string
  title: string
  description: string
  category: string
  fileType: string
  filePath: string
  fileSize: number
  author: string | null
  createdAt: string
  status: string
}

type Category = { id: string; name: string; active: boolean }

export function DocumentsManager() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", category: "", author: "", department: "", status: "DRAFT", file: null as File | null })
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [savingCategory, setSavingCategory] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [docsRes, categoriesRes] = await Promise.all([fetch(`/api/admin/documents?page=${page}`), fetch("/api/admin/document-categories")])
      const [docsData, categoriesData] = await Promise.all([docsRes.json(), categoriesRes.json()])
      if (!docsRes.ok || !categoriesRes.ok) throw new Error(docsData.error || categoriesData.error || "Could not load document records.")
      setDocs(docsData.documents || [])
      setPage(docsData.pagination?.page || 1)
      setTotalPages(docsData.pagination?.totalPages || 1)
      setTotalDocuments(docsData.pagination?.total || 0)
      setCategories(categoriesData.categories || [])
      setForm((current) => ({ ...current, category: current.category || categoriesData.categories?.find((item: Category) => item.active)?.name || "" }))
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load documents.") }
    finally { setLoading(false) }
  }, [page])
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [load])

  async function upload() {
    if (!form.title || !form.file) {
      toast.error("Title and file are required.")
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append("title", form.title)
    fd.append("description", form.description)
    fd.append("category", form.category)
    fd.append("author", form.author)
    fd.append("department", form.department)
    fd.append("status", form.status)
    fd.append("file", form.file)
    try {
      const res = await fetch("/api/admin/documents", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok) {
        toast.success(form.status === "PUBLISHED" ? "Document uploaded and published." : "Document uploaded as a draft.")
        setOpen(false)
        setForm({ title: "", description: "", category: categories.find((item) => item.active)?.name || "", author: "", department: "", status: "DRAFT", file: null })
        load()
      } else {
        toast.error(data.error || "Upload failed.")
      }
    } catch {
      toast.error("Network error.")
    } finally {
      setUploading(false)
    }
  }

  async function remove(d: Doc) {
    if (!confirm(`Delete "${d.title}"? This removes it from the public documents list.`)) return
    const res = await fetch(`/api/admin/documents/${d.id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Document deleted."); load() } else { toast.error("Failed.") }
  }

  async function changeStatus(doc: Doc, status: string) {
    const res = await fetch(`/api/admin/documents/${doc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { toast.error(data.error || "Could not update document status."); return }
    toast.success(`Document ${status.toLowerCase()}.`); load()
  }

  async function saveCategory() {
    if (categoryName.trim().length < 2) { toast.error("Category name must have at least two characters."); return }
    setSavingCategory(true)
    try {
      const res = await fetch(editingCategory ? `/api/admin/document-categories/${editingCategory.id}` : "/api/admin/document-categories", {
        method: editingCategory ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: categoryName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Category could not be saved.")
      if (editingCategory && form.category === editingCategory.name) setForm((current) => ({ ...current, category: categoryName.trim() }))
      toast.success(editingCategory ? "Category renamed." : "Category added.")
      setCategoryName(""); setEditingCategory(null); await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : "Category could not be saved.") }
    finally { setSavingCategory(false) }
  }

  async function toggleCategory(category: Category) {
    const action = category.active ? "archive" : "restore"
    if (!confirm(`${action === "archive" ? "Archive" : "Restore"} category “${category.name}”?`)) return
    const res = await fetch(`/api/admin/document-categories/${category.id}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { toast.error(data.error || "Could not update category."); return }
    toast.success(`Category ${action}d.`); await load()
  }

  function fmtSize(b: number) {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
    return `${(b / 1024 / 1024).toFixed(1)} MB`
  }
  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{totalDocuments} documents · Max 25MB · PDF, DOC, XLS, PPT, ZIP, images</p>
        <div className="flex gap-2"><Button variant="outline" onClick={() => setCategoriesOpen(true)}><Tags className="mr-1.5 h-4 w-4" /> Categories</Button><Button onClick={() => setOpen(true)} className="bg-primary"><Upload className="mr-1.5 h-4 w-4" /> Upload Document</Button></div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : docs.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" /> No documents yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-secondary/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Size</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {docs.map((d) => (
                    <tr key={d.id} className="transition hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{d.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{d.description}</p>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[0.65rem]">{d.category}</Badge></td>
                      <td className="px-4 py-3 uppercase text-xs">{d.fileType}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtSize(d.fileSize)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(d.createdAt)}</td>
                      <td className="px-4 py-3"><Select value={d.status} onValueChange={(status) => changeStatus(d, status)}><SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger><SelectContent>{["DRAFT", "PUBLISHED"].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <a href={publicAssetUrl(d.filePath)} download className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent/20"><Download className="h-3.5 w-3.5 text-primary" /></a>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => remove(d)} aria-label={`Delete ${d.title}`}><Trash2 className="h-3.5 w-3.5" /></Button>
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
      <AdminPageControls page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Secure upload with MIME validation and generated filenames.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Document title" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.filter((category) => category.active).map((category) => <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Author</Label>
                <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Department / author" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Publication status</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="PUBLISHED">Published</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5">
              <Label>File * (max 25MB)</Label>
              <Input type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} />
              {form.file && <p className="text-xs text-muted-foreground">{form.file.name} · {(form.file.size / 1024).toFixed(0)} KB · {form.file.type}</p>}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              Allowed: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, ZIP, PNG/JPG/WEBP. Filenames are randomised to prevent path traversal.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={upload} className="bg-primary" disabled={uploading}>
              {uploading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="mr-1.5 h-4 w-4" /> {form.status === "PUBLISHED" ? "Upload and Publish" : "Upload Draft"}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>Document Categories</DialogTitle><DialogDescription>Add categories for new uploads, rename them while keeping existing documents linked, or archive and restore a category.</DialogDescription></DialogHeader>
          <div className="flex gap-2"><Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="New category name" /><Button onClick={saveCategory} disabled={savingCategory}>{savingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCategory ? "Save" : "Add"}</Button></div>
          <div className="divide-y rounded-md border">{categories.map((category) => <div key={category.id} className="flex items-center gap-2 p-3"><span className="min-w-0 flex-1 truncate text-sm">{category.name}</span><Badge variant={category.active ? "default" : "secondary"}>{category.active ? "Active" : "Archived"}</Badge><Button size="icon" variant="ghost" aria-label={`Rename ${category.name}`} onClick={() => { setEditingCategory(category); setCategoryName(category.name) }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={`${category.active ? "Archive" : "Restore"} ${category.name}`} onClick={() => toggleCategory(category)}><Archive className="h-4 w-4" /></Button></div>)}</div>
          <DialogFooter><Button variant="outline" onClick={() => { setCategoriesOpen(false); setEditingCategory(null); setCategoryName("") }}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
