import { cache } from "react"
import { db } from "@/lib/db"
import { localizedField, ui, formatDate, type Locale } from "@/lib/i18n"

/**
 * Load site settings as a parsed object.
 */
export const getSettings = cache(async (): Promise<Record<string, any>> => {
  const rows = await db.siteSetting.findMany()
  const map: Record<string, any> = {}
  for (const s of rows) {
    try {
      map[s.key] = JSON.parse(s.value)
    } catch {
      map[s.key] = s.value
    }
  }
  return map
})

/**
 * Resolve a localized setting value.
 * Settings like tagline/mission/vision are stored as {en, sw, ar} objects.
 * Falls back to English, then to the raw value if it's a plain string.
 */
export function setting(settings: Record<string, any>, key: string, locale: Locale): string {
  const val = settings[key]
  if (!val) return ""
  if (typeof val === "string") return val
  if (typeof val === "object") {
    return val[locale] || val.en || val.sw || val.ar || ""
  }
  return String(val)
}

export { localizedField, ui, formatDate }
export type { Locale }
