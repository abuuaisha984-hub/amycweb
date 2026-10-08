import { randomBytes, randomUUID } from "node:crypto"
import { cp, copyFile, mkdir, rm } from "node:fs/promises"
import net from "node:net"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import { setTimeout as delay } from "node:timers/promises"
import { PrismaClient } from "@prisma/client"
import { encode } from "next-auth/jwt"

const root = process.cwd()
const backupPath = process.argv[2] ? path.resolve(process.argv[2]) : ""
const backupRoot = path.resolve(root, "db", "backups")
if (!backupPath || !backupPath.startsWith(`${backupRoot}${path.sep}`)) {
  throw new Error("Pass a verified backup directory under db/backups.")
}

const databaseUrlFromPath = (filePath) => `file:${path.resolve(filePath).replaceAll("\\", "/")}`
const testRoot = path.join(os.tmpdir(), `amyc-regional-auth-${randomUUID()}`)
const testDbPath = path.join(testRoot, "database.sqlite")
await mkdir(testRoot, { recursive: false })
await copyFile(path.join(backupPath, "database.sqlite"), testDbPath)

const secret = randomBytes(32).toString("base64url")
const db = new PrismaClient({ datasources: { db: { url: databaseUrlFromPath(testDbPath) } } })
let server
let serverOutput = ""

async function freePort() {
  const socket = net.createServer()
  await new Promise((resolve, reject) => socket.listen(0, "127.0.0.1", resolve).once("error", reject))
  const { port } = socket.address()
  await new Promise((resolve) => socket.close(resolve))
  return port
}

async function expectStatus(response, expected, label) {
  if (response.status !== expected) {
    const body = await response.text().catch(() => "")
    throw new Error(`${label}: expected HTTP ${expected}, got ${response.status}; ${body.slice(0, 300)}`)
  }
}

try {
  const regions = await db.region.findMany({ where: { deletedAt: null }, select: { id: true }, take: 2, orderBy: { name: "asc" } })
  if (regions.length < 2) throw new Error("The backup needs at least two regions for the isolation test.")
  const [regionA, regionB] = regions
  const testEmail = `regional-test-${randomUUID()}@example.invalid`
  const user = await db.user.create({
    data: {
      email: testEmail,
      name: "Regional Access Test",
      passwordHash: "test-only-not-used-for-login",
      role: "REGIONAL_EDITOR",
      status: "ACTIVE",
      scopeRegionId: regionA.id,
    },
  })
  const otherRegionArticle = await db.article.create({
    data: {
      slug: `regional-scope-test-${randomUUID()}`,
      title: "Isolated regional test item",
      excerpt: "Fixture in the other region.",
      content: "Fixture content.",
      kind: "NEWS",
      scope: "REGION",
      scopeRegionId: regionB.id,
      status: "DRAFT",
    },
  })
  const otherRegionLeader = await db.leader.create({
    data: {
      name: "Isolated regional leader",
      position: "Test fixture",
      category: "REGIONAL",
      regionId: regionB.id,
      status: "INACTIVE",
    },
  })

  const port = await freePort()
  const origin = `http://127.0.0.1:${port}`
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: databaseUrlFromPath(testDbPath), NEXTAUTH_SECRET: secret, NEXTAUTH_URL: origin },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  })
  server.stdout.on("data", (chunk) => { serverOutput = `${serverOutput}${chunk}`.slice(-6000) })
  server.stderr.on("data", (chunk) => { serverOutput = `${serverOutput}${chunk}`.slice(-6000) })

  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Test server exited early. ${serverOutput}`)
    try {
      const response = await fetch(`${origin}/api/auth/csrf`)
      if (response.ok) { ready = true; break }
    } catch {}
    await delay(500)
  }
  if (!ready) throw new Error(`Test server did not become ready. ${serverOutput}`)

  const cookieToken = await encode({
    token: { name: user.name, email: user.email, role: user.role, userId: user.id, scopeRegionId: regionA.id },
    secret,
    maxAge: 8 * 60 * 60,
  })
  const request = (url, method = "GET", body) => fetch(`${origin}${url}`, {
    method,
    headers: {
      cookie: `next-auth.session-token=${cookieToken}`,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

  const scopedRegionsResponse = await request("/api/admin/regions")
  await expectStatus(scopedRegionsResponse, 200, "Regional editor region list")
  const scopedRegions = await scopedRegionsResponse.json()
  if (!scopedRegions.regions.some(({ id }) => id === regionA.id) || scopedRegions.regions.some(({ id }) => id === regionB.id)) {
    throw new Error("Regional editor region list exposed or omitted the wrong region.")
  }

  const scopedNewsResponse = await request("/api/admin/news")
  await expectStatus(scopedNewsResponse, 200, "Regional editor news list")
  const scopedNews = await scopedNewsResponse.json()
  if (scopedNews.articles.some(({ scope, scopeRegionId }) => scope !== "REGION" || scopeRegionId !== regionA.id)) {
    throw new Error("Regional editor news list returned content outside its assigned region.")
  }
  if (scopedNews.articles.some(({ id }) => id === otherRegionArticle.id)) throw new Error("Other-region news fixture was visible.")

  const rejectedCreate = await request("/api/admin/news", "POST", {
    title: "Forbidden test content", excerpt: "test", content: "test",
    kind: "NEWS", scope: "REGION", scopeRegionId: regionB.id, status: "DRAFT",
  })
  await expectStatus(rejectedCreate, 403, "Create content in another region")

  const validUpdate = {
    title: otherRegionArticle.title, excerpt: otherRegionArticle.excerpt, content: otherRegionArticle.content,
    kind: "NEWS", scope: "REGION", scopeRegionId: regionB.id, status: "DRAFT",
  }
  await expectStatus(await request(`/api/admin/news/${otherRegionArticle.id}`, "PUT", validUpdate), 403, "Update content in another region")
  await expectStatus(await request(`/api/admin/news/${otherRegionArticle.id}`, "DELETE"), 403, "Delete content in another region")
  await expectStatus(await request(`/api/admin/regions/${regionB.id}`, "PUT", {}), 403, "Update another region")
  await expectStatus(await request(`/api/admin/regions/${regionB.id}`, "DELETE"), 403, "Delete another region")

  const leadersResponse = await request("/api/admin/leaders")
  await expectStatus(leadersResponse, 200, "Regional editor leader list")
  const leaders = await leadersResponse.json()
  if (leaders.leaders.some(({ id }) => id === otherRegionLeader.id)) throw new Error("Other-region leader fixture was visible.")
  const leaderInput = {
    name: "Forbidden test leader", position: "Test", category: "REGIONAL", regionId: regionB.id,
    sortOrder: 0, featured: false, status: "INACTIVE", translations: "{}",
  }
  await expectStatus(await request("/api/admin/leaders", "POST", leaderInput), 403, "Create leader in another region")
  await expectStatus(await request(`/api/admin/leaders/${otherRegionLeader.id}`, "PUT", { ...leaderInput, regionId: regionB.id }), 403, "Update leader in another region")
  await expectStatus(await request(`/api/admin/leaders/${otherRegionLeader.id}`, "DELETE"), 403, "Delete leader in another region")
  await expectStatus(await request("/api/admin/events"), 403, "Regional editor global events access")

  const ownArticle = await request("/api/admin/news", "POST", {
    title: "Allowed regional test content", excerpt: "test", content: "test",
    kind: "NEWS", scope: "REGION", scopeRegionId: regionA.id, status: "DRAFT",
  })
  await expectStatus(ownArticle, 200, "Create content in assigned region")
  const ownArticleBody = await ownArticle.json()
  await expectStatus(await request(`/api/admin/news/${ownArticleBody.article.id}`, "PUT", {
    title: ownArticleBody.article.title, excerpt: ownArticleBody.article.excerpt, content: ownArticleBody.article.content,
    kind: "NEWS", scope: "REGION", scopeRegionId: regionA.id, status: "DRAFT",
  }), 200, "Update content in assigned region")
  await expectStatus(await request(`/api/admin/news/${ownArticleBody.article.id}`, "DELETE"), 200, "Delete content in assigned region")

  console.log("Regional editor integration checks passed: region/news/leader lists are scoped, cross-region create/update/delete and global events are forbidden, and own-region news create/update/archive succeeds.")
} finally {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM")
    await Promise.race([new Promise((resolve) => server.once("exit", resolve)), delay(5000)])
    if (server.exitCode === null && server.pid) {
      if (process.platform === "win32") {
        const killer = spawn("taskkill", ["/T", "/F", "/PID", String(server.pid)], { windowsHide: true, stdio: "ignore" })
        await new Promise((resolve) => killer.once("exit", resolve))
      }
      else server.kill("SIGKILL")
    }
  }
  await db.$disconnect()
  const resolvedTemp = path.resolve(testRoot)
  const resolvedOsTemp = path.resolve(os.tmpdir())
  if (resolvedTemp.startsWith(`${resolvedOsTemp}${path.sep}`) && path.basename(resolvedTemp).startsWith("amyc-regional-auth-")) {
    await rm(resolvedTemp, { recursive: true, force: true })
  }
}
