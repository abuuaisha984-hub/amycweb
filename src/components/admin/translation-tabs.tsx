"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { type Locale, LOCALES, LOCALE_FLAGS, LOCALE_LABELS } from "@/lib/i18n"

type LangTab = { locale: Locale; label: string; flag: string }

const TABS: LangTab[] = LOCALES.map((l) => ({
  locale: l,
  label: LOCALE_LABELS[l],
  flag: LOCALE_FLAGS[l],
}))

export function TranslationTabs({
  active,
  onChange,
  children,
}: {
  active: Locale
  onChange: (l: Locale) => void
  children: (locale: Locale) => ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1 border-b border-border pb-2">
        <span className="me-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Language:</span>
        {TABS.map((tab) => (
          <button
            key={tab.locale}
            type="button"
            onClick={() => onChange(tab.locale)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
              active === tab.locale
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-accent/30"
            )}
          >
            <span className="text-[0.6rem] font-bold">{tab.flag}</span>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{children(active)}</div>
      <p className="mt-3 text-xs text-muted-foreground">Translations are optional. You can create an item using English, Kiswahili, or Arabic. Blank languages use the primary content.</p>
    </div>
  )
}

/** Helper to read/write a nested translation field from a JSON object. */
export function getTrField(translations: Record<string, any>, locale: Locale, field: string): string {
  return translations?.[locale]?.[field] || ""
}

export function setTrField(translations: Record<string, any>, locale: Locale, field: string, value: string): Record<string, any> {
  const next = { ...translations }
  if (!next[locale]) next[locale] = {}
  next[locale][field] = value
  return next
}
