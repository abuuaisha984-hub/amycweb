"use client"

import { useLanguage } from "@/components/providers"
import { LOCALES, type Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ variant = "ghost" }: { variant?: "ghost" | "outline" | "mobile" }) {
  const { locale, setLocale } = useLanguage()
  const labels: Record<Locale, string> = { en: "English", sw: "Kiswahili", ar: "العربية" }

  const mobileLabels: Record<Locale, string> = { en: "EN", sw: "SW", ar: "AR" }

  return (
    <div
      className={cn(
        "grid shrink-0 grid-cols-3 items-center gap-0.5 rounded-xl p-1",
        variant === "mobile"
          ? "border border-white/35 bg-black"
          : variant === "ghost" ? "border border-primary-foreground/25 bg-primary-foreground/10" : "border border-border bg-card shadow-sm"
      )}
      role="group"
      aria-label="Choose language"
    >
      {LOCALES.map((language: Locale) => (
        <button
          key={language}
          type="button"
          onClick={() => setLocale(language)}
          aria-pressed={locale === language}
          aria-label={labels[language]}
          lang={language}
          dir={language === "ar" ? "rtl" : "ltr"}
          className={cn(
            "min-h-9 whitespace-nowrap rounded-lg px-2 py-1.5 text-[0.7rem] font-semibold transition-colors focus-visible:outline-offset-1 sm:px-2.5 sm:text-xs",
            locale === language
              ? variant === "mobile" ? "bg-black text-white ring-1 ring-inset ring-accent" : variant === "ghost" ? "bg-white text-primary shadow-sm" : "bg-primary text-primary-foreground shadow-sm"
              : variant === "mobile" ? "bg-black text-white hover:bg-white/15 hover:text-white" : variant === "ghost" ? "text-white/90 hover:bg-white/10 hover:text-white" : "text-foreground/75 hover:bg-secondary hover:text-foreground"
          )}
        >
          {variant === "mobile" ? mobileLabels[language] : labels[language]}
        </button>
      ))}
    </div>
  )
}
