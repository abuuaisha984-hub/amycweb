import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

process.env.HOSTNAME ||= "127.0.0.1"
process.env.PORT ||= "3000"
await import(pathToFileURL(resolve(".next/standalone/server.js")).href)
