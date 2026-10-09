import { notFound } from "next/navigation"
import { getAdminPageSession } from "@/lib/admin-page-session"
import { AdminPageHeader } from "@/components/admin/page-header"
import { VisitorTrendChart, type VisitorTrendPoint } from "@/components/admin/visitor-trend-chart"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { canRead } from "@/lib/permissions"
import { db } from "@/lib/db"
import { Eye, Globe2, MapPinned, MousePointerClick, UsersRound } from "lucide-react"

type RangeKey = "today" | "7d" | "30d" | "6m" | "12m" | "custom"
const TIME_ZONE = "Africa/Dar_es_Salaam"
const HOUR_MS = 60 * 60 * 1000

function localDateString(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const get = (type: string) => parts.find((part) => part.type === type)?.value || ""
  return `${get("year")}-${get("month")}-${get("day")}`
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function darStart(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day) - 3 * HOUR_MS)
}

function resolveRange(rangeValue: string | undefined, fromValue: string | undefined, toValue: string | undefined) {
  const now = new Date()
  const today = localDateString(now)
  const range: RangeKey = ["today", "7d", "30d", "6m", "12m", "custom"].includes(rangeValue || "")
    ? rangeValue as RangeKey
    : "30d"
  let from = today
  if (range === "7d") from = shiftDate(today, -6)
  if (range === "30d") from = shiftDate(today, -29)
  if (range === "6m" || range === "12m") {
    const months = range === "6m" ? 5 : 11
    const date = new Date(`${today}T12:00:00Z`)
    date.setUTCMonth(date.getUTCMonth() - months)
    from = `${date.toISOString().slice(0, 7)}-01`
  }
  let to = today
  if (range === "custom") {
    const validDate = (value?: string) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
    if (validDate(fromValue) && validDate(toValue) && fromValue! <= toValue!) {
      from = fromValue!
      to = toValue!
    }
  }
  const start = darStart(from)
  const end = darStart(shiftDate(to, 1))
  const days = Math.round((end.getTime() - start.getTime()) / (24 * HOUR_MS))
  const monthly = days > 60
  return { range, from, to, start, end, monthly }
}

function countryName(code: string) {
  if (code === "Unknown") return "Unknown"
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code } catch { return code }
}

function pathLabel(pathname: string) {
  const path = pathname.replace(/^\/(en|sw|ar)(?=\/|$)/, "") || "/"
  const labels: Record<string, string> = {
    "/": "Home",
    "/about": "About AMYC",
    "/programmes": "Programmes",
    "/education": "Schools & Education",
    "/regions": "Regions (Majimbo)",
    "/news": "News",
    "/events": "Events",
    "/documents": "Documents",
    "/media": "Media & Gallery",
    "/contact": "Contact",
  }
  return labels[path] || path
}

function trafficSource(host: string | null) {
  if (!host) return "Direct"
  if (/google\.|bing\.|yahoo\.|duckduckgo\.|search\./i.test(host)) return "Search engines"
  if (/facebook\.|instagram\.|t\.co$|twitter\.|x\.com$|linkedin\.|tiktok\./i.test(host)) return "Social media"
  if (/whatsapp\./i.test(host)) return "WhatsApp"
  return host
}

function MetricCard({ label, value, icon: Icon, detail }: { label: string; value: string | number; icon: typeof UsersRound; detail?: string }) {
  return <Card><CardContent className="flex items-center justify-between gap-3 p-5">
    <div className="min-w-0"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 font-serif text-3xl font-semibold">{value.toLocaleString()}</p>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
  </CardContent></Card>
}

function DataTable({ title, description, headers, rows, empty, className = "" }: {
  title: string
  description?: string
  headers: [string, string]
  rows: Array<{ key: string; label: string; value: string; detail?: string }>
  empty: string
  className?: string
}) {
  return <Card className={className}><CardHeader><h2 className="font-serif text-lg font-semibold">{title}</h2>{description && <p className="text-sm text-muted-foreground">{description}</p>}</CardHeader><CardContent>
    <div className="overflow-x-auto"><table className="w-full min-w-[280px] text-sm">
      <thead className="border-b text-left text-xs uppercase text-muted-foreground"><tr><th scope="col" className="py-3 font-medium">{headers[0]}</th><th scope="col" className="py-3 text-right font-medium">{headers[1]}</th></tr></thead>
      <tbody className="divide-y">{rows.map((row) => <tr key={row.key}><td className="py-3 pr-3"><span className="block truncate">{row.label}</span>{row.detail && <span className="text-xs text-muted-foreground">{row.detail}</span>}</td><td className="py-3 text-right font-medium">{row.value}</td></tr>)}
        {!rows.length && <tr><td colSpan={2} className="py-8 text-center text-muted-foreground">{empty}</td></tr>}
      </tbody></table></div>
  </CardContent></Card>
}

export default async function VisitorAnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getAdminPageSession()
  if (!canRead(session?.user?.role, "analytics")) notFound()
  const query = await searchParams
  const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value
  const selected = resolveRange(one(query.range), one(query.from), one(query.to))
  const eventWhere = { createdAt: { gte: selected.start, lt: selected.end } }
  const visitorWhere = { lastVisitedAt: { gte: selected.start, lt: selected.end } }
  const currentMonthStart = darStart(`${localDateString(new Date()).slice(0, 7)}-01`)
  const trendRowsQuery = process.env.DATABASE_URL?.startsWith("postgres")
    ? db.$queryRaw<Array<{ bucket: string; visitors: bigint; pageViews: bigint }>>`
        SELECT TO_CHAR("createdAt" + INTERVAL '3 hours', ${selected.monthly ? "YYYY-MM" : "YYYY-MM-DD"}) AS "bucket",
          COUNT(DISTINCT "visitorId") AS "visitors", COUNT(*) AS "pageViews"
        FROM "VisitEvent"
        WHERE "createdAt" >= ${selected.start} AND "createdAt" < ${selected.end}
        GROUP BY "bucket" ORDER BY "bucket" ASC
      `
    : db.$queryRaw<Array<{ bucket: string; visitors: bigint; pageViews: bigint }>>`
        SELECT strftime(${selected.monthly ? "%Y-%m" : "%Y-%m-%d"}, datetime("createdAt", '+3 hours')) AS "bucket",
          COUNT(DISTINCT "visitorId") AS "visitors", COUNT(*) AS "pageViews"
        FROM "VisitEvent"
        WHERE "createdAt" >= ${selected.start} AND "createdAt" < ${selected.end}
        GROUP BY "bucket" ORDER BY "bucket" ASC
      `
  const [totalVisitors, totalPageViews, trackedPageViews, visitorsToday, visitorsWeek, visitorsMonth, selectedVisitors, selectedPageViews, pages, referrers, countries, domesticVisitors, internationalVisitors, regions, cities, trendRows] = await Promise.all([
    db.visitor.count(),
    db.visitEvent.count(),
    db.visitEvent.count({ where: { visitorId: { not: null } } }),
    db.visitor.count({ where: { lastVisitedAt: { gte: darStart(localDateString(new Date())) } } }),
    db.visitor.count({ where: { lastVisitedAt: { gte: darStart(shiftDate(localDateString(new Date()), -6)) } } }),
    db.visitor.count({ where: { lastVisitedAt: { gte: currentMonthStart } } }),
    db.visitor.count({ where: visitorWhere }),
    db.visitEvent.count({ where: eventWhere }),
    db.visitEvent.groupBy({ by: ["pathname"], where: eventWhere, _count: { _all: true }, orderBy: { _count: { pathname: "desc" } }, take: 10 }),
    db.visitEvent.groupBy({ by: ["referrerHost"], where: eventWhere, _count: { _all: true }, orderBy: { _count: { referrerHost: "desc" } }, take: 50 }),
    db.visitor.groupBy({ by: ["country"], where: visitorWhere, _count: { _all: true }, orderBy: { _count: { country: "desc" } }, take: 20 }),
    db.visitor.count({ where: { ...visitorWhere, country: "TZ" } }),
    db.visitor.count({ where: { ...visitorWhere, country: { notIn: ["TZ", "Unknown"] } } }),
    db.$queryRaw<Array<{ region: string; visitors: bigint }>>`
      SELECT "region", COUNT(DISTINCT "visitorId") AS "visitors"
      FROM "VisitEvent"
      WHERE "createdAt" >= ${selected.start} AND "createdAt" < ${selected.end}
        AND "country" = 'TZ' AND "region" != 'Unknown' AND "visitorId" IS NOT NULL
      GROUP BY "region" ORDER BY COUNT(DISTINCT "visitorId") DESC LIMIT 10
    `,
    db.$queryRaw<Array<{ city: string; visitors: bigint }>>`
      SELECT "city", COUNT(DISTINCT "visitorId") AS "visitors"
      FROM "VisitEvent"
      WHERE "createdAt" >= ${selected.start} AND "createdAt" < ${selected.end}
        AND "country" = 'TZ' AND "city" != 'Unknown' AND "visitorId" IS NOT NULL
      GROUP BY "city" ORDER BY COUNT(DISTINCT "visitorId") DESC LIMIT 10
    `,
    trendRowsQuery,
  ])

  const sourceTotals = new Map<string, number>()
  for (const row of referrers) {
    const source = trafficSource(row.referrerHost)
    sourceTotals.set(source, (sourceTotals.get(source) || 0) + row._count._all)
  }
  const sources = [...sourceTotals].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 8)
  const formatNumber = (value: number) => value.toLocaleString("en-US")

  const byBucket = new Map(trendRows.map((row) => [row.bucket, { visitors: Number(row.visitors), pageViews: Number(row.pageViews) }]))
  const trend: VisitorTrendPoint[] = []
  if (selected.monthly) {
    const [startYear, startMonth] = selected.from.split("-").map(Number)
    const [endYear, endMonth] = selected.to.split("-").map(Number)
    const cursor = new Date(Date.UTC(startYear, startMonth - 1, 1))
    const finish = new Date(Date.UTC(endYear, endMonth - 1, 1))
    while (cursor <= finish) {
      const bucket = cursor.toISOString().slice(0, 7)
      trend.push({ label: cursor.toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }), ...(byBucket.get(bucket) || { visitors: 0, pageViews: 0 }) })
      cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    }
  } else {
    const cursor = new Date(`${selected.from}T12:00:00Z`)
    const finish = new Date(`${selected.to}T12:00:00Z`)
    while (cursor <= finish) {
      const bucket = cursor.toISOString().slice(0, 10)
      trend.push({ label: cursor.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }), ...(byBucket.get(bucket) || { visitors: 0, pageViews: 0 }) })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  return <div className="space-y-6">
    <AdminPageHeader title="Visitor Analytics" description="Anonymous website reach, visitor locations, page views and traffic sources. Location detail depends on the hosting proxy." />

    <section aria-label="Overall visitor statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Total Unique Visitors" value={totalVisitors} icon={UsersRound} />
      <MetricCard label="Visitors Today" value={visitorsToday} icon={UsersRound} />
      <MetricCard label="Visitors This Week" value={visitorsWeek} icon={UsersRound} />
      <MetricCard label="Visitors This Month" value={visitorsMonth} icon={UsersRound} />
      <MetricCard label="Total Page Views" value={totalPageViews} icon={Eye} />
      <MetricCard label="Average Pages per Visitor" value={totalVisitors ? (trackedPageViews / totalVisitors).toFixed(1) : "0.0"} icon={MousePointerClick} detail="Tracked page views ÷ unique visitors" />
      <MetricCard label="Visitors in Selected Range" value={selectedVisitors} icon={UsersRound} />
      <MetricCard label="Page Views in Selected Range" value={selectedPageViews} icon={Eye} />
    </section>

    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="font-serif text-lg font-semibold">Visitor Trends</h2><p className="text-sm text-muted-foreground">Unique visitors and page views · East Africa Time</p></div>
        <form method="get" className="flex flex-wrap items-end gap-2" aria-label="Choose analytics date range">
          <label className="grid gap-1 text-xs text-muted-foreground">Period<select name="range" defaultValue={selected.range} className="h-9 rounded-md border bg-background px-2 text-sm text-foreground"><option value="today">Today</option><option value="7d">Last 7 Days</option><option value="30d">Last 30 Days</option><option value="6m">Last 6 Months</option><option value="12m">Last 12 Months</option><option value="custom">Custom Date Range</option></select></label>
          <label className="grid gap-1 text-xs text-muted-foreground">From<input type="date" name="from" defaultValue={selected.from} className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" /></label>
          <label className="grid gap-1 text-xs text-muted-foreground">To<input type="date" name="to" defaultValue={selected.to} className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" /></label>
          <button className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">Apply</button>
        </form>
      </CardHeader>
      <CardContent><VisitorTrendChart data={trend} /></CardContent>
    </Card>

    <div className="grid gap-6 xl:grid-cols-2">
      <DataTable title="Visitors by Region" description="Unique visitors in Tanzania, grouped using region data supplied by the hosting proxy." headers={["Region", "Unique Visitors"]}
        rows={regions.map((row) => ({ key: row.region, label: row.region, value: formatNumber(Number(row.visitors)) }))} empty="No Tanzania region data is available for this period." />
      <DataTable title="Visitors by Country" description="Unique visitors by their most recently detected country in this date range." headers={["Country", "Visitors · share"]}
        rows={countries.map((row) => ({ key: row.country, label: countryName(row.country), value: `${formatNumber(row._count._all)} · ${selectedVisitors ? Math.round(row._count._all / selectedVisitors * 100) : 0}%` }))} empty="No visitor location data is available for this period."
        className="[&_tbody_tr:first-child]:text-primary" />
      <DataTable title="Visitors by City" description="Tanzania city data is shown when the hosting proxy supplies it." headers={["City", "Unique Visitors"]}
        rows={cities.map((row) => ({ key: row.city, label: row.city, value: formatNumber(Number(row.visitors)) }))} empty="No Tanzania city data is available for this period." />
    </div>

    <Card>
      <CardHeader><h2 className="font-serif text-lg font-semibold">Domestic and International Visitors</h2><p className="text-sm text-muted-foreground">Unique visitors in the selected range, based on the last country detected for each visitor.</p></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Domestic Visitors · Tanzania</p><p className="mt-1 text-2xl font-semibold">{formatNumber(domesticVisitors)}</p></div>
        <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">International Visitors</p><p className="mt-1 text-2xl font-semibold">{formatNumber(internationalVisitors)}</p></div>
      </CardContent>
    </Card>

    <div className="grid gap-6 xl:grid-cols-2">
      <DataTable title="Most Visited Pages" description="Page views for the selected period." headers={["Page", "Views"]}
        rows={pages.map((page) => ({ key: page.pathname, label: pathLabel(page.pathname), value: formatNumber(page._count._all), detail: page.pathname }))} empty="No page views were recorded in this period." />
      <DataTable title="Traffic Sources" description="Referral hostnames are grouped into broad source categories where recognizable." headers={["Source", "Page Views"]}
        rows={sources.map((source) => ({ key: source.label, label: source.label, value: formatNumber(source.count) }))} empty="No referral information is available in this period." />
    </div>

    <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><MapPinned className="mt-0.5 h-4 w-4 shrink-0" />Location is recorded only when the hosting proxy provides country, region or city headers. Existing records are not assigned estimated locations. Raw IP addresses and personal identity details are not stored.</p>
  </div>
}
