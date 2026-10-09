import { randomBytes, randomUUID, scryptSync } from "node:crypto"
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
  const invalidRoleUser = await db.user.create({
    data: {
      email: `invalid-role-test-${randomUUID()}@example.invalid`,
      name: "Invalid Role Test",
      passwordHash: "test-only-not-used-for-login",
      role: "UNRECOGNIZED_TEST_ROLE",
      status: "ACTIVE",
    },
  })
  const forcedPasswordUser = await db.user.create({
    data: {
      email: `forced-password-test-${randomUUID()}@example.invalid`,
      name: "Forced Password Test",
      passwordHash: "test-only-not-used-for-login",
      role: "ADMIN",
      status: "ACTIVE",
      mustChangePassword: true,
    },
  })
  const superAdminPassword = randomBytes(24).toString("base64url")
  const superAdminSalt = randomBytes(16).toString("hex")
  const superAdminHash = scryptSync(superAdminPassword, superAdminSalt, 64).toString("hex")
  const superAdmin = await db.user.create({
    data: {
      email: `super-admin-test-${randomUUID()}@example.invalid`,
      name: "Super Admin Login Test",
      passwordHash: `scrypt:${superAdminSalt}:${superAdminHash}`,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  })
  const ordinaryAdmin = await db.user.create({
    data: {
      email: `ordinary-admin-test-${randomUUID()}@example.invalid`,
      name: "Ordinary Admin Test",
      passwordHash: "test-only-not-used-for-login",
      role: "ADMIN",
      status: "ACTIVE",
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

  const csrfResponse = await fetch(`${origin}/api/auth/csrf`)
  await expectStatus(csrfResponse, 200, "Credentials login CSRF endpoint")
  const csrfBody = await csrfResponse.json()
  const csrfCookie = csrfResponse.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ")
  const credentialsResponse = await fetch(`${origin}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: csrfCookie },
    body: new URLSearchParams({ csrfToken: csrfBody.csrfToken, callbackUrl: `${origin}/admin`, email: superAdmin.email, password: superAdminPassword, json: "true" }),
    redirect: "manual",
  })
  await expectStatus(credentialsResponse, 200, "Super Admin credentials callback")
  const sessionCookie = credentialsResponse.headers.getSetCookie().map((value) => value.split(";", 1)[0]).find((value) => value.startsWith("next-auth.session-token="))
  if (!sessionCookie) throw new Error("Successful test credentials callback did not issue the configured session cookie.")
  const authCookie = [csrfCookie, sessionCookie].filter(Boolean).join("; ")
  const sessionResponse = await fetch(`${origin}/api/auth/session`, { headers: { cookie: authCookie } })
  await expectStatus(sessionResponse, 200, "Super Admin session endpoint")
  const sessionBody = await sessionResponse.json()
  if (sessionBody?.user?.role !== "SUPER_ADMIN" || sessionBody?.user?.id !== superAdmin.id) {
    throw new Error("Super Admin login did not return the expected test session role and identity.")
  }
  await expectStatus(await fetch(`${origin}/admin`, { headers: { cookie: authCookie } }), 200, "Super Admin dashboard")
  const accountListResponse = await fetch(`${origin}/api/admin/users`, { headers: { cookie: authCookie } })
  await expectStatus(accountListResponse, 200, "Super Admin account list")
  const accountList = await accountListResponse.json()
  if (!accountList.users.some(({ id, role }) => id === ordinaryAdmin.id && role === "ADMIN") || accountList.users.some(({ role }) => typeof role !== "string")) {
    throw new Error("Admin account list did not show persisted roles correctly.")
  }

  const createdAdminEmail = `provisioned-admin-test-${randomUUID()}@example.invalid`
  const createAdminResponse = await fetch(`${origin}/api/admin/users`, {
    method: "POST",
    headers: { cookie: authCookie, "content-type": "application/json" },
    body: JSON.stringify({ name: "Provisioned Admin Test", email: createdAdminEmail }),
  })
  await expectStatus(createAdminResponse, 201, "Super Admin creates an Admin account")
  const createdAdminResult = await createAdminResponse.json()
  if (!createdAdminResult.temporaryPassword || "passwordHash" in createdAdminResult.user) {
    throw new Error("Admin provisioning did not return a one-time password safely.")
  }
  const createdAdmin = await db.user.findUnique({ where: { email: createdAdminEmail } })
  if (!createdAdmin || createdAdmin.role !== "ADMIN" || createdAdmin.status !== "ACTIVE" || !createdAdmin.mustChangePassword) {
    throw new Error("Provisioned Admin did not persist the expected role, status and first-login requirement.")
  }
  const [hashScheme, hashSalt, storedHash] = createdAdmin.passwordHash.split(":")
  const candidateHash = scryptSync(createdAdminResult.temporaryPassword, hashSalt, 64).toString("hex")
  if (hashScheme !== "scrypt" || candidateHash !== storedHash) throw new Error("The provisioned temporary password was not stored as the expected scrypt hash.")

  const firstLoginCsrfResponse = await fetch(`${origin}/api/auth/csrf`)
  await expectStatus(firstLoginCsrfResponse, 200, "First-login CSRF endpoint")
  const firstLoginCsrf = await firstLoginCsrfResponse.json()
  const firstLoginCsrfCookie = firstLoginCsrfResponse.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ")
  const firstLoginResponse = await fetch(`${origin}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: firstLoginCsrfCookie },
    body: new URLSearchParams({ csrfToken: firstLoginCsrf.csrfToken, callbackUrl: `${origin}/admin`, email: createdAdminEmail, password: createdAdminResult.temporaryPassword, json: "true" }),
    redirect: "manual",
  })
  await expectStatus(firstLoginResponse, 200, "First-login credentials callback")
  const firstLoginSessionCookie = firstLoginResponse.headers.getSetCookie().map((value) => value.split(";", 1)[0]).find((value) => value.startsWith("next-auth.session-token="))
  if (!firstLoginSessionCookie) throw new Error("First-login callback did not issue a session cookie.")
  let firstLoginCookie = [firstLoginCsrfCookie, firstLoginSessionCookie].filter(Boolean).join("; ")
  const firstLoginDashboard = await fetch(`${origin}/admin`, { headers: { cookie: firstLoginCookie }, redirect: "manual" })
  if (firstLoginDashboard.status !== 307 || !firstLoginDashboard.headers.get("location")?.endsWith("/admin/account/password")) {
    throw new Error("First-login Admin was not routed to password change.")
  }
  await expectStatus(await fetch(`${origin}/admin/account/password`, { headers: { cookie: firstLoginCookie } }), 200, "First-login password form")
  const replacementPassword = randomBytes(24).toString("base64url")
  const passwordChangeResponse = await fetch(`${origin}/api/admin/account/password`, {
    method: "POST",
    headers: { cookie: firstLoginCookie, "content-type": "application/json" },
    body: JSON.stringify({ currentPassword: createdAdminResult.temporaryPassword, newPassword: replacementPassword }),
  })
  await expectStatus(passwordChangeResponse, 200, "First-login password change")
  const refreshedSessionResponse = await fetch(`${origin}/api/auth/session`, { headers: { cookie: firstLoginCookie } })
  await expectStatus(refreshedSessionResponse, 200, "Session refresh after first password change")
  const refreshedCookies = refreshedSessionResponse.headers.getSetCookie().map((value) => value.split(";", 1)[0])
  const refreshedSessionCookie = refreshedCookies.find((value) => value.startsWith("next-auth.session-token="))
  if (refreshedSessionCookie) firstLoginCookie = [firstLoginCsrfCookie, refreshedSessionCookie].join("; ")
  const refreshedSession = await refreshedSessionResponse.json()
  if (refreshedSession?.user?.role !== "ADMIN" || refreshedSession?.user?.mustChangePassword) {
    throw new Error("Password change did not restore the Admin role in the refreshed session.")
  }
  const updatedAdmin = await db.user.findUnique({ where: { id: createdAdmin.id } })
  if (!updatedAdmin || updatedAdmin.mustChangePassword || updatedAdmin.passwordHash === createdAdmin.passwordHash) {
    throw new Error("First-login password change did not persist correctly.")
  }
  await expectStatus(await fetch(`${origin}/admin`, { headers: { cookie: firstLoginCookie } }), 200, "Dashboard after first password change")

  const cookieToken = await encode({
    token: { name: user.name, email: user.email, role: user.role, userId: user.id, scopeRegionId: regionA.id },
    secret,
    maxAge: 8 * 60 * 60,
  })
  const invalidRoleToken = await encode({
    token: { name: invalidRoleUser.name, email: invalidRoleUser.email, role: invalidRoleUser.role, userId: invalidRoleUser.id },
    secret,
    maxAge: 8 * 60 * 60,
  })
  const forcedPasswordToken = await encode({
    token: { name: forcedPasswordUser.name, email: forcedPasswordUser.email, role: forcedPasswordUser.role, userId: forcedPasswordUser.id, mustChangePassword: true },
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

  const ordinaryAdminToken = await encode({
    token: { name: ordinaryAdmin.name, email: ordinaryAdmin.email, role: ordinaryAdmin.role, userId: ordinaryAdmin.id },
    secret,
    maxAge: 8 * 60 * 60,
  })
  await expectStatus(await fetch(`${origin}/api/admin/news`, { headers: { cookie: `next-auth.session-token=${ordinaryAdminToken}` } }), 200, "Ordinary Admin content permission")
  await expectStatus(await fetch(`${origin}/api/admin/users`, { headers: { cookie: `next-auth.session-token=${ordinaryAdminToken}` } }), 403, "Ordinary Admin Super Admin-only permission")
  const suspendResponse = await fetch(`${origin}/api/admin/users/${ordinaryAdmin.id}`, {
    method: "PATCH",
    headers: { cookie: authCookie, "content-type": "application/json" },
    body: JSON.stringify({ status: "SUSPENDED" }),
  })
  await expectStatus(suspendResponse, 200, "Super Admin suspends an ordinary Admin")
  await expectStatus(await fetch(`${origin}/api/admin/news`, { headers: { cookie: `next-auth.session-token=${ordinaryAdminToken}` } }), 403, "Suspended ordinary Admin existing session")
  const suspendedDashboard = await fetch(`${origin}/admin`, { headers: { cookie: `next-auth.session-token=${ordinaryAdminToken}` }, redirect: "manual" })
  if (suspendedDashboard.status !== 307 || !suspendedDashboard.headers.get("location")?.includes("/admin/login")) {
    throw new Error("A suspended Admin session was not redirected away from the protected dashboard.")
  }
  const enableResponse = await fetch(`${origin}/api/admin/users/${ordinaryAdmin.id}`, {
    method: "PATCH",
    headers: { cookie: authCookie, "content-type": "application/json" },
    body: JSON.stringify({ status: "ACTIVE" }),
  })
  await expectStatus(enableResponse, 200, "Super Admin enables an ordinary Admin")
  await expectStatus(await fetch(`${origin}/api/admin/news`, { headers: { cookie: `next-auth.session-token=${ordinaryAdminToken}` } }), 200, "Reactivated ordinary Admin session")

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

  await db.user.update({ where: { id: user.id }, data: { status: "SUSPENDED" } })
  await expectStatus(await request("/api/admin/news"), 403, "Existing session after account suspension")
  await db.user.update({ where: { id: user.id }, data: { status: "ACTIVE" } })
  await expectStatus(await request("/api/admin/news"), 200, "Existing session after account reactivation")

  await expectStatus(await fetch(`${origin}/api/admin/news`, { headers: { cookie: `next-auth.session-token=${invalidRoleToken}` } }), 403, "Unknown database role API access")
  const invalidRolePage = await fetch(`${origin}/admin`, { headers: { cookie: `next-auth.session-token=${invalidRoleToken}` }, redirect: "manual" })
  if (invalidRolePage.status !== 307 || !invalidRolePage.headers.get("location")?.includes("/api/auth/signin")) {
    throw new Error(`A user with an unrecognized role was not redirected away from the admin dashboard (HTTP ${invalidRolePage.status}, location ${invalidRolePage.headers.get("location") || "none"}).`)
  }

  const forcedPasswordDashboard = await fetch(`${origin}/admin`, { headers: { cookie: `next-auth.session-token=${forcedPasswordToken}` }, redirect: "manual" })
  if (forcedPasswordDashboard.status !== 307 || !forcedPasswordDashboard.headers.get("location")?.endsWith("/admin/account/password")) {
    throw new Error("A first-login user was not redirected to change their password.")
  }
  await expectStatus(await fetch(`${origin}/admin/account/password`, { headers: { cookie: `next-auth.session-token=${forcedPasswordToken}` } }), 200, "First-login password change page")

  console.log("Regional/admin auth integration checks passed: test Super Admin credentials create a session and load the dashboard/account list; ordinary Admin permissions remain limited; regional permissions remain scoped; suspension is enforced on the next protected request; reactivation restores access; unknown roles are denied; and first-login users can reach only the password-change flow.")
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
