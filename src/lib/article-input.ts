import { z } from "zod"

const optionalDate = z.union([
  z.string().datetime({ offset: true }),
  z.iso.date(),
  z.literal(""),
  z.null(),
]).optional()

const translationText = z.string().trim().max(200_000).optional()
const articleTranslationsSchema = z.record(z.string(), z.object({
  title: z.string().trim().max(240).optional(),
  excerpt: z.string().trim().max(1200).optional(),
  content: translationText,
}).strict()).superRefine((translations, context) => {
  for (const locale of Object.keys(translations)) {
    if (!(["en", "sw", "ar"] as string[]).includes(locale)) {
      context.addIssue({ code: "custom", message: `Unsupported article language: ${locale}`, path: [locale] })
    }
  }
})

const translationsInput = z.union([
  articleTranslationsSchema,
  z.string().max(250_000).transform((raw, context) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      context.addIssue({ code: "custom", message: "Translations must be valid JSON" })
      return z.NEVER
    }
    const result = articleTranslationsSchema.safeParse(parsed)
    if (!result.success) {
      for (const issue of result.error.issues) context.addIssue({ ...issue, path: ["translations", ...issue.path] })
      return z.NEVER
    }
    return result.data
  }),
]).transform((translations) => JSON.stringify(translations))

export const articleInputSchema = z.object({
  slug: z.string().trim().min(1).max(180).optional(),
  title: z.string().trim().min(1).max(240).optional(),
  excerpt: z.string().trim().min(1).max(1200).optional(),
  content: z.string().min(1).max(200_000).optional(),
  kind: z.enum(["NEWS", "ANNOUNCEMENT"]).optional(),
  category: z.string().trim().max(100).nullable().optional(),
  author: z.string().trim().max(160).nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  featured: z.boolean().optional(),
  featuredImage: z.string().trim().max(1000).nullable().optional(),
  imageCredit: z.string().trim().max(500).nullable().optional(),
  scope: z.enum(["HQ", "REGION", "SCHOOL", "PROGRAMME"]).optional(),
  scopeRegionId: z.string().trim().max(100).nullable().optional(),
  publishedAt: optionalDate,
  expiresAt: optionalDate,
  translations: translationsInput.optional(),
}).strict()

export function parseArticleDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
