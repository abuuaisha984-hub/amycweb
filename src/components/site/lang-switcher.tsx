"use client"

import { useLanguage } from "@/components/providers"
import { LOCALES, LOCALE_FLAGS, type Locale } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { ChevronDown, Globe } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageSwitcher({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  const { locale, setLocale } = useLanguage()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className="gap-1.5 px-2 font-medium"
          aria-label="Switch language"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold">{LOCALE_FLAGS[locale]}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {LOCALES.map((l: Locale) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLocale(l)}
            className={`gap-2 ${locale === l ? "bg-accent/40 font-semibold" : ""}`}
          >
            <span className="inline-flex h-5 w-7 items-center justify-center rounded bg-primary/10 text-[0.6rem] font-bold text-primary">
              {LOCALE_FLAGS[l]}
            </span>
            <span>{l === "en" ? "English" : l === "sw" ? "Kiswahili" : "العربية"}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
