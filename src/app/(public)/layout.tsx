import { SiteHeader } from "@/components/site/header"
import { SiteFooter } from "@/components/site/footer"
import { BackToTop } from "@/components/site/back-to-top"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <BackToTop />
    </div>
  )
}
