import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Eyebrow } from "@/components/site/sections"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export type Crumb = { label: string; href?: string }

export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  breadcrumbs?: Crumb[]
  children?: ReactNode
  className?: string
}) {
  return (
    <section className={cn("relative isolate overflow-hidden border-b border-border bg-primary text-primary-foreground", className)}>
      <div className="absolute inset-0 -z-10 bg-pattern opacity-[0.06]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-px gold-rule opacity-60" />
      <div className="container-institutional py-12 sm:py-16">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-primary-foreground/60">
              {breadcrumbs.map((c, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  {c.href ? (
                    <Link href={c.href} className="transition hover:text-primary-foreground">{c.label}</Link>
                  ) : (
                    <span className="text-primary-foreground/90">{c.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3 opacity-50" />}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <Eyebrow className="text-accent [&_span]:bg-accent">{eyebrow}</Eyebrow>}
        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/80 text-pretty">{description}</p>
        )}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </section>
  )
}
