import { PageHero } from "@/components/site/page-hero"
import { Section, Eyebrow } from "@/components/site/sections"
import { Card, CardContent } from "@/components/ui/card"
import { ContactForm } from "@/components/site/contact-form"
import { Mail, Phone, MapPin, Clock, Radio } from "lucide-react"
import { localizedField, ui, getSettings, type Locale } from "@/lib/locale-page"
import { lp } from "@/components/site/nav-config"

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeStr } = await params
  const locale = (localeStr === "sw" || localeStr === "ar" ? localeStr : "en") as Locale
  const t = (k: string) => ui(locale, k)
  const s = await getSettings()
  return (
    <>
      <PageHero
        eyebrow={t("nav.contact")}
        title={t("contact.title")}
        description={t("contact.desc")}
        breadcrumbs={[{ label: t("common.home"), href: lp(locale, "/") }, { label: t("nav.contact") }]}
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Eyebrow>{t("contact.sendMessage")}</Eyebrow>
            <h2 className="mt-4 font-serif text-2xl font-semibold tracking-tight">{t("contact.loveHear")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("contact.formDesc")}</p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-primary/15 bg-secondary/30">
              <CardContent className="p-6">
                <h3 className="font-serif text-base font-semibold">{t("contact.contactDetails")}</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div><span className="text-muted-foreground">{t("contact.address")}</span><br /><span className="font-medium">{s.address || "Tanga, Tanzania"}</span></div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div><span className="text-muted-foreground">{t("about.email")}</span><br /><a href={`mailto:${s.email || "info@amyc.or.tz"}`} className="font-medium hover:text-primary">{s.email || "info@amyc.or.tz"}</a></div>
                  </li>
                  {s.phone && (
                    <li className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div><span className="text-muted-foreground">{t("contact.phone")}</span><br /><span className="font-medium">{s.phone}</span></div>
                    </li>
                  )}
                  <li className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div><span className="text-muted-foreground">{t("contact.officeHours")}</span><br /><span className="font-medium">{s.officeHours || "Mon–Fri: 10:00 AM – 8:00 PM"}</span></div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Radio className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div><span className="text-muted-foreground">{t("about.radio")}</span><br /><span className="font-medium">{s.radioStation || "Radio Ihsaan FM"}</span></div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-serif text-base font-semibold">{t("contact.departmentEmails")}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <li>{t("contact.general")}: <span className="font-medium text-foreground">info@amyc.or.tz</span></li>
                  <li>{t("nav.education")}: <span className="font-medium text-foreground">education@amyc.or.tz</span></li>
                  <li>{t("contact.dept.dawah")}: <span className="font-medium text-foreground">dawah@amyc.or.tz</span></li>
                  <li>{t("contact.dept.welfare")}: <span className="font-medium text-foreground">welfare@amyc.or.tz</span></li>
                  <li>{t("nav.media")}: <span className="font-medium text-foreground">media@amyc.or.tz</span></li>
                  <li>{t("contact.dept.partnerships")}: <span className="font-medium text-foreground">partnerships@amyc.or.tz</span></li>
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">{t("contact.departmentNote")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>
    </>
  )
}
