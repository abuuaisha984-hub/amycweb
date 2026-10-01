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
import { Upload, Trash2, Loader2, FileText, Download, ShieldCheck } from "lucide-react"

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
}

const CATEGORIES = ["Annual Report", "Strategic Plan", "Policy", "Form", "Publication", "Financial", "Guideline", "Official Notice"]

export function DocumentsManager() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", category: "Publication", author: "", department: "", file: null as File | null })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/documents")
    const data = await res.json()
    setDocs(data.documents || [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

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
    fd.append("file", form.file)
    try {
      const res = await fetch("/api/admin/documents", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok) {
        toast.success("Document uploaded.")
        setOpen(false)
        setForm({ title: "", description: "", category: "Publication", author: "", department: "", file: null })
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
    if (!confirm(`Archive "${d.title}"?`)) return
    const res = await fetch(`/api/admin/documents/${d.id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Document archived."); load() } else { toast.error("Failed.") }
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
        <p className="text-sm text-muted-foreground">{docs.length} documents · Max 25MB · PDF, DOC, XLS, PPT, ZIP, images</p>
        <Button onClick={() => setOpen(true)} className="bg-primary"><Upload className="mr-1.5 h-4 w-4" /> Upload Document</Button>
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
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <a href={d.filePath} download className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent/20"><Download className="h-3.5 w-3.5 text-primary" /></a>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => remove(d)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Author</Label>
                <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Department / author" />
              </div>
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
              {uploading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="mr-1.5 h-4 w-4" /> Upload</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
