import { cookies } from "next/headers"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n"

export const LOCALE_COOKIE = "amyc-locale"

export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const v = store.get(LOCALE_COOKIE)?.value as Locale | undefined
  if (v === "en" || v === "sw" || v === "ar") return v
  return DEFAULT_LOCALE
}
