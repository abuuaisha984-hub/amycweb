import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section } from "@/components/site/sections"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, MapPin, User, ArrowRight } from "lucide-react"
import { lp } from "@/components/site/nav-config"
import { localizedField, ui, formatDate, type Locale } from "@/lib/locale-page"

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const now = new Date()
  const [upcoming, past] = await Promise.all([
    db.event.findMany({
      where: { status: "PUBLISHED", deletedAt: null, startDate: { gte: now } },
      orderBy: { startDate: "asc" },
    }),
    db.event.findMany({
      where: { status: "PUBLISHED", deletedAt: null, startDate: { lt: now } },
      orderBy: { startDate: "desc" },
      take: 4,
    }),
  ])

  return (
    <>
      <PageHero
        eyebrow={t("home.events.eyebrow")}
        title={t("events.title")}
        description={t("events.desc")}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("events.title") }]}
      />
      <Section>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">{t("events.upcoming")}</h2>
        {upcoming.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">{t("events.none")}</p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {upcoming.map((e) => (
              <Card key={e.id} className="group overflow-hidden border-border transition hover:border-primary/30 hover:shadow-card">
                <CardContent className="flex gap-5 p-6">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <span className="text-2xl font-bold leading-none">{new Date(e.startDate).getDate()}</span>
                    <span className="text-[0.65rem] uppercase tracking-wide">{formatDate(e.startDate, locale, { month: "short" })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {e.category && <Badge variant="secondary" className="text-[0.65rem]">{e.category}</Badge>}
                      {e.startTime && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{e.startTime}</span>}
                    </div>
                    <h3 className="mt-1.5 font-serif text-lg font-semibold leading-snug text-foreground">{localizedField(e, "title", locale, e.title)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">{localizedField(e, "description", locale, e.description)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {e.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>}
                      {e.organizer && <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{e.organizer}</span>}
                    </div>
                    {e.registrationLink && (
                      <a href={e.registrationLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                        {t("events.register")} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {past.length > 0 && (
        <Section className="bg-secondary/30">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">{t("events.past")}</h2>
          <div className="mt-6 grid gap-3">
            {past.map((e) => (
              <div key={e.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 opacity-80">
                <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-foreground">{localizedField(e, "title", locale, e.title)}</h3>
                  <p className="text-xs text-muted-foreground">{formatDate(e.startDate, locale, { day: "numeric", month: "long", year: "numeric" })} · {e.location || e.venue || "Tanga"}</p>
                </div>
                <Badge variant="outline">{t("events.pastBadge")}</Badge>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
