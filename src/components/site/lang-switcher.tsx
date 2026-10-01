"use client"

import { useLanguage } from "@/components/providers"
import { LOCALES, type Locale } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  const { locale, setLocale } = useLanguage()
  return (
    <div className="flex items-center rounded-full border border-border bg-card/50 p-0.5" role="group" aria-label="Language switcher">
      {LOCALES.map((l: Locale) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-current={locale === l}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold transition",
            locale === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l === "en" ? "EN" : l === "sw" ? "SW" : "ع"}
        </button>
      ))}
    </div>
  )
}
