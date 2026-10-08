# Secret rotation and Git history cleanup plan

**Status: plan only. No Git history rewrite, force push, database reset, or live credential change is performed by this document.**

## Confirmed exposure scope

The current refs show these commits touching sensitive paths:

| Commit | Files | Finding |
| --- | --- | --- |
| `fd5cfe8` | `.env` added | Initial environment file entered history. |
| `85a60be` | `.env` modified; `db/custom.db` and `prisma/seed.ts` added | Environment values and the database were committed; an older seed revision included a plaintext initial admin credential. |
| `9f60961` | `db/custom.db`, `prisma/seed.ts` modified | The database and seed history continued. |
| `fcbb440` | `db/custom.db` modified | Database changes continued. |
| `63545aa` | `.env`, `db/custom.db`, `prisma/seed.ts` added | An agent checkpoint ref also points at a tree containing these paths. |
| `ca6d27b` | `.env`, `db/custom.db`, `prisma/seed.ts` added | A later agent checkpoint ref also points at a tree containing these paths. |

Additional `refs/codex/turn-diffs/*` refs are present in this local repository. They must be included in the ref inventory and the post-rewrite scan; removing only `main` and a backup branch would not establish that every local ref is clean. There is no configured Git remote. The `.env` history included the key names `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`; values are deliberately not recorded here.

The historical SQLite database contains authentication records and password hashes, contact messages with names/email/phone/message text, administrative audit entries, and visitor analytics/location summaries, as well as public website content. Treat the full database as sensitive; do not export row contents into the cleanup report.

## Rotation before any history rewrite

1. Treat the previously shared admin password as compromised. In a private terminal connected to the intended production database, run `npm run admin:password-reset`. Verify the replacement password by signing in, then revoke other sessions by rotating `NEXTAUTH_SECRET`.
2. Generate a fresh production `NEXTAUTH_SECRET` (at least 32 random bytes) and a separate `VISITOR_ANALYTICS_SECRET`; store both in the VM secret store, not in Git or a browser bundle. Keep the production database URL and canonical HTTPS URLs in the VM's protected environment.
3. Rotate any database credentials if the production database is remote. SQLite has no database password; protect its file and directory permissions instead.
4. Do not run `prisma/seed.ts` against production for password rotation. The CLI tool updates only the selected active account's hash.

This repository's local `.env` has a newly generated local auth secret, but that does not prove that the production VM secret or admin password has been changed.

## Required preservation and backup gates

Before cleanup is authorized:

1. Stop pushes and commits temporarily and identify all intended code changes in the current dirty worktree. The remediation changes are currently uncommitted and include valuable fixes; record them in a protected working-tree archive or review them into a commit first. Never use `reset --hard`, `clean -fd`, or an in-place history rewrite against this dirty checkout.
2. Create a complete repository mirror/bundle including every branch, tag, and local custom ref; encrypt it with an approved strong encryption tool, place it outside the repository and VM, restrict access, and verify the encrypted archive can be listed/restored. It intentionally contains the exposed history and must be handled like a credential vault.
3. Make a separately encrypted, off-VM database-and-uploads backup and verify its restore. The existing `db/backups/amyc-2026-10-07T14-47-04-998Z` is a local unencrypted working-machine backup only; it does not satisfy this gate.
4. Confirm that the production password/secret rotation is complete and that stakeholders with clones have been notified that old credentials are revoked.

## Proposed commands, only after explicit approval

Use a new isolated clone. Do not run these in the working checkout. Example placeholders below must be replaced with protected paths; never place secrets in command arguments.

```powershell
# Create an isolated mirror outside the project. Inspect all refs before changing it.
git clone --mirror C:\Users\HomePC\Desktop\amycweb C:\secure-work\amycweb-clean.git
git -C C:\secure-work\amycweb-clean.git for-each-ref --format="%(refname) %(objectname)"

# In that isolated mirror only, after the encrypted recovery archive is verified:
git -C C:\secure-work\amycweb-clean.git filter-repo --sensitive-data-removal --invert-paths --path .env --path db/custom.db --path prisma/seed.ts

# Re-add the reviewed, sanitized current seed from the preserved worktree, then commit it.
# Scan every ref/history, all reachable blobs, the index and the clean checkout for
# .env, db/custom.db and the retired initial credential before publishing.
git -C C:\secure-work\amycweb-clean.git log --all -- .env db/custom.db prisma/seed.ts
git -C C:\secure-work\amycweb-clean.git rev-list --objects --all
```

The actual process should use a normal temporary clone made from the sanitized mirror for restoring reviewed current files. The example deliberately does not include a publish or force-push command: there is no remote configured, and introducing one later requires a separate coordinated approval. Verify that every local/custom ref was rewritten or removed, and scan for known secret fingerprints without printing matches or credential values. If an external hosting service has cached/forked the repository, request purge there too; rewriting this checkout cannot remove external copies.

## Risks and clone handling

- Every rewritten commit receives a new ID. Pull requests, tags/signatures, branch comparisons, and existing clone histories can become invalid.
- A collaborator who pushes an old clone can restore the exposed history. After publication, collaborators must make fresh clones and reapply only reviewed, sanitized uncommitted work; they must not merge old history.
- The database contains user/contact and admin data; removing it from Git does not erase prior copies or replace password rotation.
- Local Codex/agent refs may preserve otherwise unreachable commits. Audit all refs and object reachability, not only `main`.
- Do not delete the encrypted recovery archive until the clean repository and every required ref have been verified and stakeholders agree to the retention period.

## Approval point

The next destructive step would create a full encrypted recovery archive and rewrite all contaminated refs in an isolated mirror, preserving the current worktree. It remains pending because the user has not approved that destructive Git history operation. No approval is requested for continued non-destructive remediation.
