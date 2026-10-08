import Link from "next/link"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { can, isSuperAdmin } from "@/lib/rbac"
import { AdminPageHeader } from "@/components/admin/page-header"
import { ROLE_LABELS } from "@/components/admin/nav-config"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Newspaper, GraduationCap, MapPin, Mail, FileText, CalendarDays, TrendingUp, Clock, ShieldCheck, Globe2 } from "lucide-react"

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}
function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}
function countryName(code: string) {
  if (code === "Unknown") return "Unknown location"
  return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const canViewArticles = can(role, "article")
  const canViewSchools = can(role, "school")
  const canViewRegions = can(role, "region")
  const canViewMessages = can(role, "contact")
  const canViewDocuments = can(role, "document")
  const canViewMedia = can(role, "media") || can(role, "gallery")
  const canViewEvents = can(role, "event")
  const canViewAudit = isSuperAdmin(role)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const analytics = can(role, "analytics") ? await Promise.all([
    db.visitEvent.count({ where: { createdAt: { gte: since } } }),
    db.visitEvent.count({ where: { createdAt: { gte: today } } }),
    db.visitEvent.groupBy({ by: ["pathname"], where: { createdAt: { gte: since } }, _count: { _all: true }, orderBy: { _count: { pathname: "desc" } }, take: 5 }),
    db.visitEvent.groupBy({ by: ["referrerHost"], where: { createdAt: { gte: since }, referrerHost: { not: null } }, _count: { _all: true }, orderBy: { _count: { referrerHost: "desc" } }, take: 5 }),
    db.visitor.count(),
    db.visitor.count({ where: { lastVisitedAt: { gte: today } } }),
    db.visitor.count({ where: { lastVisitedAt: { gte: week } } }),
    db.visitor.count({ where: { lastVisitedAt: { gte: since } } }),
    db.visitor.groupBy({ by: ["country"], _count: { _all: true }, orderBy: { _count: { country: "desc" } }, take: 10 }),
    db.visitEvent.count(),
    db.visitEvent.count({ where: { visitorId: { not: null } } }),
  ]) : null
  const [visits30Days, visitsToday, popularPages, popularReferrers, totalVisitors, visitorsToday, visitorsWeek, visitorsMonth, visitorsByLocation, totalPageViews, trackedPageViews] = analytics || [0, 0, [], [], 0, 0, 0, 0, [], 0, 0]
  const [articles, schools, regions, messages, documents, events, audit] = await Promise.all([
    canViewArticles ? db.article.count({ where: { deletedAt: null } }) : 0,
    canViewSchools ? db.school.count({ where: { deletedAt: null } }) : 0,
    canViewRegions ? db.region.count({ where: { deletedAt: null } }) : 0,
    canViewMessages ? db.contactMessage.count({ where: { status: "NEW" } }) : 0,
    canViewDocuments ? db.document.count({ where: { deletedAt: null } }) : 0,
    canViewEvents ? db.event.count({ where: { deletedAt: null, startDate: { gte: new Date() } } }) : 0,
    canViewAudit ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }) : [],
  ])
  const [publishedNews, draftNews, publishedGallery, draftGallery, publishedDocuments, draftDocuments] = await Promise.all([
    canViewArticles ? db.article.count({ where: { status: "PUBLISHED", deletedAt: null } }) : 0,
    canViewArticles ? db.article.count({ where: { status: "DRAFT", deletedAt: null } }) : 0,
    canViewMedia ? db.gallery.count({ where: { status: "PUBLISHED" } }) : 0,
    canViewMedia ? db.gallery.count({ where: { status: "DRAFT" } }) : 0,
    canViewDocuments ? db.document.count({ where: { status: "PUBLISHED", deletedAt: null } }) : 0,
    canViewDocuments ? db.document.count({ where: { status: "DRAFT", deletedAt: null } }) : 0,
  ])
  const recentArticles = canViewArticles ? await db.article.findMany({ orderBy: { createdAt: "desc" }, take: 5 }) : []
  const recentMessages = canViewMessages ? await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 4 }) : []

  const stats = [
    { label: "News", entity: "article", value: articles, icon: Newspaper, href: "/admin/news", color: "text-primary" },
    { label: "Schools", entity: "school", value: schools, icon: GraduationCap, href: "/admin/schools", color: "text-accent" },
    { label: "Regions (Majimbo)", entity: "region", value: regions, icon: MapPin, href: "/admin/regions", color: "text-primary" },
    { label: "New Messages", entity: "contact", value: messages, icon: Mail, href: "/admin/messages", color: "text-accent" },
    { label: "Documents", entity: "document", value: documents, icon: FileText, href: "/admin/documents", color: "text-primary" },
    { label: "Upcoming Events", entity: "event", value: events, icon: CalendarDays, href: "/admin/events", color: "text-accent" },
  ]

  return (
    <div>
      <AdminPageHeader
        title={`Assalāmu ʿalaykum, ${session?.user?.name || "Admin"}`}
        description={`Signed in as ${ROLE_LABELS[session?.user?.role || ""] || "Administrator"}. Here's what's happening across AMYC.`}
        actions={
          <Button asChild className="bg-primary">
            <Link href="/admin/news">Manage Content</Link>
          </Button>
        }
      />

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.filter((s) => can(role, s.entity)).map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="group border-border transition hover:border-primary/30 hover:shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </span>
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
                <div className="mt-3 font-serif text-3xl font-semibold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {(canViewArticles || canViewMedia || canViewDocuments) && <Card className="mt-6">
        <CardHeader><h2 className="font-serif text-lg font-semibold">Content Overview</h2></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ...(canViewArticles ? [{ name: "News", total: articles, published: publishedNews, draft: draftNews, href: "/admin/news" }] : []),
              ...(canViewMedia ? [{ name: "Gallery", total: publishedGallery + draftGallery, published: publishedGallery, draft: draftGallery, href: "/admin/media" }] : []),
              ...(canViewDocuments ? [{ name: "Documents", total: documents, published: publishedDocuments, draft: draftDocuments, href: "/admin/documents" }] : []),
            ].map((item) => <Link key={item.name} href={item.href} className="rounded-lg border p-4 transition hover:border-primary/30 hover:bg-secondary/20">
              <div className="flex items-center justify-between"><span className="font-medium">{item.name}</span><span className="text-2xl font-semibold">{item.total}</span></div>
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground"><span>Published: {item.published}</span><span>Draft: {item.draft}</span></div>
            </Link>)}
          </div>
        </CardContent>
      </Card>}

      {analytics && <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div><h2 className="font-serif text-lg font-semibold">Visitor Analytics</h2>
          <p className="text-sm text-muted-foreground">Anonymous unique visitors and page views.</p></div>
          <Button asChild variant="outline" size="sm"><Link href="/admin/analytics">Open full report</Link></Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total Visitors</p>
              <p className="mt-1 font-serif text-3xl font-semibold">{totalVisitors.toLocaleString()}</p>
              <p className="mt-2 text-sm text-muted-foreground">Today {visitorsToday.toLocaleString()} · 7 days {visitorsWeek.toLocaleString()} · 30 days {visitorsMonth.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total Page Views</p>
              <p className="mt-1 font-serif text-3xl font-semibold">{totalPageViews.toLocaleString()}</p>
              <p className="mt-2 text-sm text-muted-foreground">Last 30 days: {visits30Days.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Average Pages per Visitor</p>
              <p className="mt-1 font-serif text-3xl font-semibold">{totalVisitors ? (trackedPageViews / totalVisitors).toFixed(1) : "0.0"}</p>
              <p className="mt-2 text-sm text-muted-foreground">Tracked page views ÷ unique visitors</p>
            </div>
            <div className="xl:col-span-2">
              <p className="flex items-center gap-2 text-sm font-medium"><Globe2 className="h-4 w-4 text-primary" /> Visitors by Location</p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[260px] text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 font-medium">Country</th><th className="py-2 text-right font-medium">Visitors</th></tr></thead>
                  <tbody className="divide-y">{visitorsByLocation.map((place) => <tr key={place.country}><td className="py-2">{countryName(place.country)}</td><td className="py-2 text-right">{place._count._all.toLocaleString()}</td></tr>)}
                    {visitorsByLocation.length === 0 && <tr><td colSpan={2} className="py-3 text-muted-foreground">No visitors recorded yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Most visited pages (30 days)</p>
              <ul className="mt-2 space-y-1 text-sm">
                {popularPages.map((page) => <li key={page.pathname} className="flex justify-between gap-3"><span className="truncate">{page.pathname}</span><span>{page._count._all}</span></li>)}
                {popularPages.length === 0 && <li className="text-muted-foreground">No page views recorded yet.</li>}
              </ul>
              {popularReferrers.length > 0 && <>
                <p className="mt-4 text-sm font-medium">Referring websites</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {popularReferrers.map((item) => <li key={item.referrerHost} className="flex justify-between gap-3"><span className="truncate">{item.referrerHost}</span><span>{item._count._all}</span></li>)}
                </ul>
              </>}
            </div>
          </div>
        </CardContent>
      </Card>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Recent articles */}
        {canViewArticles && <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <h2 className="font-serif text-lg font-semibold">Recent Content</h2>
            <Button asChild variant="ghost" size="sm"><Link href="/admin/news">View all</Link></Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {recentArticles.map((a) => (
                <Link key={a.id} href="/admin/news" className="flex items-center gap-3 py-3 transition hover:bg-secondary/40 -mx-2 px-2 rounded">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.kind} · {fmtDate(a.createdAt)}</p>
                  </div>
                  <Badge variant={a.status === "PUBLISHED" ? "default" : "secondary"} className="text-[0.65rem]">{a.status}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>}

        {/* Recent messages */}
        {canViewMessages && <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <h2 className="font-serif text-lg font-semibold">Latest Messages</h2>
            <Button asChild variant="ghost" size="sm"><Link href="/admin/messages">View all</Link></Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {recentMessages.map((m) => (
                <Link key={m.id} href="/admin/messages" className="block py-3 -mx-2 px-2 rounded transition hover:bg-secondary/40">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                    {m.status === "NEW" && <Badge className="bg-accent text-accent-foreground text-[0.6rem]">New</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{m.subject}</p>
                </Link>
              ))}
              {recentMessages.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No messages yet.</p>}
            </div>
          </CardContent>
        </Card>}
      </div>

      {/* Audit log */}
      {canViewAudit && <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Recent Activity (Audit Log)</h2>
          <Button asChild variant="ghost" size="sm"><Link href="/admin/audit">View all</Link></Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {audit.map((l) => (
              <div key={l.id} className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3 text-sm">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground"><span className="font-medium">{l.userName}</span> — {l.detail}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(l.createdAt)} · {l.action} · {l.entity}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>}
    </div>
  )
}
