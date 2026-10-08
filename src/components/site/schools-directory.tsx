"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
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
  jimboId: string | null
  jimboName: string | null
  administrativeRegion: string | null
  about: string
  image: string | null
}

export function SchoolsDirectory({ schools, locale, initialType = "ALL" }: { schools: School[]; locale: Locale; initialType?: string }) {
  const [q, setQ] = useState("")
  const [type, setType] = useState<string>(initialType)
  const [region, setRegion] = useState<string>("ALL")
  const [jimboId, setJimboId] = useState<string>("ALL")
  const t = (k: string) => ui(locale, k)

  const TYPE_LABELS: Record<string, string> = {
    ALL: t("education.allSchools"),
    MAAHAD: t("education.maahad"),
    SECONDARY: t("education.secondary"),
    PRIMARY: t("education.primary"),
    COLLEGE: t("education.college"),
    UNIVERSITY: t("education.university"),
  }

  const regions = useMemo(() => {
    const set = new Set<string>()
    schools.forEach((s) => s.administrativeRegion && set.add(s.administrativeRegion))
    return Array.from(set).sort()
  }, [schools])
  const jimbos = useMemo(() => {
    const names = new Map<string, string>()
    schools.forEach((school) => { if (school.jimboId && school.jimboName) names.set(school.jimboId, school.jimboName) })
    return Array.from(names, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [schools])
  const regionCounts = useMemo(() => new Map(regions.map((name) => [name, schools.filter((school) => school.administrativeRegion === name).length])), [regions, schools])
  const jimboCounts = useMemo(() => new Map(jimbos.map((jimbo) => [jimbo.id, schools.filter((school) => school.jimboId === jimbo.id).length])), [jimbos, schools])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return schools.filter((sc) => {
      if (type !== "ALL" && sc.type.trim().toUpperCase() !== type) return false
      if (region !== "ALL" && sc.administrativeRegion !== region) return false
      if (jimboId !== "ALL" && sc.jimboId !== jimboId) return false
      if (s && !sc.name.toLowerCase().includes(s) && !sc.about.toLowerCase().includes(s) && !(sc.jimboName || "").toLowerCase().includes(s)) return false
      return true
    })
  }, [q, type, region, jimboId, schools])

  const labels = locale === "sw"
    ? { allRegions: "Mikoa yote", allJimbos: "Majimbo yote ya AMYC", governmentRegion: "Mkoa wa serikali", jimbo: "Jimbo la AMYC" }
    : locale === "ar"
      ? { allRegions: "جميع المناطق الإدارية", allJimbos: "جميع أقاليم AMYC", governmentRegion: "المنطقة الإدارية", jimbo: "إقليم AMYC" }
      : { allRegions: "All government regions", allJimbos: "All AMYC Jimbos", governmentRegion: "Government region", jimbo: "AMYC Jimbo" }

  return (
    <div>
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
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
            {(["ALL", "MAAHAD", "PRIMARY", "SECONDARY", "COLLEGE", "UNIVERSITY"] as const).map((ty) => (
              <Button
                key={ty}
                size="sm"
                variant={type === ty ? "default" : "outline"}
                onClick={() => setType(ty)}
                className="h-9"
              >
                {TYPE_LABELS[ty]}
              </Button>
            ))}
          </div>
          <select
            aria-label={labels.jimbo}
            value={jimboId}
            onChange={(e) => setJimboId(e.target.value)}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="ALL">{labels.allJimbos}</option>
            {jimbos.map((jimbo) => (
              <option key={jimbo.id} value={jimbo.id}>{jimbo.name} ({jimboCounts.get(jimbo.id) || 0})</option>
            ))}
          </select>
          <select
            aria-label={labels.governmentRegion}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="ALL">{labels.allRegions}</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r} ({regionCounts.get(r) || 0})</option>
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
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
          >
            {s.image && <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
              <Image src={s.image} alt={`${s.name} school`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
            </div>}
            <div className="flex flex-1 flex-col p-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                <GraduationCap className="h-3 w-3" /> {TYPE_LABELS[s.type] || s.type}
              </span>
              {(s.jimboName || s.administrativeRegion) && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {[s.jimboName, s.administrativeRegion].filter(Boolean).join(" · ")}
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
            </div>
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
