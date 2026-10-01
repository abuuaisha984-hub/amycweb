"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Send, CheckCircle2, Loader2 } from "lucide-react"

export function ContactForm() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    try {
      const res = await fetch("/api/contact", { method: "POST", body: data })
      const json = await res.json()
      if (json.ok) {
        setDone(true)
        toast.success("Message sent. We will get back to you soon, in shā’ Allāh.")
        form.reset()
      } else {
        toast.error(json.message || "Something went wrong. Please try again.")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 p-10 text-center dark:bg-emerald-950/20">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        <h3 className="mt-4 font-serif text-lg font-semibold">Message received</h3>
        <p className="mt-1 text-sm text-muted-foreground">Thank you for reaching out to AMYC. We will respond shortly.</p>
        <Button variant="outline" className="mt-4" onClick={() => setDone(false)}>Send another message</Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name *</Label>
          <Input id="name" name="name" required placeholder="Your name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" placeholder="+255 ..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject *</Label>
          <Input id="subject" name="subject" required placeholder="How can we help?" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Message *</Label>
        <Textarea id="message" name="message" required rows={5} placeholder="Your message…" />
      </div>
      <Button type="submit" className="w-full bg-primary sm:w-auto" disabled={loading}>
        {loading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending…</> : <><Send className="mr-1.5 h-4 w-4" /> Send Message</>}
      </Button>
      <p className="text-xs text-muted-foreground">We respect your privacy. Your details are used only to respond to your inquiry.</p>
    </form>
  )
}
