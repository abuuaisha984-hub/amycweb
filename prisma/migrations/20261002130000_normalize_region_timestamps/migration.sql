-- Legacy Region.createdAt values were stored as epoch milliseconds. Convert
-- them to ISO-8601 strings so Prisma can hydrate the full region directory.
UPDATE "Region"
SET "createdAt" = strftime('%Y-%m-%dT%H:%M:%fZ', CAST("createdAt" AS INTEGER) / 1000.0, 'unixepoch')
WHERE typeof("createdAt") IN ('integer', 'real');

-- Normalize timestamps written by the preceding migration to the same format
-- used by Prisma's SQLite DateTime fields.
UPDATE "Region"
SET "dateVerified" = replace("dateVerified", ' ', 'T') || 'Z'
WHERE "dateVerified" IS NOT NULL AND substr("dateVerified", 11, 1) = ' ';

UPDATE "Region"
SET "updatedAt" = replace("updatedAt", ' ', 'T') || 'Z'
WHERE substr("updatedAt", 11, 1) = ' ';
