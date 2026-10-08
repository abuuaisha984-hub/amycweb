import Link from "next/link"
import { Button } from "@/components/ui/button"

export function AdminPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Admin list pages" className="flex items-center justify-end gap-3 py-4">
      {page > 1 ? <Button asChild variant="outline" size="sm"><Link href={`?page=${page - 1}`}>Previous</Link></Button> : <Button variant="outline" size="sm" disabled>Previous</Button>}
      <span className="text-sm tabular-nums text-muted-foreground">Page {page} of {totalPages}</span>
      {page < totalPages ? <Button asChild variant="outline" size="sm"><Link href={`?page=${page + 1}`}>Next</Link></Button> : <Button variant="outline" size="sm" disabled>Next</Button>}
    </nav>
  )
}
