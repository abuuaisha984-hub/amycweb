import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const bucket = process.env.SUPABASE_STORAGE_BUCKET || "amyc-public"

export { publicAssetUrl } from "@/lib/public-asset-url"

function storageConfig() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!baseUrl || !serviceKey) return null

  const isNewSecretKey =
    !process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !!process.env.SUPABASE_SECRET_KEY

  const authHeaders: Record<string, string> = {
    apikey: serviceKey,
  }

  if (!isNewSecretKey) {
    authHeaders["Authorization"] = `Bearer ${serviceKey}`
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    serviceKey,
    authHeaders,
  }
}

export async function deletePublicUpload(value: string) {
  if (!value.startsWith("/uploads/")) return

  const config = storageConfig()

  if (config) {
    const key = value
      .slice(1)
      .split("/")
      .map(encodeURIComponent)
      .join("/")

    const response = await fetch(
      `${config.baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${key}`,
      {
        method: "DELETE",
        headers: config.authHeaders,
        cache: "no-store",
      },
    )

    if (!response.ok && response.status !== 404) {
      throw new Error(
        `Object storage delete failed (${response.status}).`,
      )
    }

    return
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.AMYC_UPLOAD_SECURITY_TEST_MODE !== "1"
  ) {
    throw new Error(
      "Configure Supabase Storage before deleting production uploads.",
    )
  }

  const segments = value.slice(1).split("/")

  if (
    segments.some(
      (segment) =>
        !segment || segment === "." || segment === "..",
    )
  ) {
    throw new Error("Invalid upload path.")
  }

  const { unlink } = await import("node:fs/promises")

  await unlink(
    path.join(process.cwd(), "public", ...segments),
  ).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") {
      throw error
    }
  })
}

/**
 * Store an upload in Supabase Storage in production
 * and on disk in local development.
 */
export async function storePublicUpload(
  key: string,
  bytes: Buffer,
  contentType: string,
) {
  const normalizedKey = key
    .replace(/^\/+/, "")
    .split("/")
    .map(encodeURIComponent)
    .join("/")

  const config = storageConfig()

  if (config) {
    const response = await fetch(
      `${config.baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${normalizedKey}`,
      {
        method: "POST",
        headers: {
          ...config.authHeaders,
          "Content-Type": contentType,
          "x-upsert": "false",
        },
        body: new Uint8Array(bytes),
        cache: "no-store",
      },
    )

    if (!response.ok) {
      const message = await response.text().catch(() => "")

      throw new Error(
        `Object storage upload failed (${response.status}): ${message.slice(
          0,
          300,
        )}`,
      )
    }

    return `${config.baseUrl}/storage/v1/object/public/${encodeURIComponent(
      bucket,
    )}/${normalizedKey}`
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.AMYC_UPLOAD_SECURITY_TEST_MODE !== "1"
  ) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_STORAGE_BUCKET and SUPABASE_SERVICE_ROLE_KEY before enabling production uploads.",
    )
  }

  const safeSegments = key
    .replace(/^\/+/, "")
    .split(/[\\/]+/)

  if (
    safeSegments.some(
      (segment) =>
        !segment || segment === "." || segment === "..",
    )
  ) {
    throw new Error("Invalid upload path.")
  }

  const destination = path.join(
    process.cwd(),
    "public",
    ...safeSegments,
  )

  await mkdir(path.dirname(destination), {
    recursive: true,
  })

  await writeFile(destination, bytes, {
    flag: "wx",
  })

  return `/${safeSegments.join("/")}`
}