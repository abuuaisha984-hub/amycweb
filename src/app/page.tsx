import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n"

export default async function RootPage() {
  const store = await cookies()
  const saved = store.get("amyc-locale")?.value as Locale | undefined
  const loc = saved && isLocale(saved) ? saved : DEFAULT_LOCALE
  redirect(`/${loc}`)
}
