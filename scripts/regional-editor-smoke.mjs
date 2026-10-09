import { createHash, createHmac, randomBytes, randomUUID, scryptSync } from "node:crypto"
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
let db
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

async function migrateTestCopy() {
  const child = spawn(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy", "--schema", "prisma/schema.prisma"], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: databaseUrlFromPath(testDbPath) },
    windowsHide: true,
    stdio: "ignore",
  })
  const exitCode = await new Promise((resolve, reject) => child.once("error", reject).once("exit", resolve))
  if (exitCode !== 0) throw new Error(`Prisma migration on isolated test copy failed (exit ${exitCode}).`)
}

try {
  await migrateTestCopy()
  db = new PrismaClient({ datasources: { db: { url: databaseUrlFromPath(testDbPath) } } })
  await db.$connect()
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
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
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

  const recoveryEmail = `recovery-test-${randomUUID()}@example.invalid`
  const recoveryPassword = randomBytes(24).toString("base64url")
  const recoveryUser = await db.user.create({ data: { email: recoveryEmail, name: "Recovery Test", passwordHash: "old-test-password-hash", role: "ADMIN", status: "ACTIVE" } })
  const makeRecoveryToken = async (rawToken, expiresAt) => db.passwordResetToken.create({ data: { userId: recoveryUser.id, tokenHash: createHash("sha256").update(rawToken).digest("hex"), expiresAt } })
  const expiredRawToken = randomBytes(32).toString("base64url")
  await makeRecoveryToken(expiredRawToken, new Date(Date.now() - 1000))
  await expectStatus(await fetch(`${origin}/api/auth/reset-password`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: randomBytes(32).toString("base64url"), password: recoveryPassword, confirmPassword: recoveryPassword }) }), 400, "Invalid reset token")
  await expectStatus(await fetch(`${origin}/api/auth/reset-password`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: expiredRawToken, password: recoveryPassword, confirmPassword: recoveryPassword }) }), 400, "Expired reset token")
  const concurrentRawToken = randomBytes(32).toString("base64url")
  await makeRecoveryToken(concurrentRawToken, new Date(Date.now() + 30 * 60 * 1000))
  const resetPayload = JSON.stringify({ token: concurrentRawToken, password: recoveryPassword, confirmPassword: recoveryPassword })
  const resetResponses = await Promise.all([1, 2].map(() => fetch(`${origin}/api/auth/reset-password`, { method: "POST", headers: { "content-type": "application/json" }, body: resetPayload })))
  const resetStatuses = resetResponses.map(({ status }) => status)
  const resetMessages = await Promise.all(resetResponses.map(async (response) => (await response.json().catch(() => ({}))).error || "no error"))
  if (resetStatuses.filter((status) => status === 200).length !== 1) throw new Error(`Concurrent reset attempts did not consume the reset token exactly once (HTTP statuses: ${resetStatuses.join(", ")}; safe errors: ${resetMessages.join(" | ")}).`)
  await expectStatus(await fetch(`${origin}/api/auth/reset-password`, { method: "POST", headers: { "content-type": "application/json" }, body: resetPayload }), 400, "Consumed reset token reuse")
  const resetUserAfter = await db.user.findUniqueOrThrow({ where: { id: recoveryUser.id } })
  const [, resetSalt, resetHash] = resetUserAfter.passwordHash.split(":")
  if (resetUserAfter.role !== "ADMIN" || resetUserAfter.status !== "ACTIVE" || resetUserAfter.authVersion !== 1 || scryptSync(recoveryPassword, resetSalt, 64).toString("hex") !== resetHash) {
    throw new Error("Password recovery did not update only the password and session version on the existing Admin account.")
  }
  const oldRecoverySession = await encode({ token: { name: recoveryUser.name, email: recoveryUser.email, role: recoveryUser.role, userId: recoveryUser.id, authVersion: 0 }, secret, maxAge: 8 * 60 * 60 })
  await expectStatus(await fetch(`${origin}/api/admin/news`, { headers: { cookie: `next-auth.session-token=${oldRecoverySession}` } }), 403, "Session invalidation after password recovery")

  const suspendedRecoveryUser = await db.user.create({ data: { email: `suspended-recovery-${randomUUID()}@example.invalid`, name: "Suspended Recovery Test", passwordHash: "unchanged-test-hash", role: "ADMIN", status: "SUSPENDED" } })
  const suspendedRawToken = randomBytes(32).toString("base64url")
  await db.passwordResetToken.create({ data: { userId: suspendedRecoveryUser.id, tokenHash: createHash("sha256").update(suspendedRawToken).digest("hex"), expiresAt: new Date(Date.now() + 30 * 60 * 1000) } })
  await expectStatus(await fetch(`${origin}/api/auth/reset-password`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: suspendedRawToken, password: recoveryPassword, confirmPassword: recoveryPassword }) }), 400, "Suspended account reset")
  const suspendedAfter = await db.user.findUniqueOrThrow({ where: { id: suspendedRecoveryUser.id }, select: { status: true, passwordHash: true } })
  if (suspendedAfter.status !== "SUSPENDED" || suspendedAfter.passwordHash !== "unchanged-test-hash") throw new Error("Suspended account recovery changed account state or password.")

  const unknownEmail = `unknown-recovery-${randomUUID()}@example.invalid`
  let genericRecoveryMessage = ""
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${origin}/api/auth/forgot-password`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: unknownEmail }) })
    await expectStatus(response, 202, "Unknown-email recovery response")
    const { message } = await response.json()
    if (attempt === 0) genericRecoveryMessage = message
    else if (message !== genericRecoveryMessage) throw new Error("Password recovery responses differed across repeat requests.")
  }
  const rateLimitKey = createHmac("sha256", secret).update(`email:${unknownEmail.toLowerCase()}`).digest("hex")
  const rateLimit = await db.passwordRecoveryRateLimit.findUnique({ where: { keyHash: rateLimitKey } })
  if (!rateLimit || rateLimit.count !== 4) throw new Error("Password recovery request rate limiting was not persisted as expected.")
  const eligibleRecoveryResponse = await fetch(`${origin}/api/auth/forgot-password`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: recoveryEmail }) })
  await expectStatus(eligibleRecoveryResponse, 202, "Configured recovery request safe response")
  const eligibleRecoveryBody = await eligibleRecoveryResponse.json()
  if (eligibleRecoveryBody.message !== genericRecoveryMessage) throw new Error("Eligible and unknown account recovery responses differed.")
  const failedDeliveryToken = await db.passwordResetToken.findFirst({ where: { userId: recoveryUser.id }, orderBy: { createdAt: "desc" }, select: { consumedAt: true } })
  if (!failedDeliveryToken?.consumedAt) throw new Error("Email-provider-unavailable handling did not revoke its reset link safely.")

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
  for (const section of ["news", "events", "schools", "programmes", "regions", "leaders", "documents", "galleries"]) {
    await expectStatus(await fetch(`${origin}/api/admin/${section}`, { headers: { cookie: authCookie } }), 200, `Super Admin ${section} access`)
  }
  await expectStatus(await fetch(`${origin}/admin/analytics?range=7d`, { headers: { cookie: authCookie } }), 200, "Super Admin analytics 7-day report")
  await expectStatus(await fetch(`${origin}/admin/analytics?range=custom&from=2024-01-01&to=2024-01-31`, { headers: { cookie: authCookie } }), 200, "Super Admin analytics custom-range report")
  const forbiddenSuperAdminWrites = [
    ["/api/admin/news", "POST", {}], ["/api/admin/events", "POST", {}],
    ["/api/admin/schools", "POST", {}], ["/api/admin/regions", "POST", {}],
    ["/api/admin/leaders", "POST", {}], ["/api/admin/galleries", "POST", {}],
    ["/api/admin/documents", "POST", {}], ["/api/admin/document-categories", "POST", {}],
    ["/api/admin/programmes/test-id", "PATCH", {}], ["/api/admin/messages/test-id", "PATCH", { status: "READ" }],
    ["/api/admin/news/test-id", "DELETE"], ["/api/admin/events/test-id", "DELETE"],
    ["/api/admin/schools/test-id", "DELETE"], ["/api/admin/regions/test-id", "DELETE"],
    ["/api/admin/leaders/test-id", "DELETE"], ["/api/admin/galleries/test-id", "DELETE"],
    ["/api/admin/documents/test-id", "DELETE"], ["/api/admin/settings", "POST", {}],
  ]
  for (const [url, method, body] of forbiddenSuperAdminWrites) {
    await expectStatus(await fetch(`${origin}${url}`, {
      method,
      headers: { cookie: authCookie, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }), 403, `Super Admin read-only restriction ${method} ${url}`)
  }
  const rejectedImageUpload = new FormData()
  rejectedImageUpload.set("entity", "media")
  await expectStatus(await fetch(`${origin}/api/admin/images`, { method: "POST", headers: { cookie: authCookie }, body: rejectedImageUpload }), 403, "Super Admin image upload restriction")
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
  const ordinaryResetToken = await encode({ token: { name: ordinaryAdmin.name, email: ordinaryAdmin.email, role: ordinaryAdmin.role, userId: ordinaryAdmin.id, authVersion: ordinaryAdmin.authVersion }, secret, maxAge: 8 * 60 * 60 })
  await expectStatus(await fetch(`${origin}/api/admin/users/${createdAdmin.id}`, {
    method: "PATCH", headers: { cookie: `next-auth.session-token=${ordinaryResetToken}`, "content-type": "application/json" },
    body: JSON.stringify({ action: "temporary-password" }),
  }), 403, "Ordinary Admin cannot reset another account")
  const temporaryPasswordResponse = await fetch(`${origin}/api/admin/users/${createdAdmin.id}`, {
    method: "PATCH", headers: { cookie: authCookie, "content-type": "application/json" },
    body: JSON.stringify({ action: "temporary-password" }),
  })
  await expectStatus(temporaryPasswordResponse, 200, "Super Admin sets an existing Admin temporary password")
  const resetPasswordResult = await temporaryPasswordResponse.json()
  const adminAfterTemporaryReset = await db.user.findUniqueOrThrow({ where: { id: createdAdmin.id } })
  const [hashScheme, hashSalt, storedHash] = adminAfterTemporaryReset.passwordHash.split(":")
  const candidateHash = scryptSync(resetPasswordResult.temporaryPassword, hashSalt, 64).toString("hex")
  if (adminAfterTemporaryReset.role !== "ADMIN" || adminAfterTemporaryReset.status !== "ACTIVE" || !adminAfterTemporaryReset.mustChangePassword || adminAfterTemporaryReset.authVersion !== 1) {
    throw new Error("Temporary-password reset changed the account role/status or did not require a first-login password change and revoke sessions.")
  }
  if (hashScheme !== "scrypt" || candidateHash !== storedHash) throw new Error("The Super Admin temporary password was not stored as the expected scrypt hash.")

  const firstLoginCsrfResponse = await fetch(`${origin}/api/auth/csrf`)
  await expectStatus(firstLoginCsrfResponse, 200, "First-login CSRF endpoint")
  const firstLoginCsrf = await firstLoginCsrfResponse.json()
  const firstLoginCsrfCookie = firstLoginCsrfResponse.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ")
  const firstLoginResponse = await fetch(`${origin}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: firstLoginCsrfCookie },
    body: new URLSearchParams({ csrfToken: firstLoginCsrf.csrfToken, callbackUrl: `${origin}/admin`, email: createdAdminEmail, password: resetPasswordResult.temporaryPassword, json: "true" }),
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
    body: JSON.stringify({ currentPassword: resetPasswordResult.temporaryPassword, newPassword: replacementPassword }),
  })
  await expectStatus(passwordChangeResponse, 200, "First-login password change")
  const refreshedCsrfResponse = await fetch(`${origin}/api/auth/csrf`)
  await expectStatus(refreshedCsrfResponse, 200, "Fresh session CSRF endpoint")
  const refreshedCsrf = await refreshedCsrfResponse.json()
  const refreshedCsrfCookie = refreshedCsrfResponse.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ")
  const refreshedLoginResponse = await fetch(`${origin}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: refreshedCsrfCookie },
    body: new URLSearchParams({ csrfToken: refreshedCsrf.csrfToken, callbackUrl: `${origin}/admin`, email: createdAdminEmail, password: replacementPassword, json: "true" }),
    redirect: "manual",
  })
  await expectStatus(refreshedLoginResponse, 200, "Fresh sign-in after first password change")
  const refreshedSessionCookie = refreshedLoginResponse.headers.getSetCookie().map((value) => value.split(";", 1)[0]).find((value) => value.startsWith("next-auth.session-token="))
  if (!refreshedSessionCookie) throw new Error("Password change re-authentication did not issue a fresh session cookie.")
  firstLoginCookie = [refreshedCsrfCookie, refreshedSessionCookie].join("; ")
  const refreshedSessionResponse = await fetch(`${origin}/api/auth/session`, { headers: { cookie: firstLoginCookie } })
  await expectStatus(refreshedSessionResponse, 200, "Session after first password change")
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
    token: { name: user.name, email: user.email, role: user.role, userId: user.id, scopeRegionId: regionA.id, authVersion: user.authVersion },
    secret,
    maxAge: 8 * 60 * 60,
  })
  const invalidRoleToken = await encode({
    token: { name: invalidRoleUser.name, email: invalidRoleUser.email, role: invalidRoleUser.role, userId: invalidRoleUser.id, authVersion: invalidRoleUser.authVersion },
    secret,
    maxAge: 8 * 60 * 60,
  })
  const forcedPasswordToken = await encode({
    token: { name: forcedPasswordUser.name, email: forcedPasswordUser.email, role: forcedPasswordUser.role, userId: forcedPasswordUser.id, mustChangePassword: true, authVersion: forcedPasswordUser.authVersion },
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
    token: { name: ordinaryAdmin.name, email: ordinaryAdmin.email, role: ordinaryAdmin.role, userId: ordinaryAdmin.id, authVersion: ordinaryAdmin.authVersion },
    secret,
    maxAge: 8 * 60 * 60,
  })
  await expectStatus(await fetch(`${origin}/api/admin/news`, { headers: { cookie: `next-auth.session-token=${ordinaryAdminToken}` } }), 200, "Ordinary Admin content permission")
  for (const section of ["news", "events", "schools", "programmes", "regions", "leaders", "documents", "galleries"]) {
    await expectStatus(await fetch(`${origin}/api/admin/${section}`, { headers: { cookie: `next-auth.session-token=${ordinaryAdminToken}` } }), 200, `Ordinary Admin ${section} operational access`)
  }
  await expectStatus(await fetch(`${origin}/admin/analytics?range=7d`, { headers: { cookie: `next-auth.session-token=${ordinaryAdminToken}` } }), 200, "Ordinary Admin analytics access")
  const ordinaryAdminArticleResponse = await fetch(`${origin}/api/admin/news`, {
    method: "POST",
    headers: { cookie: `next-auth.session-token=${ordinaryAdminToken}`, "content-type": "application/json" },
    body: JSON.stringify({ title: "Ordinary Admin write test", excerpt: "Isolated permission test.", content: "Temporary test fixture.", kind: "NEWS", status: "DRAFT" }),
  })
  await expectStatus(ordinaryAdminArticleResponse, 200, "Ordinary Admin retains content write permission")
  const ordinaryAdminArticle = await ordinaryAdminArticleResponse.json()
  await expectStatus(await fetch(`${origin}/api/admin/news/${ordinaryAdminArticle.article.id}`, { method: "DELETE", headers: { cookie: `next-auth.session-token=${ordinaryAdminToken}` } }), 200, "Ordinary Admin content delete permission on isolated fixture")
  await expectStatus(await fetch(`${origin}/api/admin/users`, { headers: { cookie: `next-auth.session-token=${ordinaryAdminToken}` } }), 403, "Ordinary Admin Super Admin-only permission")

  const transferAdmin = await db.user.create({ data: {
    email: `transfer-admin-${randomUUID()}@example.invalid`, name: "Outgoing Transfer Admin", passwordHash: "old-transfer-test-hash", role: "ADMIN", status: "ACTIVE",
  } })
  const transferredEmail = `incoming-transfer-${randomUUID()}@example.invalid`
  const transferPayload = { action: "transfer", name: "Incoming Transfer Admin", email: transferredEmail, confirmation: "TRANSFER ADMIN ACCOUNT" }
  await expectStatus(await fetch(`${origin}/api/admin/users/${transferAdmin.id}`, {
    method: "PATCH", headers: { cookie: authCookie, "content-type": "application/json" },
    body: JSON.stringify({ ...transferPayload, email: ordinaryAdmin.email }),
  }), 409, "Transfer rejects an email belonging to another account")
  const afterRejectedTransfer = await db.user.findUniqueOrThrow({ where: { id: transferAdmin.id } })
  if (afterRejectedTransfer.email !== transferAdmin.email || afterRejectedTransfer.passwordHash !== transferAdmin.passwordHash) {
    throw new Error("A rejected conflicting-email transfer partially modified the account.")
  }

  const preservationModels = ["article", "school", "region", "programme", "leader", "gallery", "galleryItem", "document", "event", "contactMessage", "visitor", "visitEvent"]
  const snapshotRecords = async () => Promise.all(preservationModels.map(async (modelName) => {
    const model = db[modelName]
    const rows = await model.findMany({ select: { id: true }, orderBy: { id: "asc" } })
    return [modelName, rows.map(({ id }) => id)]
  }))
  const recordsBeforeTransfer = await snapshotRecords()
  const historicalAudit = await db.auditLog.create({ data: {
    userId: transferAdmin.id, userName: "Outgoing Transfer Admin", action: "UPDATE", entity: "User", entityId: transferAdmin.id, detail: "Pre-transfer historical test snapshot.",
  } })
  const transferResponse = await fetch(`${origin}/api/admin/users/${transferAdmin.id}`, {
    method: "PATCH", headers: { cookie: authCookie, "content-type": "application/json" }, body: JSON.stringify(transferPayload),
  })
  await expectStatus(transferResponse, 200, "Super Admin transfers an Admin account")
  const transferResult = await transferResponse.json()
  const transferredAccount = await db.user.findUniqueOrThrow({ where: { id: transferAdmin.id } })
  const [, transferSalt, transferHash] = transferredAccount.passwordHash.split(":")
  if (transferredAccount.email !== transferredEmail || transferredAccount.name !== transferPayload.name || transferredAccount.role !== "ADMIN" || transferredAccount.status !== "ACTIVE" || !transferredAccount.mustChangePassword || transferredAccount.authVersion !== transferAdmin.authVersion + 1 || scryptSync(transferResult.temporaryPassword, transferSalt, 64).toString("hex") !== transferHash) {
    throw new Error("Account transfer did not preserve role/status while updating identity, password and session state correctly.")
  }
  const oldTransferSession = await encode({ token: { name: transferAdmin.name, email: transferAdmin.email, role: transferAdmin.role, userId: transferAdmin.id, authVersion: transferAdmin.authVersion }, secret, maxAge: 8 * 60 * 60 })
  await expectStatus(await fetch(`${origin}/api/admin/news`, { headers: { cookie: `next-auth.session-token=${oldTransferSession}` } }), 403, "Account transfer revokes old sessions")
  const recordsAfterTransfer = await snapshotRecords()
  if (JSON.stringify(recordsAfterTransfer) !== JSON.stringify(recordsBeforeTransfer)) throw new Error("Account transfer changed existing institutional record identifiers.")
  const historicalAuditAfter = await db.auditLog.findUniqueOrThrow({ where: { id: historicalAudit.id } })
  if (historicalAuditAfter.userName !== "Outgoing Transfer Admin" || historicalAuditAfter.userId !== transferAdmin.id) {
    throw new Error("Account transfer changed a historical audit actor snapshot.")
  }

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
  await expectStatus(await fetch(`${origin}/api/admin/news`, { headers: { cookie: `next-auth.session-token=${ordinaryAdminToken}` } }), 403, "Reactivated Admin old session remains revoked")
  const recordsAfterReplacement = await snapshotRecords()
  if (JSON.stringify(recordsAfterReplacement) !== JSON.stringify(recordsBeforeTransfer)) throw new Error("Suspending/reactivating the outgoing Admin changed existing institutional record identifiers.")
  const reactivatedAdmin = await db.user.findUniqueOrThrow({ where: { id: ordinaryAdmin.id }, select: { id: true, email: true, name: true, role: true, authVersion: true } })
  const reactivatedToken = await encode({ token: { name: reactivatedAdmin.name, email: reactivatedAdmin.email, role: reactivatedAdmin.role, userId: reactivatedAdmin.id, authVersion: reactivatedAdmin.authVersion }, secret, maxAge: 8 * 60 * 60 })
  await expectStatus(await fetch(`${origin}/api/admin/news`, { headers: { cookie: `next-auth.session-token=${reactivatedToken}` } }), 200, "Reactivated Admin fresh session")

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

  await db.user.update({ where: { id: user.id }, data: { status: "SUSPENDED", authVersion: { increment: 1 } } })
  await expectStatus(await request("/api/admin/news"), 403, "Existing session after account suspension")
  await db.user.update({ where: { id: user.id }, data: { status: "ACTIVE", authVersion: { increment: 1 } } })
  await expectStatus(await request("/api/admin/news"), 403, "Old session after account reactivation")

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

  console.log("Admin/recovery integration checks passed on an isolated backup copy: Super Admin read-only module and analytics access plus account management; denied Super Admin content writes; ordinary Admin operational access and account-management denial; password recovery; regional scope; role validation; suspension/reactivation; and forced first-login password change.")
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
  if (db) await db.$disconnect()
  const resolvedTemp = path.resolve(testRoot)
  const resolvedOsTemp = path.resolve(os.tmpdir())
  if (resolvedTemp.startsWith(`${resolvedOsTemp}${path.sep}`) && path.basename(resolvedTemp).startsWith("amyc-regional-auth-")) {
    await rm(resolvedTemp, { recursive: true, force: true })
  }
}
