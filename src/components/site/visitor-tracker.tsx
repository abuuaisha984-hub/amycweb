"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

let lastTrackedPathname: string | null = null

export function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || !/^\/(en|sw|ar)(?:\/|$)/.test(pathname)) return
    if (lastTrackedPathname === pathname) return
    lastTrackedPathname = pathname
    const payload = JSON.stringify({ pathname, referrer: document.referrer })
    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined)
  }, [pathname])

  return null
}
