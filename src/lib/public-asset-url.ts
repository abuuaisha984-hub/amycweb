const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "amyc-public"

export function publicAssetUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value
  if (!value.startsWith("/uploads/")) return value
  const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")
  if (!baseUrl) return value
  return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}${value}`
}
