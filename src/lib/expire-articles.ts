import { db } from "@/lib/db"

let lastArchiveCheck = 0
const CHECK_INTERVAL_MS = 60_000

/** Archive expired published announcements on public requests, without deleting them. */
export async function archiveExpiredAnnouncements() {
  const now = Date.now()
  if (now - lastArchiveCheck < CHECK_INTERVAL_MS) return
  lastArchiveCheck = now
  try {
    await db.article.updateMany({
      where: {
        kind: "ANNOUNCEMENT",
        status: "PUBLISHED",
        deletedAt: null,
        expiresAt: { lte: new Date(now) },
      },
      data: { status: "ARCHIVED" },
    })
  } catch (error) {
    lastArchiveCheck = 0
    console.error("Could not archive expired AMYC announcements", error)
  }
}
