import { cn } from "@/lib/utils"

export function AmycLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 48 48" className="h-9 w-9 shrink-0" fill="none" aria-hidden="true">
        {/* Outer emerald ring */}
        <circle cx="24" cy="24" r="22" className="fill-primary" />
        {/* Gold inner ring */}
        <circle cx="24" cy="24" r="19.5" className="stroke-accent" strokeWidth="1" fill="none" opacity="0.7" />
        {/* Dome + body */}
        <path
          d="M24 9.5c-3.6 0-6.5 2.7-6.5 6v1.2c-1.4 1.1-2.3 2.8-2.3 4.7v9.6h17.6v-9.6c0-1.9-.9-3.6-2.3-4.7v-1.2c0-3.3-2.9-6-6.5-6Z"
          className="fill-primary-foreground"
          opacity="0.95"
        />
        <rect x="15.2" y="31" width="17.6" height="3.4" className="fill-primary-foreground" opacity="0.95" />
        {/* Crescent accent */}
        <path
          d="M30.5 11.2a4.6 4.6 0 1 0 0 6.6 3.7 3.7 0 1 1 0-6.6Z"
          className="fill-accent"
        />
        {/* Base line */}
        <rect x="13" y="36.5" width="22" height="2" rx="1" className="fill-accent" />
      </svg>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[1.05rem] font-semibold tracking-tight text-foreground">AMYC</span>
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Muslim Youth Centre
          </span>
        </span>
      )}
    </span>
  )
}
