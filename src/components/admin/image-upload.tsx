"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { publicImage } from "@/lib/public-image"
import { ImageWithFallback } from "@/components/site/image-with-fallback"

export function AdminImageUpload({
  entity,
  value,
  onChange,
  label,
  disabled = false,
}: {
  entity: "region" | "leader" | "school" | "event" | "media" | "article" | "programme"
  value: string
  onChange: (url: string) => void
  label: string
  disabled?: boolean
}) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const resolvedValue = publicImage(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!selectedFile) {
      const reset = window.setTimeout(() => setPreview(""), 0)
      return () => window.clearTimeout(reset)
    }
    const url = URL.createObjectURL(selectedFile)
    const show = window.setTimeout(() => setPreview(url), 0)
    return () => { window.clearTimeout(show); URL.revokeObjectURL(url) }
  }, [selectedFile])

  async function upload(file: File | undefined) {
    if (!file) return
    if (file.size === 0 || file.size > 20 * 1024 * 1024) {
      toast.error("Choose an image smaller than 20 MB.")
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    if (file.type && !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type.toLowerCase())) {
      toast.error("Choose a JPG, PNG, or WebP image.")
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.set("entity", entity)
      form.set("file", file)
      const response = await fetch("/api/admin/images", { method: "POST", body: form })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "The image could not be uploaded.")
      onChange(data.url)
      setSelectedFile(null)
      toast.success("Image uploaded and optimized. Save this record to publish the change.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The image could not be uploaded.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>{label}</Label>
      <div className="grid gap-4 rounded-xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/[0.035] to-secondary/40 p-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center sm:p-5">
        {preview || resolvedValue ? <ImageWithFallback src={preview || resolvedValue || undefined} alt="Selected upload preview" className="aspect-[4/3] w-32 rounded-lg border bg-background object-cover shadow-sm" fallback={<ImagePlus className="h-7 w-7" />} /> : <div className="grid aspect-[4/3] w-32 place-items-center rounded-lg border bg-background text-primary/65"><ImagePlus className="h-7 w-7" /></div>}
        <div className="min-w-0 space-y-2">
          <Input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" disabled={uploading || disabled} aria-label={label} onChange={(event) => { const file = event.target.files?.[0]; setSelectedFile(file || null); void upload(file) }} />
          {selectedFile && <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {selectedFile.name} · {(selectedFile.size / 1024).toFixed(0)} KB</p>}
          <p className="text-xs leading-relaxed text-muted-foreground">JPG, JPEG, PNG or WebP · maximum 20 MB. Images are resized and optimized automatically.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:col-start-2">
          {value && <Button type="button" variant="outline" size="sm" onClick={() => onChange("")} disabled={uploading || disabled}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove image</Button>}
          {uploading && <span role="status" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Uploading image…</span>}
        </div>
      </div>
    </div>
  )
}
