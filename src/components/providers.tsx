"use client"

import { ThemeProvider } from "next-themes"
import { SessionProvider } from "next-auth/react"
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { DEFAULT_LOCALE, type Locale, isRTL, UI_STRINGS } from "@/lib/i18n"

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

function detectInitialLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE
  const m = document.cookie.match(/amyc-locale=(en|sw|ar)/)
  return (m?.[1] as Locale) || DEFAULT_LOCALE
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(detectInitialLocale())
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = isRTL(locale) ? "rtl" : "ltr"
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    document.cookie = `amyc-locale=${l};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
    document.documentElement.lang = l
    document.documentElement.dir = isRTL(l) ? "rtl" : "ltr"
  }, [])

  const t = useCallback(
    (key: string) => UI_STRINGS[locale]?.[key] ?? UI_STRINGS.en[key] ?? key,
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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <SessionProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
