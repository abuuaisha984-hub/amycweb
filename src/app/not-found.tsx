import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="container-institutional grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">404</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Page not found</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">The page you are looking for may have moved or is no longer available.</p>
        <Button asChild className="mt-7"><Link href="/en">Return to AMYC home</Link></Button>
      </div>
    </main>
  )
}
