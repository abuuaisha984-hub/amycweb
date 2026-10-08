"use client"

import { useCallback, useEffect, useState } from "react"
import { Image as ImageIcon, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { AdminImageUpload } from "@/components/admin/image-upload"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type ProgrammeImage = {
  id: string
  slug: string
  name: string
  image: string | null
  status: string
}

export function ProgrammeImagesManager() {
  const [programmes, setProgrammes] = useState<ProgrammeImage[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/programmes", { cache: "no-store" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load programmes.")
      setProgrammes(data.programmes || [])
      setDrafts({})
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load programmes.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function saveImage(programme: ProgrammeImage) {
    if (!Object.hasOwn(drafts, programme.id)) return
    setSavingId(programme.id)
    try {
      const response = await fetch(`/api/admin/programmes/${programme.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: drafts[programme.id] || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "The programme image could not be saved.")
      setProgrammes((current) => current.map((item) => item.id === programme.id ? data.programme : item))
      setDrafts((current) => {
        const next = { ...current }
        delete next[programme.id]
        return next
      })
      toast.success(`Image saved for ${programme.name}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The programme image could not be saved.")
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading programmes…</div>
  if (programmes.length === 0) return <Card><CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground"><ImageIcon className="h-8 w-8" /><p>No programmes are available to update.</p></CardContent></Card>

  return <div className="grid gap-5 xl:grid-cols-2">
    {programmes.map((programme) => {
      const image = Object.hasOwn(drafts, programme.id) ? drafts[programme.id] : programme.image || ""
      const changed = image !== (programme.image || "")
      return <Card key={programme.id} className="overflow-hidden">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-serif text-lg font-semibold">{programme.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">/{programme.slug}</p>
            </div>
            <Badge variant={programme.status === "PUBLISHED" ? "default" : "secondary"}>{programme.status}</Badge>
          </div>
          <AdminImageUpload
            entity="programme"
            value={image}
            onChange={(url) => setDrafts((current) => ({ ...current, [programme.id]: url }))}
            label={`Programme image — ${programme.name}`}
            disabled={savingId === programme.id}
          />
          <div className="flex justify-end">
            <Button type="button" onClick={() => void saveImage(programme)} disabled={!changed || savingId === programme.id}>
              {savingId === programme.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {savingId === programme.id ? "Saving…" : "Save image"}
            </Button>
          </div>
        </CardContent>
      </Card>
    })}
  </div>
}
