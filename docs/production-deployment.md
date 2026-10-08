# AMYC persistent VM deployment checklist

The current application stores its database in SQLite and uploads under `public/uploads`. Deploy it on one persistent VM with a persistent disk. Do not put the SQLite file or uploads on an ephemeral/serverless filesystem.

## Persistent paths

- Keep the database path configured by `DATABASE_URL` on a persistent disk. The current example is `file:../db/custom.db`, resolved relative to the Prisma schema directory.
- Mount persistent storage for `public/uploads` before starting the application. The image upload API writes optimized files beneath this directory.
- Restrict both paths to the application service account. Back up the database and uploads together using [backup-restore.md](./backup-restore.md).
- Keep build output separate from persistent data. A release must not replace or delete the mounted database or uploads directories.

## Environment and release

Inject secrets from the VM's protected environment file or secret store. Do not copy `.env` into the release, Git, a browser bundle, or a deployment artifact. Set:

- `DATABASE_URL` to the persistent SQLite path.
- `NEXTAUTH_SECRET` to a newly generated random secret of at least 32 bytes.
- `NEXTAUTH_URL` to the canonical HTTPS origin.
- `NEXT_PUBLIC_SITE_URL` to the same public origin.
- `VISITOR_ANALYTICS_SECRET` to a separate random secret when visitor identifiers should remain stable if the auth secret rotates.

Set `AMYC_INITIAL_ADMIN_EMAIL` and `AMYC_INITIAL_ADMIN_PASSWORD` only for an intentional first database initialization. Do not use them for routine deployments or run the seed against an existing production database without reviewing its upsert behavior.

Before each release:

1. Take a database and uploads backup and verify it.
2. Build a release artifact with the supported Node version and a lockfile install (`npm ci`).
3. Apply only reviewed migrations with `npm run db:deploy`. Never use `db:reset` in a real environment.
4. Point the service at the release while leaving persistent mounts intact.
5. Start with `npm start`, managed by `systemd` or an equivalent process supervisor. Keep the app bound to loopback behind the reverse proxy.
6. Check health, public routes, admin sign-in, one existing upload, logs, disk space and the database after release.
7. Keep the previous release and pre-deploy backup until rollback checks pass.

## Edge and service protection

- Terminate TLS at a maintained reverse proxy and redirect HTTP to HTTPS. Configure HSTS there after HTTPS has been verified.
- Have the proxy overwrite, rather than trust client-supplied, forwarding headers. The app uses these headers for visitor location and request throttling.
- Apply edge/proxy limits to login, contact, search and image upload routes. Keep the in-process limits as a second layer; they reset on process restart and do not coordinate across multiple instances.
- Set request body limits that allow the image API's 20 MB source limit, while keeping a suitable lower limit for JSON routes.
- Add uptime/error monitoring and alerts for disk usage, process restarts, database errors and failed backups. Do not send request bodies, credentials or full environment values to logs.

## Backup and restore schedule

Create encrypted, access-restricted copies outside the VM on a schedule that matches the acceptable data-loss window. Retain multiple generations. Periodically restore a copy into an isolated staging directory and verify public pages, admin access, an uploaded image and a document. A backup held only on the VM is not a disaster-recovery copy.

## Platform fit

This deployment shape is for a single persistent VM. Before scaling to multiple app instances or moving to serverless hosting, migrate SQLite to a shared database and local uploads to object storage. Reassess sessions, rate limits, backups and upload delivery at that time.
