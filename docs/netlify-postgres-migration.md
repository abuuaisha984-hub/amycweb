# Netlify PostgreSQL and upload storage

The normal development schema remains SQLite for local workflows. Netlify generates the Prisma Client and applies the separately versioned PostgreSQL schema at `prisma-postgres/schema.prisma` and migrations at `prisma-postgres/migrations/`. The PostgreSQL baseline preserves the existing model and field names.

## Netlify build and database setup

1. Configure `DATABASE_URL` in Netlify as the PostgreSQL runtime connection string. Set `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` for persistent uploads. `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` must match the bucket name. The bucket must be public because current media and document links are public. Keep all secret values in Netlify's protected environment settings.
2. Create a fresh staging PostgreSQL database and apply the reviewed schema with `npm run db:migrate:postgres`. The Netlify build generates the PostgreSQL client but does not apply schema migrations automatically.
3. Back up the source SQLite database and `public/uploads` and verify that backup before importing. Keep the original SQLite database unchanged.
4. Run `npm run db:migrate:sqlite:postgres -- --sqlite=<path-to-backup-database.sqlite>` to print record counts only. Review the dataset and identify/remove any records that are strictly test/demo data in a separately reviewed staging copy.
5. Only against an empty staging PostgreSQL database, import the reviewed dataset with `npm run db:migrate:sqlite:postgres -- --sqlite=<path-to-reviewed-database.sqlite> --confirm-dataset --apply`. The script reads SQLite in read-only mode, preserves IDs and scalar values, imports relation dependencies before dependents in one PostgreSQL transaction, and verifies counts. It refuses unknown SQLite tables or non-empty PostgreSQL tables. It does not migrate uploaded file bytes.
6. Run `npm run storage:migrate:supabase` to inventory local files without uploading. Review the counts, then run `npm run storage:migrate:supabase -- --apply` with staging credentials to copy files into matching object keys. Existing `/uploads/...` database references remain valid and are translated to public object URLs when rendered. The script retains local source files and can be rerun to repair a partial copy.
7. Verify staging login, admin role restrictions, visitor analytics, public pages, representative CRUD, JPG/PNG/WebP/PDF access and document deletion. Run the production cutover only after a separate backup and approved staging results.

The initial migration is generated from an empty PostgreSQL schema. Later schema changes must be created as new PostgreSQL migrations in `prisma-postgres/migrations`; do not copy SQLite migration SQL into that directory. Do not run the import command against production before the staging checklist and backup gates pass.

## Storage behavior

Image and document APIs retain their existing session, role, MIME/signature, size and randomized-filename checks. Production writes require Supabase Storage configuration; local development continues to use `public/uploads`. Object names are stable under `uploads/images/...` and `uploads/docs/...`. Document deletion archives the record and requests object deletion; a storage error returns 502 so the operator can retry cleanup.
