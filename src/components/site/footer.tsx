import Link from "next/link"
import { AmycLogo } from "@/components/site/logo"
import { FOOTER_QUICK, FOOTER_LEGAL, lp } from "@/components/site/nav-config"
import { db } from "@/lib/db"
import { ui, type Locale } from "@/lib/i18n"
import { setting } from "@/lib/locale-page"
import { Mail, Phone, MapPin, Clock, ArrowRight } from "lucide-react"

async function getFooterData() {
  const [socials, settings] = await Promise.all([
    db.socialLink.findMany({ orderBy: { sortOrder: "asc" } }),
    db.siteSetting.findMany(),
  ])
  const map: Record<string, any> = {}
  for (const s of settings) {
    try {
      map[s.key] = JSON.parse(s.value)
    } catch {
      map[s.key] = s.value
    }
  }
  return { socials, settings: map }
}

const SOCIAL_ICONS: Record<string, string> = {
  Facebook: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z",
  Youtube: "M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814a2.506 2.506 0 0 0 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814ZM10 15.464V8.536L16 12l-6 3.464Z",
  Instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.415.56.217.96.477 1.382.896.419.42.679.819.896 1.381.166.422.36 1.057.413 2.227.058 1.266.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.249 1.805-.415 2.227a3.7 3.7 0 0 1-.896 1.382 3.7 3.7 0 0 1-1.382.896c-.422.166-1.057.36-2.227.413-1.266.058-1.645.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.805-.249-2.227-.415a3.7 3.7 0 0 1-1.382-.896 3.7 3.7 0 0 1-.896-1.382c-.166-.422-.36-1.057-.413-2.227-.058-1.266-.07-1.645-.07-4.85s.012-3.584.07-4.85c.054-1.17.249-1.805.415-2.227.217-.56.477-.96.896-1.382.42-.419.819-.679 1.381-.896.422-.166 1.057-.36 2.227-.413 1.266-.058 1.645-.07 4.85-.07M12 0C8.741 0 8.332.014 7.052.072 5.775.13 4.902.333 4.14.63a5.88 5.88 0 0 0-2.126 1.384A5.88 5.88 0 0 0 .63 4.14C.333 4.902.131 5.775.072 7.052.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.059 1.277.261 2.15.558 2.913a5.88 5.88 0 0 0 1.384 2.126A5.88 5.88 0 0 0 4.14 23.37c.762.297 1.635.499 2.912.558C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.059 2.15-.261 2.913-.558a5.88 5.88 0 0 0 2.126-1.384 5.88 5.88 0 0 0 1.384-2.126c.297-.762.499-1.635.558-2.913.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.059-1.277-.261-2.15-.558-2.913a5.88 5.88 0 0 0-1.384-2.126A5.88 5.88 0 0 0 19.86.63c-.762-.297-1.635-.499-2.913-.558C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z",
  Twitter: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  WhatsApp: "M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z",
  Send: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
  MessageCircle: "M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.733 8l3.131 3.26L19.752 8l-6.561 6.963z",
}

export async function SiteFooter({ locale }: { locale: Locale }) {
  const { socials, settings } = await getFooterData()
  const orgName = settings.orgName || "Ansaar Muslim Youth Centre"
  const tagline = setting(settings, "tagline", locale)
  const email = settings.email || "info@amyc.or.tz"
  const phone = settings.phone || ""
  const address = settings.address || "Tanga, Tanzania"
  const officeHours = settings.officeHours || ""

  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="container-institutional py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-primary-foreground/5 p-1 ring-1 ring-primary-foreground/10">
              <AmycLogo className="px-2 py-1.5 [&_span]:text-primary-foreground [&_.text-muted-foreground]:text-primary-foreground/60" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/75">{tagline}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {socials.map((s) => {
                const path = SOCIAL_ICONS[s.icon || s.platform] || SOCIAL_ICONS.MessageCircle
                return (
                  <a
                    key={s.id}
                    href={s.url}
                    aria-label={s.platform}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/10 transition hover:bg-accent hover:text-accent-foreground"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d={path} />
                    </svg>
                  </a>
                )
              })}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-accent">{ui(locale, "footer.quickLinks")}</h3>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_QUICK.map((l) => (
                <li key={l.href}>
                  <Link href={lp(locale, l.href)} className="group inline-flex items-center gap-1 text-sm text-primary-foreground/80 transition hover:text-primary-foreground">
                    <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 rtl:rotate-180" />
                    {ui(locale, l.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-accent">{ui(locale, "footer.contact")}</h3>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{address}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <a href={`mailto:${email}`} className="transition hover:text-primary-foreground">{email}</a>
              </li>
              {phone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{phone}</span>
                </li>
              )}
              {officeHours && (
                <li className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{officeHours}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter + legal */}
          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-accent">{ui(locale, "footer.stayConnected")}</h3>
            <p className="mt-4 text-sm text-primary-foreground/75">{ui(locale, "footer.newsletterDesc")}</p>
            <form className="mt-3 flex gap-2" action="/api/newsletter" method="POST">
              <input
                type="email"
                name="email"
                required
                placeholder={locale === "ar" ? "بريدك الإلكتروني" : locale === "sw" ? "Barua pepe yako" : "Your email"}
                className="h-10 w-full rounded-md border border-primary-foreground/20 bg-primary-foreground/5 px-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-10 shrink-0 items-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
              >
                {ui(locale, "footer.join")}
              </button>
            </form>
            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/50">{ui(locale, "footer.legal")}</h4>
              <ul className="mt-2 space-y-1.5">
                {FOOTER_LEGAL.map((l) => (
                  <li key={l.href}>
                    <Link href={lp(locale, l.href)} className="text-xs text-primary-foreground/70 transition hover:text-primary-foreground">
                      {ui(locale, l.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-primary-foreground/10 pt-6 text-center md:flex-row md:text-left">
          <p className="text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} {orgName}. {ui(locale, "footer.rightsReserved")}
          </p>
          <p className="text-xs text-primary-foreground/50">
            {ui(locale, "footer.tagline")} · Tanga, Tanzania
          </p>
        </div>
      </div>
    </footer>
  )
}
