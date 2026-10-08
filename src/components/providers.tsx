"use client"

import { SessionProvider } from "next-auth/react"
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DEFAULT_LOCALE, type Locale, isRTL, isLocale, UI_STRINGS } from "@/lib/i18n"

const LanguageContext = createContext<{
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
  rtl: boolean
}>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (k) => UI_STRINGS.en[k] ?? k,
  rtl: false,
})

export function useLanguage() {
  return useContext(LanguageContext)
}

function localeFromPathname(pathname: string): Locale {
  const m = pathname.match(/^\/(en|sw|ar)(?:\/|$)/)
  if (m && isLocale(m[1])) return m[1]
  return DEFAULT_LOCALE
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const l = localeFromPathname(pathname)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(l)
    document.documentElement.lang = l
    document.documentElement.dir = isRTL(l) ? "rtl" : "ltr"
    document.cookie = `amyc-locale=${l};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
  }, [pathname])

  const setLocale = useCallback(
    (l: Locale) => {
      const current = localeFromPathname(pathname)
      if (l === current) return
      const rest = pathname.replace(/^\/(en|sw|ar)(?=\/|$)/, "") || ""
      const next = `/${l}${rest || ""}`
      router.push(next)
    },
    [pathname, router]
  )

  const t = useCallback(
    (key: string) => {
      const v = UI_STRINGS[locale]?.[key]
      if (v === null || v === undefined) return UI_STRINGS.en[key] ?? key
      return v
    },
    [locale]
  )

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, rtl: isRTL(locale) }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </SessionProvider>
  )
}
