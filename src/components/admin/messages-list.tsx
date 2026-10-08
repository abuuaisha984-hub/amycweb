"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, Calendar } from "lucide-react"
import { toast } from "sonner"

type Message = {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: string
  createdAt: string
}

const STATUSES = ["NEW", "READ", "REPLIED", "CLOSED"]
const statusColor: Record<string, string> = {
  NEW: "bg-accent text-accent-foreground",
  READ: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  REPLIED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  CLOSED: "bg-muted text-muted-foreground",
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function MessagesList({ messages: initial }: { messages: Message[] }) {
  const [messages, setMessages] = useState(initial)

  async function updateStatus(id: string, status: string) {
    const previous = messages.find((message) => message.id === id)?.status
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, status } : x)))
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Update failed")
      toast.success(`Marked as ${status}.`)
    } catch {
      if (previous) setMessages((m) => m.map((x) => (x.id === id ? { ...x, status: previous } : x)))
      toast.error("Failed to update. Please try again.")
    }
  }

  if (messages.length === 0) {
    return (
      <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Mail className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      </CardContent></Card>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <Card key={m.id}>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{m.name}</h3>
                  <Badge className={`${statusColor[m.status]} text-[0.65rem]`} variant="secondary">{m.status}</Badge>
                </div>
                <p className="mt-0.5 text-sm font-medium text-primary">{m.subject}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-primary"><Mail className="h-3 w-3" />{m.email}</a>
                  {m.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{m.phone}</span>}
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(m.createdAt)}</span>
                </div>
              </div>
              <Select value={m.status} onValueChange={(v) => updateStatus(m.id, v)}>
                <SelectTrigger className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="mt-3 rounded-lg bg-secondary/40 p-3 text-sm text-muted-foreground whitespace-pre-wrap">{m.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
