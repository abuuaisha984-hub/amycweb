"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, ArrowRight, GraduationCap } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { ui, type Locale } from "@/lib/i18n"

type School = {
  id: string
  slug: string
  name: string
  type: string
  category: string | null
  level: string | null
  gender: string | null
  medium: string | null
  region: string | null
  about: string
}

export function SchoolsDirectory({ schools, locale }: { schools: School[]; locale: Locale }) {
  const [q, setQ] = useState("")
  const [type, setType] = useState<string>("ALL")
  const [region, setRegion] = useState<string>("ALL")
  const t = (k: string) => ui(locale, k)

  const TYPE_LABELS: Record<string, string> = {
    MAAHAD: t("education.maahad"),
    SECONDARY: t("education.secondary"),
    PRIMARY: t("education.primary"),
    COLLEGE: t("education.college"),
  }

  const regions = useMemo(() => {
    const set = new Set<string>()
    schools.forEach((s) => s.region && set.add(s.region))
    return Array.from(set).sort()
  }, [schools])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return schools.filter((sc) => {
      if (type !== "ALL" && sc.type !== type) return false
      if (region !== "ALL" && sc.region !== region) return false
      if (s && !sc.name.toLowerCase().includes(s) && !sc.about.toLowerCase().includes(s)) return false
      return true
    })
  }, [q, type, region, schools])

  return (
    <div>
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("common.searchSchools")}
              className="h-11 ps-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["ALL", "MAAHAD", "SECONDARY", "PRIMARY", "COLLEGE"] as const).map((ty) => (
              <Button
                key={ty}
                size="sm"
                variant={type === ty ? "default" : "outline"}
                onClick={() => setType(ty)}
                className="h-9"
              >
                {ty === "ALL" ? t("common.allTypes") : TYPE_LABELS[ty]}
              </Button>
            ))}
          </div>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="ALL">{t("common.allRegions")}</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("common.showing")} <strong className="text-foreground">{filtered.length}</strong> {t("common.of")} {schools.length} {t("common.institutions")}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <Link
            key={s.id}
            href={lp(locale, `/education/${s.slug}`)}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                <GraduationCap className="h-3 w-3" /> {TYPE_LABELS[s.type] || s.type}
              </span>
              {s.region && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {s.region}
                </span>
              )}
            </div>
            <h3 className="mt-3 font-serif text-base font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary">
              {s.name}
            </h3>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">{s.about}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {s.level && <span className="rounded bg-secondary px-2 py-0.5 text-[0.65rem] text-secondary-foreground">{s.level}</span>}
              {s.medium && <span className="rounded bg-secondary px-2 py-0.5 text-[0.65rem] text-secondary-foreground">{s.medium}</span>}
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              {t("common.learnMore")} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 rtl:rotate-180" />
            </span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("common.noMatches")}</p>
        </div>
      )}
    </div>
  )
}
