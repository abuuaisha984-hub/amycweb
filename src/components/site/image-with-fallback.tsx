"use client"

import { useState, type ImgHTMLAttributes, type ReactNode } from "react"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = ImgHTMLAttributes<HTMLImageElement> & { fallback?: ReactNode }

export function ImageWithFallback({ fallback, className, alt = "", onError, ...props }: Props) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <div role="img" aria-label={alt || "Image unavailable"} className={cn("grid place-items-center bg-secondary text-muted-foreground", className)}>
      {fallback || <ImageOff className="h-7 w-7 opacity-50" aria-hidden="true" />}
    </div>
  }
  return <img {...props} alt={alt} className={className} onError={(event) => { setFailed(true); onError?.(event) }} />
}
