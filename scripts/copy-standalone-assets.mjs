import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs"
import { join, resolve, sep } from "node:path"

const standalone = ".next/standalone"
if (!existsSync(`${standalone}/server.js`)) {
  throw new Error("Standalone server was not generated. Check output: 'standalone' in next.config.ts.")
}

mkdirSync(`${standalone}/.next`, { recursive: true })
if (existsSync(".next/static")) cpSync(".next/static", `${standalone}/.next/static`, { recursive: true })
if (existsSync("public")) {
  const standaloneRoot = resolve(standalone)
  const standalonePublic = resolve(standaloneRoot, "public")
  if (!standalonePublic.startsWith(`${standaloneRoot}${sep}`)) throw new Error("Standalone public asset path escaped the build output directory.")
  rmSync(standalonePublic, { recursive: true, force: true })
  cpSync("public", standalonePublic, { recursive: true })
}

// Next.js may copy project environment files into standalone output. Runtime
// secrets should be injected by the environment, never bundled with the app.
for (const name of readdirSync(standalone)) {
  if (/^\.env(?:\..*)?$/.test(name)) rmSync(join(standalone, name), { force: true, recursive: true })
}
