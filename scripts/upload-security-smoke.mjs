import { createHash, randomBytes, randomUUID } from "node:crypto"
import { cp, copyFile, lstat, mkdir, readFile, readlink, rm, symlink, unlink } from "node:fs/promises"
import net from "node:net"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import { setTimeout as delay } from "node:timers/promises"
import { PrismaClient } from "@prisma/client"
import { encode } from "next-auth/jwt"

const projectRoot = process.cwd()
const backupDirectory = process.argv[2] ? path.resolve(process.argv[2]) : ""
const backupRoot = path.resolve(projectRoot, "db", "backups")
if (!backupDirectory || !backupDirectory.startsWith(`${backupRoot}${path.sep}`)) {
  throw new Error("Pass a verified backup directory located under db/backups.")
}

const safePath = (base, child) => {
  const resolvedBase = path.resolve(base)
  const resolved = path.resolve(base, child)
  if (!resolved.startsWith(`${resolvedBase}${path.sep}`)) throw new Error("A file path escaped its temporary directory.")
  return resolved
}
const asDatabaseUrl = (file) => `file:${path.resolve(file).replaceAll("\\", "/")}`
const tempRoot = path.join(os.tmpdir(), `amyc-upload-security-${randomUUID()}`)
const runtimeRoot = path.join(tempRoot, "runtime")
const testDbPath = path.join(tempRoot, "database.sqlite")
const standaloneRoot = path.join(projectRoot, ".next", "standalone")
const secret = randomBytes(32).toString("base64url")
let testDb
let server
let serverOutput = ""
let runtimeModulesLink = false

async function freePort() {
  const socket = net.createServer()
  await new Promise((resolve, reject) => socket.listen(0, "127.0.0.1", resolve).once("error", reject))
  const { port } = socket.address()
  await new Promise((resolve) => socket.close(resolve))
  return port
}

async function expectStatus(response, expected, label) {
  const allowed = Array.isArray(expected) ? expected : [expected]
  if (!allowed.includes(response.status)) {
    const body = await response.text().catch(() => "")
    throw new Error(`${label}: expected HTTP ${allowed.join(" or ")}, got ${response.status}; ${body.slice(0, 240)}`)
  }
  return response
}

try {
  const manifest = JSON.parse(await readFile(path.join(backupDirectory, "manifest.json"), "utf8"))
  const backupDb = safePath(backupDirectory, manifest.databaseFile)
  const digest = createHash("sha256").update(await readFile(backupDb)).digest("hex")
  if (manifest.formatVersion !== 1 || digest !== manifest.databaseSha256) throw new Error("The test database backup did not pass its manifest hash check.")
  if (!(await readFile(path.join(standaloneRoot, "server.js"), "utf8")).length) throw new Error("The production standalone server is not available. Run npm run build first.")

  await mkdir(tempRoot, { recursive: false })
  await mkdir(runtimeRoot, { recursive: true })
  await copyFile(backupDb, testDbPath)
  await copyFile(path.join(standaloneRoot, "server.js"), path.join(runtimeRoot, "server.js"))
  await cp(path.join(standaloneRoot, ".next"), path.join(runtimeRoot, ".next"), { recursive: true })
  const standaloneModules = path.join(standaloneRoot, "node_modules")
  await symlink(standaloneModules, path.join(runtimeRoot, "node_modules"), process.platform === "win32" ? "junction" : "dir")
  runtimeModulesLink = true
  await mkdir(path.join(runtimeRoot, "public", "uploads"), { recursive: true })

  testDb = new PrismaClient({ datasources: { db: { url: asDatabaseUrl(testDbPath) } } })
  let admin
  let regionalEditor
  try {
    admin = await testDb.user.create({
      data: {
        email: `upload-test-${randomUUID()}@example.invalid`,
        name: "Upload Test Administrator",
        passwordHash: "test-only-not-used-for-login",
        role: "ADMIN",
        status: "ACTIVE",
      },
      select: { id: true, email: true, name: true, role: true },
    })
    const scopedRegion = await testDb.region.findFirst({ select: { id: true } })
    regionalEditor = await testDb.user.create({
      data: {
        email: `upload-regional-test-${randomUUID()}@example.invalid`,
        name: "Upload Test Regional Editor",
        passwordHash: "test-only-not-used-for-login",
        role: "REGIONAL_EDITOR",
        status: "ACTIVE",
        scopeRegionId: scopedRegion?.id,
      },
      select: { id: true, email: true, name: true, role: true, scopeRegionId: true },
    })
  } finally {
    await testDb.$disconnect()
  }

  const port = await freePort()
  const origin = `http://127.0.0.1:${port}`
  server = spawn(process.execPath, ["server.js"], {
    cwd: runtimeRoot,
    env: {
      ...process.env,
      DATABASE_URL: asDatabaseUrl(testDbPath),
      NEXTAUTH_SECRET: secret,
      NEXTAUTH_URL: origin,
      AMYC_UPLOAD_SECURITY_TEST_MODE: "1",
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
    },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  })
  server.stdout.on("data", (chunk) => { serverOutput = `${serverOutput}${chunk}`.slice(-6000) })
  server.stderr.on("data", (chunk) => { serverOutput = `${serverOutput}${chunk}`.slice(-6000) })

  let ready = false
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Isolated test server exited early. ${serverOutput}`)
    try {
      if ((await fetch(`${origin}/api/auth/csrf`)).ok) { ready = true; break }
    } catch {}
    await delay(500)
  }
  if (!ready) throw new Error(`Isolated test server did not become ready. ${serverOutput}`)

  const tokenFor = (user) => encode({
    token: { name: user.name, email: user.email, role: user.role, userId: user.id, scopeRegionId: user.scopeRegionId },
    secret,
    maxAge: 8 * 60 * 60,
  })
  const adminToken = await tokenFor(admin)
  const regionalToken = await tokenFor(regionalEditor)

  async function upload(token, { entity = "school", bytes, mimeType, filename }) {
    const form = new FormData()
    form.append("entity", entity)
    if (bytes) form.append("file", new File([bytes], filename, { type: mimeType }))
    const headers = token ? { cookie: `next-auth.session-token=${token}` } : {}
    return fetch(`${origin}/api/admin/images`, { method: "POST", headers, body: form })
  }

  const denied = await upload(null, { entity: "school" })
  await expectStatus(denied, 401, "Anonymous image upload")
  await expectStatus(await upload(regionalToken, { entity: "media" }), 403, "Regional editor media upload")
  await expectStatus(await upload(adminToken, { entity: "unknown" }), 400, "Unsupported upload destination")

  const successfulUrls = []
  const sources = [
    { filename: "../../amyc-upload-test.jpg", path: "public/images/Student_arafah.jpg", mimeType: "image/jpeg" },
    { filename: "school.png", path: "public/images/student_namirah.png", mimeType: "image/png" },
    { filename: "same-name.webp", path: "public/images/student_namirah.webp", mimeType: "image/webp" },
    { filename: "same-name.webp", path: "public/images/student_namirah.webp", mimeType: "image/webp" },
  ]
  for (const source of sources) {
    const bytes = await readFile(path.join(projectRoot, source.path))
    const response = await upload(adminToken, { bytes, mimeType: source.mimeType, filename: source.filename })
    await expectStatus(response, 201, `Valid ${source.mimeType} upload`)
    const payload = await response.json()
    if (!/^\/uploads\/images\/schools\/[a-f0-9]{24}\.(?:webp|jpg)$/.test(payload.url)) throw new Error("Upload did not return a randomized, normalized image filename.")
    const outputPath = safePath(path.join(runtimeRoot, "public", "uploads", "images", "schools"), path.basename(payload.url))
    const output = await readFile(outputPath)
    if (!output.length || output.length !== payload.size) throw new Error("Saved upload size did not match the API response.")
    successfulUrls.push(payload.url)
  }
  if (successfulUrls[2] === successfulUrls[3]) throw new Error("Two uploads with the same client filename collided.")

  const invalidBytes = Buffer.from("not an image")
  await expectStatus(await upload(adminToken, {
    bytes: invalidBytes,
    mimeType: "image/png",
    filename: "not-an-image.png",
  }), 400, "Mismatched image content and MIME type")
  const corruptJpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02, 0x03])
  const corruptResponse = await upload(adminToken, {
    bytes: corruptJpeg,
    mimeType: "image/jpeg",
    filename: "corrupt.jpg",
  })
  await expectStatus(corruptResponse, 422, "Corrupt image processing error")
  const corruptPayload = await corruptResponse.json()
  if (corruptPayload.error !== "Image processing failed. Please try a standard JPG, PNG, or WebP image." || /(?:[A-Z]:\\|node_modules|sharp|Error:)/i.test(corruptPayload.error)) {
    throw new Error("Image processing response exposed an internal error detail.")
  }
  const oversizedBytes = Buffer.alloc(20 * 1024 * 1024 + 1)
  await expectStatus(await upload(adminToken, {
    bytes: oversizedBytes,
    mimeType: "image/png",
    filename: "oversized.png",
  }), [400, 413], "Image larger than 20 MB")

  console.log("Upload security integration checks passed: anonymous and unauthorized uploads are rejected, JPG/PNG/WebP are optimized, bad/corrupt content and oversized images are rejected safely, client filenames are discarded, and duplicate names do not collide.")
} finally {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM")
    await Promise.race([new Promise((resolve) => server.once("exit", resolve)), delay(5000)])
    if (server.exitCode === null && server.pid) {
      if (process.platform === "win32") {
        const killer = spawn("taskkill", ["/T", "/F", "/PID", String(server.pid)], { windowsHide: true, stdio: "ignore" })
        await new Promise((resolve) => killer.once("exit", resolve))
      } else server.kill("SIGKILL")
    }
  }
  await testDb?.$disconnect()
  const modulesPath = path.join(runtimeRoot, "node_modules")
  if (runtimeModulesLink) {
    try {
      if ((await lstat(modulesPath)).isSymbolicLink()) {
        const linkTarget = await readlink(modulesPath)
        if (path.resolve(runtimeRoot, linkTarget) === path.resolve(path.join(standaloneRoot, "node_modules"))) await unlink(modulesPath)
      }
    } catch {}
  }
  const resolvedTemp = path.resolve(tempRoot)
  const resolvedOsTemp = path.resolve(os.tmpdir())
  if (resolvedTemp.startsWith(`${resolvedOsTemp}${path.sep}`) && path.basename(resolvedTemp).startsWith("amyc-upload-security-")) {
    await rm(resolvedTemp, { recursive: true, force: true })
  }
}
