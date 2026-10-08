import { cn } from "@/lib/utils"
import Image from "next/image"

export function AmycLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
        <Image src="/images/Markaz-Logo.png" alt="" fill sizes="36px" className="object-cover" />
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[1.05rem] font-semibold tracking-tight text-foreground">AMYC</span>
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Ansaar Muslim Youth Centre
          </span>
        </span>
      )}
    </span>
  )
}
