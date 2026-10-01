"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Search, FileText, School, MapPin, Newspaper, CalendarDays, FolderOpen } from "lucide-react"

type Hit = {
  type: string
  title: string
  href: string
  excerpt?: string
}

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [results, setResults] = useState<Record<string, Hit[]>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q.trim()) {
      setResults({})
      return
    }
    let cancelled = false
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
        const data = await res.json()
        if (!cancelled) setResults(data.results || {})
      } catch {
        if (!cancelled) setResults({})
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 220)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [q])

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  const groups: { type: string; label: string; icon: any }[] = [
    { type: "page", label: "Pages", icon: FileText },
    { type: "article", label: "News & Announcements", icon: Newspaper },
    { type: "school", label: "Schools", icon: School },
    { type: "region", label: "Regions (Majimbo)", icon: MapPin },
    { type: "event", label: "Events", icon: CalendarDays },
    { type: "document", label: "Documents", icon: FolderOpen },
  ]

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search AMYC — schools, regions, news, documents…" value={q} onValueChange={setQ} />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>{q ? (loading ? "Searching…" : "No results found.") : "Type to search the AMYC platform."}</CommandEmpty>
        {groups.map((g) => {
          const hits = results[g.type] || []
          if (!hits.length) return null
          const Icon = g.icon
          return (
            <CommandGroup key={g.type} heading={`${g.label} (${hits.length})`}>
              {hits.map((h, i) => (
                <CommandItem key={`${g.type}-${i}`} value={`${h.title} ${h.excerpt || ""}`} onSelect={() => go(h.href)}>
                  <Icon className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{h.title}</span>
                    {h.excerpt && <span className="text-xs text-muted-foreground line-clamp-1">{h.excerpt}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}
