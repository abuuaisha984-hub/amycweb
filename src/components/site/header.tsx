"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AmycLogo } from "@/components/site/logo"
import { NAV } from "@/components/site/nav-config"
import { LanguageSwitcher } from "@/components/site/lang-switcher"
import { SearchDialog } from "@/components/site/search-dialog"
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
import { Menu, Search, Phone, Mail, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
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
              <Phone className="h-3.5 w-3.5" /> Mon–Fri: 10:00 AM – 8:00 PM
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="opacity-80">Tanga, Tanzania</span>
            <span className="h-3 w-px bg-primary-foreground/20" />
            <Link href="/admin" className="opacity-90 transition hover:opacity-100">Admin</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div
        className={cn(
          "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-shadow",
          scrolled ? "shadow-soft" : ""
        )}
      >
        <div className="container-institutional flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
          <Link href="/" className="shrink-0" aria-label="AMYC home">
            <AmycLogo />
          </Link>

          {/* Desktop nav */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              {NAV.map((item) => (
                <NavigationMenuItem key={item.label}>
                  {item.children ? (
                    <>
                      <NavigationMenuTrigger className="h-9 bg-transparent px-3 text-sm font-medium data-[state=open]:bg-accent/40">
                        {item.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid w-[34rem] gap-1 p-3 md:w-[40rem] md:grid-cols-2">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="group block rounded-md p-3 transition hover:bg-accent/40"
                            >
                              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                {child.label}
                                <ChevronRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-60" />
                              </div>
                              {child.description && (
                                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{child.description}</p>
                              )}
                            </Link>
                          ))}
                        </div>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "h-9 bg-transparent px-3 text-sm font-medium")}>
                      <Link href={item.href}>{item.label}</Link>
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-4.5 w-4.5" />
            </Button>
            <LanguageSwitcher />
            <Button asChild size="sm" className="hidden h-9 bg-primary px-4 text-sm font-semibold sm:inline-flex">
              <Link href="/contact">Contact</Link>
            </Button>

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex items-center justify-between border-b px-4 py-4">
                  <AmycLogo />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <nav className="px-2 py-3">
                  {NAV.map((item) => (
                    <div key={item.label} className="border-b last:border-0">
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between px-3 py-3 text-sm font-semibold text-foreground"
                      >
                        {item.label}
                        {item.children && <ChevronRight className="h-4 w-4 opacity-40" />}
                      </Link>
                      {item.children && (
                        <div className="pb-2">
                          {item.children.map((c) => (
                            <Link
                              key={c.href}
                              href={c.href}
                              onClick={() => setMobileOpen(false)}
                              className="block px-6 py-2 text-[0.82rem] text-muted-foreground transition hover:text-primary"
                            >
                              {c.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="mt-4 flex flex-col gap-2 px-3">
                    <Button asChild className="bg-primary" onClick={() => setMobileOpen(false)}>
                      <Link href="/contact">Contact AMYC</Link>
                    </Button>
                    <Button asChild variant="outline" onClick={() => setMobileOpen(false)}>
                      <Link href="/admin">Admin Login</Link>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
