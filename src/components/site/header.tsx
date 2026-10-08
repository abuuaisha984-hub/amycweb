"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AmycLogo } from "@/components/site/logo"
import { NAV, lp } from "@/components/site/nav-config"
import { LanguageSwitcher } from "@/components/site/lang-switcher"
import { SearchDialog } from "@/components/site/search-dialog"
import { useLanguage } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Menu, Search, Mail, Phone, ChevronRight, X, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { locale, t } = useLanguage()
  const isActive = (href: string) => {
    const localizedHref = lp(locale, href).split("?")[0]
    return href === "/" ? pathname === localizedHref : pathname === localizedHref || pathname.startsWith(`${localizedHref}/`)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top utility bar */}
      <div className="hidden border-b border-primary-foreground/10 bg-primary text-primary-foreground md:block">
        <div className="container-institutional flex h-9 items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <a href="mailto:info@amyc.or.tz" className="inline-flex items-center gap-1.5 opacity-90 transition hover:opacity-100">
              <Mail className="h-3.5 w-3.5" /> info@amyc.or.tz
            </a>
            <span className="inline-flex items-center gap-1.5 opacity-90">
              <Phone className="h-3.5 w-3.5" /> {t("contact.officeHours")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-80">Tanga, Tanzania</span>
            <span className="h-3 w-px bg-primary-foreground/20" />
            <Link href="/admin" className="opacity-90 transition hover:opacity-100">{t("nav.admin")}</Link>
            <span className="h-3 w-px bg-primary-foreground/20" />
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setSearchOpen(true)}
                aria-label={t("search.title")}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            )}
            {mounted && <LanguageSwitcher variant="ghost" />}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div
        className={cn(
          "border-b-[3px] border-accent/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 transition-shadow",
          scrolled ? "shadow-soft" : ""
        )}
      >
        <div className="container-institutional flex h-16 items-center justify-between gap-2 lg:h-[4.5rem]">
          <Link href={lp(locale, "/")} className="shrink-0" aria-label="AMYC home">
            <AmycLogo />
          </Link>

          {/* Desktop nav — deferred to client to avoid Radix useId hydration mismatch */}
          {mounted ? (
            <NavigationMenu className="hidden xl:flex flex-1">
              <NavigationMenuList className="gap-1 flex-1 justify-center">
                {NAV.map((item) => (
                  <NavigationMenuItem key={item.labelKey}>
                    {item.children ? (
                      <>
                        <NavigationMenuTrigger className={cn("h-10 rounded-full bg-transparent px-3 text-sm font-semibold text-foreground/80 transition hover:bg-primary/8 hover:text-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary", isActive(item.href) && "bg-primary/10 text-primary")}>
                          {t(item.labelKey)}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <div className="grid w-[34rem] gap-1 rounded-xl border border-primary/10 bg-background/98 p-3 shadow-card md:w-[40rem] md:grid-cols-2">
                            {item.children.map((child) => (
                              <Link
                                key={child.href}
                                href={lp(locale, child.href)}
                                className="group block rounded-lg p-3 transition hover:bg-primary/7"
                              >
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                  {t(child.labelKey)}
                                  <ChevronRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-60 rtl:rotate-180" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "h-10 rounded-full bg-transparent px-3 text-sm font-semibold text-foreground/80 transition hover:bg-primary/8 hover:text-primary", isActive(item.href) && "bg-primary/10 text-primary")}>
                        <Link href={lp(locale, item.href)}>{t(item.labelKey)}</Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            <nav className="hidden xl:flex flex-1" aria-label="Main">
              <div className="flex flex-1 gap-1 justify-center">
                {NAV.map((item) => (
                  <Link key={item.labelKey} href={lp(locale, item.href)} className="px-3 text-sm font-medium text-foreground/70">
                    {t(item.labelKey)}
                  </Link>
                ))}
              </div>
            </nav>
          )}

          <div className="flex items-center gap-1.5">
            <Button asChild size="sm" className="hidden h-9 bg-primary px-3 text-sm font-semibold sm:inline-flex">
              <Link href={lp(locale, "/contact")}>{t("nav.contact")}</Link>
            </Button>

            {/* Mobile menu — deferred to client to avoid Radix useId hydration mismatch */}
            {mounted ? (
              <Sheet open={mobileOpen} onOpenChange={(open) => { setMobileOpen(open); if (!open) setOpenMobileMenu(null) }}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-primary/15 bg-primary/5 xl:hidden" aria-label={t("nav.openMenu")}>
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side={locale === "ar" ? "left" : "right"} className="w-[90vw] max-w-sm overflow-y-auto border-primary/10 bg-background p-0 shadow-card">
                  <SheetTitle className="sr-only">{t("nav.siteNavigation")}</SheetTitle>
                  <div className="flex items-center justify-between border-b border-primary/10 bg-primary/[0.03] px-4 py-4">
                    <AmycLogo />
                    <Button variant="ghost" size="icon" aria-label={t("nav.closeMenu")} className="h-9 w-9 rounded-full" onClick={() => setMobileOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <nav className="px-3 py-4">
                    <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-white/20 bg-black p-3 text-white shadow-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-10 flex-1 justify-start gap-2 text-white hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          setSearchOpen(true)
                          setMobileOpen(false)
                        }}
                      >
                        <Search className="h-4 w-4" />
                        {t("search.title")}
                      </Button>
                      <LanguageSwitcher variant="mobile" />
                    </div>
                    {NAV.map((item) => {
                      const expanded = openMobileMenu === item.labelKey
                      const submenuId = `mobile-submenu-${item.labelKey.replace(/[^a-z0-9-]/gi, "-")}`
                      return <div key={item.labelKey} className="border-b border-border/80 py-0.5 last:border-0">
                        {item.children ? <>
                          <div className="flex items-center gap-1">
                            <Link
                              href={lp(locale, item.href)}
                              onClick={() => setMobileOpen(false)}
                              className={cn("flex min-h-12 flex-1 items-center rounded-lg px-3 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/5 hover:text-primary", isActive(item.href) && "text-primary")}
                            >{t(item.labelKey)}</Link>
                            <button
                              type="button"
                              aria-label={`${expanded ? t("nav.collapseSection") : t("nav.expandSection")} ${t(item.labelKey)}`}
                              aria-expanded={expanded}
                              aria-controls={submenuId}
                              onClick={() => setOpenMobileMenu(expanded ? null : item.labelKey)}
                              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
                            >{expanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button>
                          </div>
                          <div
                            id={submenuId}
                            aria-hidden={!expanded}
                            className={cn("grid transition-[grid-template-rows,opacity] duration-200 ease-out", expanded ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0")}
                          >
                            <div className="min-h-0 overflow-hidden">
                              <div className="mb-2 ms-4 space-y-0.5 border-s border-primary/15 ps-3">
                                {item.children.map((child) => <Link
                                  key={child.href}
                                  href={lp(locale, child.href)}
                                  tabIndex={expanded ? 0 : -1}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex min-h-10 items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
                                >{t(child.labelKey)}</Link>)}
                              </div>
                            </div>
                          </div>
                        </> : <Link
                          href={lp(locale, item.href)}
                          onClick={() => setMobileOpen(false)}
                          className={cn("flex min-h-12 items-center rounded-lg px-3 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/5 hover:text-primary", isActive(item.href) && "bg-primary/5 text-primary")}
                        >{t(item.labelKey)}</Link>}
                      </div>
                    })}
                    <div className="mt-4 flex flex-col gap-2 px-3">
                      <Button asChild className="bg-primary" onClick={() => setMobileOpen(false)}>
                        <Link href={lp(locale, "/contact")}>{t("cta.contact")}</Link>
                      </Button>
                      <Button asChild variant="outline" onClick={() => setMobileOpen(false)}>
                        <Link href="/admin">{t("nav.admin")} Login</Link>
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            ) : (
              <div className="h-9 w-9 xl:hidden" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>

      {mounted && <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />}
    </header>
  )
}
