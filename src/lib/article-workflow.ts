export const ARTICLE_STATUSES = ["DRAFT", "PUBLISHED"] as const
export type ArticleWorkflowStatus = (typeof ARTICLE_STATUSES)[number]

export function allowedArticleTransitions(status: ArticleWorkflowStatus): ArticleWorkflowStatus[] {
  return status === "DRAFT" ? ["PUBLISHED"] : ["DRAFT"]
}

export function articleStatusAuditAction(previous: ArticleWorkflowStatus, next: ArticleWorkflowStatus): string {
  if (next === "PUBLISHED") return "PUBLISH"
  if (previous === "PUBLISHED" && next === "DRAFT") return "UNPUBLISH"
  return "UPDATE"
}
