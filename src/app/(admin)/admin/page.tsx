import Link from "next/link"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AdminPageHeader } from "@/components/admin/page-header"
import { ROLE_LABELS } from "@/components/admin/nav-config"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Newspaper, GraduationCap, MapPin, Mail, FileText, CalendarDays, TrendingUp, Clock, ShieldCheck } from "lucide-react"

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}
function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const [articles, schools, regions, messages, documents, events, audit] = await Promise.all([
    db.article.count({ where: { deletedAt: null } }),
    db.school.count({ where: { deletedAt: null } }),
    db.region.count({ where: { deletedAt: null } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.document.count({ where: { deletedAt: null } }),
    db.event.count({ where: { deletedAt: null, startDate: { gte: new Date() } } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ])
  const recentArticles = await db.article.findMany({ orderBy: { createdAt: "desc" }, take: 5 })
  const recentMessages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 4 })

  const stats = [
    { label: "News & Announcements", value: articles, icon: Newspaper, href: "/admin/news", color: "text-primary" },
    { label: "Schools", value: schools, icon: GraduationCap, href: "/admin/schools", color: "text-accent" },
    { label: "Regions (Majimbo)", value: regions, icon: MapPin, href: "/admin/regions", color: "text-primary" },
    { label: "New Messages", value: messages, icon: Mail, href: "/admin/messages", color: "text-accent" },
    { label: "Documents", value: documents, icon: FileText, href: "/admin/documents", color: "text-primary" },
    { label: "Upcoming Events", value: events, icon: CalendarDays, href: "/admin/events", color: "text-accent" },
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
        {stats.map((s) => (
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Recent articles */}
        <Card>
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
        </Card>

        {/* Recent messages */}
        <Card>
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
        </Card>
      </div>

      {/* Audit log */}
      <Card className="mt-6">
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
      </Card>
    </div>
  )
}
