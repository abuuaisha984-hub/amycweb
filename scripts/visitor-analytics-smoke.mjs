import assert from "node:assert/strict"
import { PrismaClient } from "@prisma/client"

process.env.DATABASE_URL = "file:../db/custom.db"
const db = new PrismaClient()
const base = "http://127.0.0.1:3000"
const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`
const paths = [`/en/__analytics-check-${token}-1`, `/en/__analytics-check-${token}-2`, `/en/__analytics-check-${token}-3`]

async function visit(pathname, headers = {}) {
  return fetch(`${base}/api/analytics/visit`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ pathname, referrer: headers.referer || "" }),
  })
}

let visitorIds = []
try {
  const first = await visit(paths[0], { "cf-ipcountry": "TZ", "cf-region": "Tanga", "cf-ipcity": "Korogwe" })
  assert.equal(first.status, 202, "new visitor request is accepted")
  const firstCookie = first.headers.get("set-cookie")?.split(";")[0]
  assert.ok(firstCookie?.startsWith("amyc_visitor_id="), "new visitor receives anonymous cookie")

  const returning = await fetch(`${base}/api/analytics/visit`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: firstCookie },
    body: JSON.stringify({ pathname: paths[1] }),
  })
  assert.equal(returning.status, 202, "returning visitor request is accepted")

  const international = await visit(paths[2], {
    "x-vercel-ip-country": "GB",
    "x-vercel-ip-country-region": "England",
    "x-vercel-ip-city": "London",
    referer: "https://www.google.com/search?q=private-query",
  })
  assert.equal(international.status, 202, "international visitor request is accepted")

  const events = await db.visitEvent.findMany({ where: { pathname: { in: paths } }, orderBy: { pathname: "asc" } })
  assert.equal(events.length, 3, "three page visits are recorded")
  visitorIds = [...new Set(events.map((event) => event.visitorId).filter(Boolean))]
  assert.equal(visitorIds.length, 2, "returning cookie remains one unique visitor")
  const tanzania = events.find((event) => event.pathname === paths[0])
  const uk = events.find((event) => event.pathname === paths[2])
  assert.equal(tanzania?.country, "TZ")
  assert.equal(tanzania?.region, "Tanga")
  assert.equal(tanzania?.city, "Korogwe")
  assert.equal(uk?.country, "GB")
  assert.equal(uk?.city, "London")
  assert.equal(uk?.referrerHost, "www.google.com", "query string is not stored")

  const rangeStart = new Date(Date.now() - 60_000)
  const rangeEnd = new Date(Date.now() + 60_000)
  const [withinRange, outsideRange, emptyPages] = await Promise.all([
    db.visitEvent.count({ where: { pathname: { in: paths }, createdAt: { gte: rangeStart, lt: rangeEnd } } }),
    db.visitEvent.count({ where: { pathname: { in: paths }, createdAt: { lt: rangeStart } } }),
    db.visitEvent.groupBy({ by: ["pathname"], where: { pathname: `/en/__analytics-empty-${token}` }, _count: { _all: true } }),
  ])
  assert.equal(withinRange, 3, "selected time range includes the matching page views")
  assert.equal(outsideRange, 0, "date filter excludes records outside its range")
  assert.equal(emptyPages.length, 0, "empty analytics queries return no records")

  const [regionGroups, countryGroups] = await Promise.all([
    db.$queryRaw`SELECT "region", COUNT(DISTINCT "visitorId") AS "visitors" FROM "VisitEvent" WHERE "pathname" IN (${paths[0]}, ${paths[1]}, ${paths[2]}) AND "country" = 'TZ' GROUP BY "region"`,
    db.visitor.groupBy({ by: ["country"], where: { id: { in: visitorIds } }, _count: { _all: true } }),
  ])
  assert.equal(Number(regionGroups.find((row) => row.region === "Tanga")?.visitors), 1, "regional count is unique visitors")
  assert.deepEqual(countryGroups.map((row) => row.country).sort(), ["GB", "TZ"])
  console.log("Visitor analytics smoke checks passed: new/returning visitor, page views, date filters, empty query, proxy location, regional unique count, international country, and referrer privacy.")
} finally {
  const rows = await db.visitEvent.findMany({ where: { pathname: { in: paths } }, select: { visitorId: true } }).catch(() => [])
  visitorIds = [...new Set([...visitorIds, ...rows.map((row) => row.visitorId).filter(Boolean)])]
  await db.visitEvent.deleteMany({ where: { pathname: { in: paths } } }).catch(() => undefined)
  if (visitorIds.length) await db.visitor.deleteMany({ where: { id: { in: visitorIds } } }).catch(() => undefined)
  await db.$disconnect()
}
