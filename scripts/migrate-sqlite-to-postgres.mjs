import { spawnSync } from "node:child_process"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { Prisma, PrismaClient } from "@prisma/client"

const apply = process.argv.includes("--apply")
const confirmDataset = process.argv.includes("--confirm-dataset")
const validateOnly = process.argv.includes("--validate-only")
const sqlitePath = process.argv.find((value) => value.startsWith("--sqlite="))?.slice("--sqlite=".length)

console.log(`[IMPORT] started mode=${validateOnly ? "validation-only" : apply ? "apply" : "dry-run"} applyFlag=${apply}`)

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!sqlitePath) fail("Pass --sqlite=<path-to-database.sqlite>. The source database is read only.")
if (apply && !confirmDataset) fail("Review the record counts, then pass --confirm-dataset --apply to import the selected database into an empty staging PostgreSQL database.")

const absoluteSqlitePath = path.resolve(sqlitePath)
const pythonSource = [
  "import json, sqlite3, sys",
  "connection = sqlite3.connect('file:' + sys.argv[1].replace('\\\\', '/') + '?mode=ro', uri=True)",
  "connection.row_factory = sqlite3.Row",
  "tables = [row[0] for row in connection.execute(\"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations' ORDER BY name\")]",
  "print(json.dumps({table: [dict(row) for row in connection.execute('SELECT * FROM \\\"' + table.replace('\\\"', '\\\"\\\"') + '\\\"')] for table in tables}, ensure_ascii=False, separators=(',', ':'))) ",
]
const pythonCommand = process.env.PYTHON || (process.platform === "win32"
  ? path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python314", "python.exe")
  : "python3")
const exported = spawnSync(pythonCommand, ["-c", pythonSource.join("\n"), absoluteSqlitePath], {
  encoding: "utf8",
  maxBuffer: 512 * 1024 * 1024,
  env: { ...process.env, PYTHONIOENCODING: "utf-8" },
})
if (exported.error || exported.status !== 0) {
  fail(`SQLite read-only export failed (${exported.error?.name || `exit ${exported.status ?? "unknown"}`}). Source contents were not changed.`)
}

let sourceTables
try {
  sourceTables = JSON.parse(exported.stdout)
} catch {
  fail("SQLite read-only export returned invalid inventory data. No database changes were made.")
}

const schema = await readFile(path.resolve("prisma-postgres/schema.prisma"), "utf8")
const enumValues = new Map()
for (const match of schema.matchAll(/^enum\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
  enumValues.set(match[1], new Set(match[2].split(/\r?\n/).map((line) => line.trim().match(/^([A-Za-z_]\w*)/)?.[1]).filter(Boolean)))
}

const modelFields = new Map()
for (const match of schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
  const fields = new Map()
  for (const line of match[2].split(/\r?\n/)) {
    const field = line.match(/^\s{2}(\w+)\s+(\w+)(\?)?(?:\s|$)/)
    if (!field) continue
    const [, name, type, optional] = field
    const scalarTypes = new Set(["String", "Boolean", "DateTime", "Int", "BigInt", "Float", "Decimal", "Json", "Bytes"])
    if (scalarTypes.has(type) || enumValues.has(type)) fields.set(name, { type, optional: Boolean(optional) })
  }
  modelFields.set(match[1], fields)
}

const models = [...modelFields.keys()].filter((model) => Object.hasOwn(sourceTables, model))
const unknownTables = Object.keys(sourceTables).filter((table) => !modelFields.has(table))
if (unknownTables.length) fail(`Unrecognized SQLite tables found (${unknownTables.join(", ")}); review before importing. No database changes were made.`)
if (models.length !== 21) fail(`Expected 21 application tables, found ${models.length}. No database changes were made.`)

const counts = Object.fromEntries(models.map((model) => [model, sourceTables[model].length]))
const sourceRecordCount = Object.values(counts).reduce((sum, count) => sum + count, 0)
console.log(`[IMPORT] source inventory loaded tables=${models.length} records=${sourceRecordCount}`)
const relationDependencies = new Map(models.map((model) => [model, new Set()]))
const relationEdges = []
for (const match of schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
  const model = match[1]
  if (!relationDependencies.has(model)) continue
  for (const relation of match[2].matchAll(/^\s{2}(\w+)\s+(\w+)(?:\?|\[\])?\s+@relation\(([^)]*)\)/gm)) {
    const [, relationField, targetModel, relationOptions] = relation
    if (!relationDependencies.has(targetModel) || targetModel === model) continue
    const foreignKeys = relationOptions.match(/\bfields\s*:\s*\[([^\]]+)\]/)?.[1]
    if (!foreignKeys) continue
    const foreignKeyFields = foreignKeys.split(",").map((field) => field.trim()).filter(Boolean)
    relationDependencies.get(model).add(targetModel)
    relationEdges.push({ parent: targetModel, child: model, relationField, foreignKeyFields })
  }
}

const importOrder = []
const pending = new Set(models)
while (pending.size) {
  const ready = [...pending].filter((model) => [...relationDependencies.get(model)].every((dependency) => !pending.has(dependency)))
  if (!ready.length) fail("The PostgreSQL schema contains a relation cycle; review the import order before migrating.")
  for (const model of ready) { pending.delete(model); importOrder.push(model) }
}
const importPosition = new Map(importOrder.map((model, index) => [model, index]))
for (const edge of relationEdges) {
  if (importPosition.get(edge.parent) >= importPosition.get(edge.child)) {
    fail(`Unsafe dependency order for ${edge.parent} -> ${edge.child} via ${edge.foreignKeyFields.join(", ")}. No database changes were made.`)
  }
}
console.log(`[IMPORT] dependency order: ${importOrder.join(" -> ")}`)
for (const edge of relationEdges) {
  console.log(`[IMPORT] dependency: ${edge.parent} -> ${edge.child} via ${edge.foreignKeyFields.join(", ")} (relation ${edge.relationField})`)
}

const booleanConversions = new Map()
function validateAndNormalize(model, record, rowIndex) {
  const fields = modelFields.get(model)
  const result = {}
  for (const [field, value] of Object.entries(record)) {
    const spec = fields.get(field)
    if (!spec) throw new Error(`Unexpected source field at ${model}.${field}.`)
    if (value === null) {
      if (!spec.optional) throw new Error(`Null source value for required field ${model}.${field}.`)
      result[field] = null
      continue
    }
    switch (spec.type) {
      case "Boolean":
        if (value === true || value === false) result[field] = value
        else if (value === 0 || value === 1) {
          result[field] = value === 1
          const key = `${model}.${field}`
          booleanConversions.set(key, (booleanConversions.get(key) || 0) + 1)
        } else throw new Error(`Invalid Boolean source value at ${model}.${field} (source row ${rowIndex + 1}); expected true, false, 0, or 1.`)
        break
      case "DateTime": {
        const date = value instanceof Date ? value : typeof value === "number" || typeof value === "string" ? new Date(value) : null
        if (!date || Number.isNaN(date.getTime())) throw new Error(`Invalid DateTime source value at ${model}.${field} (source row ${rowIndex + 1}).`)
        result[field] = date
        break
      }
      case "Int":
        if (typeof value !== "number" || !Number.isInteger(value) || value < -2147483648 || value > 2147483647) throw new Error(`Invalid Int source value at ${model}.${field} (source row ${rowIndex + 1}).`)
        result[field] = value
        break
      case "BigInt": {
        if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new Error(`Unsafe BigInt source value at ${model}.${field} (source row ${rowIndex + 1}); precision-preserving extraction is required.`)
        result[field] = BigInt(value)
        break
      }
      case "Float":
        if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Invalid Float source value at ${model}.${field} (source row ${rowIndex + 1}).`)
        result[field] = value
        break
      case "Decimal":
        if ((typeof value !== "number" && typeof value !== "string") || !Number.isFinite(Number(value))) throw new Error(`Invalid Decimal source value at ${model}.${field} (source row ${rowIndex + 1}).`)
        result[field] = new Prisma.Decimal(String(value))
        break
      case "Json":
        if (typeof value !== "string" && typeof value !== "object") throw new Error(`Invalid Json source value at ${model}.${field} (source row ${rowIndex + 1}).`)
        result[field] = typeof value === "string" ? JSON.parse(value) : value
        break
      case "Bytes":
        throw new Error(`Bytes conversion is not configured at ${model}.${field}; refusing lossy import.`)
      default:
        if (enumValues.has(spec.type)) {
          if (typeof value !== "string" || !enumValues.get(spec.type).has(value)) throw new Error(`Invalid enum source value at ${model}.${field} (source row ${rowIndex + 1}).`)
          result[field] = value
        } else {
          if (typeof value !== "string") throw new Error(`Invalid String source value at ${model}.${field} (source row ${rowIndex + 1}).`)
          result[field] = value
        }
    }
  }
  for (const [field, spec] of fields) {
    if (!spec.optional && !Object.hasOwn(result, field)) throw new Error(`Missing required source field ${model}.${field}.`)
  }
  return result
}

const convertedTables = {}
try {
  for (const model of models) convertedTables[model] = sourceTables[model].map((record, index) => validateAndNormalize(model, record, index))
} catch (error) {
  fail(`Source validation failed: ${error.message} No database changes were made.`)
}

const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0)
console.log(`SQLite source: ${absoluteSqlitePath}`)
console.log(`Records discovered in ${models.length} application tables: ${totalRecords}`)
for (const [model, count] of Object.entries(counts)) console.log(`  ${model}: ${count}`)
console.log("Source type validation: PASS (record contents omitted).")
console.log("SQLite integer-to-Boolean values requiring conversion:")
if (!booleanConversions.size) console.log("  none")
else for (const [field, count] of booleanConversions) console.log(`  ${field}: ${count}`)
console.log(`[IMPORT] source validation passed booleanConversions=${[...booleanConversions.values()].reduce((sum, count) => sum + count, 0)}`)
if (!apply || validateOnly) {
  console.log(validateOnly
    ? "Validation-only mode. No PostgreSQL connection or writes were attempted."
    : "Dry run only. Review this dataset and run against an empty staging PostgreSQL database with --confirm-dataset --apply.")
  console.log("[IMPORT] dry-run completed; no database writes attempted")
} else {
  const db = new PrismaClient()
  let activeModel = "target preflight"
  try {
    console.log("[IMPORT] transaction starting")
    await db.$transaction(async (tx) => {
      console.log("[IMPORT] transaction started")
      const delegates = new Map(models.map((model) => [model, model[0].toLowerCase() + model.slice(1)]))
      for (const model of importOrder) {
        activeModel = model
        const delegate = tx[delegates.get(model)]
        const existing = await delegate.count()
        if (existing !== 0) throw new Error(`Target table ${model} is not empty; refusing to merge or overwrite data.`)
      }
      for (const model of importOrder) {
        activeModel = model
        const delegate = tx[delegates.get(model)]
        console.log(`[IMPORT] table ${model}: 0/${counts[model]} processed`)
        for (let offset = 0; offset < convertedTables[model].length; offset += 500) {
          await delegate.createMany({ data: convertedTables[model].slice(offset, offset + 500) })
          console.log(`[IMPORT] table ${model}: ${Math.min(offset + 500, counts[model])}/${counts[model]} processed`)
        }
      }
      for (const model of importOrder) {
        activeModel = model
        const actual = await tx[delegates.get(model)].count()
        if (actual !== counts[model]) throw new Error(`Post-import count mismatch for ${model}: expected ${counts[model]}, found ${actual}.`)
      }
    }, { maxWait: 10_000, timeout: 600_000 })
    console.log("[IMPORT] transaction committed")
    console.log(`[IMPORT] completed records=${totalRecords} tables=${models.length}; all table counts match`)
  } catch (error) {
    const fieldMatch = typeof error?.message === "string"
      ? error.message.match(/(?:Argument|field) [`'\"]?([A-Za-z_]\w*)[`'\"]?/i)
        || error.message.match(/(?:column|field) [`'\"]?([A-Za-z_]\w*)[`'\"]?/i)
      : null
    const safeDetails = []
    if (error?.name === "PrismaClientKnownRequestError" && typeof error.code === "string") safeDetails.push(error.code)
    if (error?.name === "PrismaClientValidationError") {
      const expectedMatch = error.message.match(/Expected (Boolean|String|DateTime|Int|BigInt|Float|Decimal|Json|Bytes), provided (Boolean|String|Date|Int|BigInt|Float|Decimal|Object|Array|Null)/)
      if (expectedMatch) safeDetails.push(`Expected ${expectedMatch[1]}, provided ${expectedMatch[2]}`)
    }
    if (error?.name === "Error" && /Target table .* is not empty/.test(error.message)) safeDetails.push("target table is not empty")
    if (error?.name === "Error" && /Post-import count mismatch/.test(error.message)) safeDetails.push("post-import count mismatch")
    const field = fieldMatch?.[1] || "unknown"
    console.error(JSON.stringify({
      import: "FAILED",
      model: activeModel,
      field,
      errorType: error?.name || "Error",
      details: safeDetails.length ? safeDetails.join("; ") : "Database operation failed; detailed input was suppressed.",
      transaction: "rolled back",
    }))
    process.exitCode = 1
  } finally {
    await db.$disconnect().catch(() => {})
  }
}
