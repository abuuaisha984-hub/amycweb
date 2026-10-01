"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { AmycLogo } from "@/components/site/logo"
import { ADMIN_NAV, ROLE_LABELS } from "@/components/admin/nav-config"
import { isSuperAdmin } from "@/lib/rbac"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard, Newspaper, CalendarDays, GraduationCap, MapPin, FolderOpen,
  Image, Mail, FileText, ScrollText, Settings, Menu, LogOut, ExternalLink, X, Languages,
} from "lucide-react"
import { cn } from "@/lib/utils"

const ICONS: Record<string, any> = {
  LayoutDashboard, Newspaper, CalendarDays, GraduationCap, MapPin, FolderOpen,
  Image, Mail, FileText, ScrollText, Settings, Languages,
}

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode
  user: { name?: string | null; email?: string | null; role?: string }
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isLogin = pathname === "/admin/login"

  if (isLogin) {
    return <>{children}</>
  }

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/admin" className="[&_span]:text-sidebar-foreground [&_.text-muted-foreground]:text-sidebar-foreground/60">
          <AmycLogo />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scroll-elegant">
        {ADMIN_NAV.map((item) => {
          const Icon = ICONS[item.icon] || LayoutDashboard
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
          // Hide super-admin-only items from regular admins
          if (item.superAdminOnly && !isSuperAdmin(user.role)) return null
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/60 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View public site
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-md bg-sidebar-accent/50 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            {(user.name || user.email || "A").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-foreground">{user.name}</p>
            <p className="truncate text-[0.65rem] text-sidebar-foreground/60">{ROLE_LABELS[user.role || ""] || user.role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 transition hover:bg-destructive hover:text-destructive-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-sidebar lg:block">
        {Sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-sm font-semibold">Menu</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
              </div>
              {Sidebar}
            </SheetContent>
          </Sheet>
          <Link href="/admin" className="[&_span]:text-xs">
            <AmycLogo showText={false} />
          </Link>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
