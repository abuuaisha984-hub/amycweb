import { notFound } from "next/navigation"

export function assertPresent<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) notFound()
}
