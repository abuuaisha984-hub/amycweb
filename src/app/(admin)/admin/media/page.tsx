import { db } from "@/lib/db"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AdminMediaPage() {
  const [galleries, mediaItems] = await Promise.all([
    db.gallery.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { items: true } } } }),
    db.mediaItem.count(),
  ])
  return (
    <div>
      <AdminPageHeader title="Media & Gallery" description={`${galleries.length} galleries · ${mediaItems} media items.`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {galleries.map((g) => (
          <Card key={g.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-semibold">{g.title}</h3>
                {g.category && <Badge variant="secondary" className="text-[0.65rem]">{g.category}</Badge>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{g._count.items} items · {new Date(g.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
