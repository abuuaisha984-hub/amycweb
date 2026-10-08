import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"
import nextEnv from "@next/env"
import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../src/lib/password.ts"

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production")

function readHidden(prompt) {
  if (!stdin.isTTY || !stdout.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Run this command from an interactive terminal so the new password is not echoed.")
  }

  return new Promise((resolve, reject) => {
    stdout.write(prompt)
    stdin.setRawMode(true)
    stdin.resume()
    let value = ""
    const decoder = new TextDecoder()

    const finish = (error) => {
      stdin.off("data", onData)
      stdin.setRawMode(false)
      stdin.pause()
      stdout.write("\n")
      if (error) reject(error)
      else resolve(value)
    }

    const onData = (buffer) => {
      for (const character of decoder.decode(buffer, { stream: true })) {
        if (character === "\u0003") return finish(new Error("Password reset cancelled."))
        if (character === "\r" || character === "\n") return finish()
        if (character === "\u007f" || character === "\b") value = Array.from(value).slice(0, -1).join("")
        else if (character >= " ") value += character
      }
    }

    stdin.on("data", onData)
  })
}

const prompt = createInterface({ input: stdin, output: stdout })
const email = (await prompt.question("Admin account email: ")).trim().toLowerCase()
prompt.close()
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Enter a valid admin email address.")

const password = await readHidden("New password (14+ characters): ")
const confirmation = await readHidden("Confirm new password: ")
if (password.length < 14 || password.length > 1024) throw new Error("Password must be between 14 and 1024 characters.")
if (password !== confirmation) throw new Error("Passwords do not match.")

const db = new PrismaClient()
try {
  const user = await db.user.findUnique({ where: { email }, select: { id: true, status: true } })
  if (!user || user.status !== "ACTIVE") throw new Error("No active admin account matched that email.")
  await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(password) } })
  console.log("Admin password changed. The entered password and hash were not printed.")
} finally {
  await db.$disconnect()
}
