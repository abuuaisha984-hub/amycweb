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
import { useLanguage } from "@/components/providers"
import { lp } from "@/components/site/nav-config"

type Hit = {
  type: string
  title: string
  href: string
  excerpt?: string
}

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const { locale, t } = useLanguage()
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
    const to = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&locale=${locale}`)
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
      clearTimeout(to)
    }
  }, [q, locale])

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  const groups: { type: string; labelKey: string; icon: any }[] = [
    { type: "page", labelKey: "nav.about", icon: FileText },
    { type: "article", labelKey: "news.title", icon: Newspaper },
    { type: "school", labelKey: "nav.education", icon: School },
    { type: "region", labelKey: "nav.regions", icon: MapPin },
    { type: "event", labelKey: "events.title", icon: CalendarDays },
    { type: "document", labelKey: "documents.title", icon: FolderOpen },
  ]

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("search.placeholderLong")} value={q} onValueChange={setQ} />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>
          {q ? (loading ? t("search.searching") : t("search.noResults")) : t("search.typeToSearch")}
        </CommandEmpty>
        {groups.map((g) => {
          const hits = results[g.type] || []
          if (!hits.length) return null
          const Icon = g.icon
          return (
            <CommandGroup key={g.type} heading={`${t(g.labelKey)} (${hits.length})`}>
              {hits.map((h, i) => (
                <CommandItem
                  key={`${g.type}-${i}`}
                  value={`${h.title} ${h.excerpt || ""}`}
                  onSelect={() => go(lp(locale, h.href))}
                >
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
