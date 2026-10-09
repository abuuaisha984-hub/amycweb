import { cache } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// A protected page and its layout share one session revalidation per render.
// React clears this memoization between requests, so status/authVersion checks
// still run again on the next request.
export const getAdminPageSession = cache(() => getServerSession(authOptions))
