"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { MapPin, ArrowRight } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { ui, type Locale } from "@/lib/i18n"

type Region = {
  id: string
  slug: string
  name: string
  englishName: string | null
  overview: string
}

export function RegionsDirectory({ regions, locale }: { regions: Region[]; locale: Locale }) {
  const [q, setQ] = useState("")
  const t = (k: string) => ui(locale, k)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return regions
    return regions.filter(
      (r) =>
        r.name.toLowerCase().includes(s) ||
        (r.englishName || "").toLowerCase().includes(s) ||
        r.overview.toLowerCase().includes(s)
    )
  }, [q, regions])

  return (
    <div>
      <div className="mx-auto max-w-md">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("common.searchJimbo")}
          className="h-11 rounded-full border-primary/20 bg-background text-center"
        />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={lp(locale, `/regions/${r.slug}`)}
            className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-soft"
          >
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-foreground">{r.name}</h3>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180" />
              </div>
              {r.englishName && <p className="text-xs text-accent">{r.englishName}</p>}
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{r.overview}</p>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">{t("common.noResults")}</p>
      )}
    </div>
  )
}
