"use client"

import { Button } from "@/components/ui/button"

export function AdminPageControls({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Admin list pages" className="flex items-center justify-end gap-3 py-4">
      <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
      <span className="text-sm tabular-nums text-muted-foreground">Page {page} of {totalPages}</span>
      <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
    </nav>
  )
}
