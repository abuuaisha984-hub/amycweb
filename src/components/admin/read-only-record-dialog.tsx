"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function labelFor(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase())
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (value instanceof Date) return value.toLocaleString()
  if (Array.isArray(value)) return value.length ? value.map((item) => typeof item === "object" && item ? JSON.stringify(item) : String(item)).join("\n") : "—"
  if (typeof value === "object") return JSON.stringify(value, null, 2)
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value)
}

export function ReadOnlyRecordDialog({
  title,
  record,
  onOpenChange,
}: {
  title: string
  record: Record<string, unknown> | null
  onOpenChange: (open: boolean) => void
}) {
  return <Dialog open={!!record} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Read-only record details.</DialogDescription></DialogHeader>
      {record && <dl className="grid gap-4 py-2 sm:grid-cols-2">
        {Object.entries(record).map(([key, value]) => <div key={key} className="min-w-0 rounded-md border p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{labelFor(key)}</dt>
          <dd className="mt-1 break-words whitespace-pre-wrap text-sm">{displayValue(value)}</dd>
        </div>)}
      </dl>}
    </DialogContent>
  </Dialog>
}
