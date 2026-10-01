import { db } from "@/lib/db"
import { PageHero } from "@/components/site/page-hero"
import { Section, Eyebrow } from "@/components/site/sections"
import { Card, CardContent } from "@/components/ui/card"
import { ContactForm } from "@/components/site/contact-form"
import { Mail, Phone, MapPin, Clock, Radio } from "lucide-react"

async function getSettings() {
  const rows = await db.siteSetting.findMany()
  const map: Record<string, any> = {}
  for (const s of rows) {
    try { map[s.key] = JSON.parse(s.value) } catch { map[s.key] = s.value }
  }
  return map
}

export default async function ContactPage() {
  const s = await getSettings()
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch with AMYC"
        description="Have a question, partnership idea, or need to reach a specific department? Send us a message and we will respond shortly."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Eyebrow>Send a Message</Eyebrow>
            <h2 className="mt-4 font-serif text-2xl font-semibold tracking-tight">We'd love to hear from you</h2>
            <p className="mt-2 text-sm text-muted-foreground">Fill in the form below and our team will get back to you.</p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-primary/15 bg-secondary/30">
              <CardContent className="p-6">
                <h3 className="font-serif text-base font-semibold">Contact Details</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div><span className="text-muted-foreground">Address</span><br /><span className="font-medium">{s.address || "Tanga, Tanzania"}</span></div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div><span className="text-muted-foreground">Email</span><br /><a href={`mailto:${s.email || "info@amyc.or.tz"}`} className="font-medium hover:text-primary">{s.email || "info@amyc.or.tz"}</a></div>
                  </li>
                  {s.phone && (
                    <li className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div><span className="text-muted-foreground">Phone</span><br /><span className="font-medium">{s.phone}</span></div>
                    </li>
                  )}
                  <li className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div><span className="text-muted-foreground">Office Hours</span><br /><span className="font-medium">{s.officeHours || "Mon–Fri: 10:00 AM – 8:00 PM"}</span></div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Radio className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div><span className="text-muted-foreground">Radio</span><br /><span className="font-medium">{s.radioStation || "Radio Ihsaan FM"}</span></div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-serif text-base font-semibold">Departmental Emails</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <li>General: <span className="font-medium text-foreground">info@amyc.or.tz</span></li>
                  <li>Education: <span className="font-medium text-foreground">education@amyc.or.tz</span></li>
                  <li>Da'wah: <span className="font-medium text-foreground">dawah@amyc.or.tz</span></li>
                  <li>Welfare: <span className="font-medium text-foreground">welfare@amyc.or.tz</span></li>
                  <li>Media: <span className="font-medium text-foreground">media@amyc.or.tz</span></li>
                  <li>Partnerships: <span className="font-medium text-foreground">partnerships@amyc.or.tz</span></li>
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">Departmental emails are suggested channels — to be confirmed with AMYC.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>
    </>
  )
}
