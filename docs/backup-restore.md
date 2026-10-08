# AMYC database and uploads backup

These steps preserve the SQLite database and uploaded files without running migrations or changing application data.

## Create a backup

1. Set `DATABASE_URL` to the SQLite file used by the instance. The app's upload directory is `public/uploads`; mount persistent storage there on the VM.
2. For the strongest point-in-time consistency across the database and uploads, pause admin edits/uploads briefly while the backup runs.
3. Run:

   ```sh
   npm run db:backup
   ```

The script uses SQLite `VACUUM INTO` to create a consistent database snapshot, copies `public/uploads`, writes SHA-256 checksums and a manifest, then renames the completed snapshot into `db/backups/amyc-<timestamp>`. Incomplete snapshots are removed. Backups are ignored by Git. Copy completed backup folders off the VM to separate storage; a backup kept only on the VM cannot recover from VM/disk loss.

## Test restoration in an isolated temporary directory

Use the exact backup directory printed by `db:backup`:

```sh
npm run db:backup:verify -- db/backups/amyc-<timestamp>
```

This verifies the database checksum, restores the database and uploads to a uniquely named temporary directory outside the project, runs SQLite `quick_check`, reads every table, and verifies every uploaded file checksum. It removes only that generated temporary directory afterward. It does not connect to or overwrite the live database.

## Restore the live VM

1. Put the site in maintenance mode or stop its service so no writes/uploads occur during restoration.
2. Make a separate copy of the current database and `public/uploads` for rollback. Do not overwrite the only current copy.
3. Confirm the target backup has a valid `manifest.json`, then run `npm run db:backup:verify -- <backup-folder>` before restoring it.
4. Restore `database.sqlite` to the absolute SQLite path used by `DATABASE_URL`, preserving its owner and permissions. Restore the backup's `uploads/` contents into the persistent directory mounted at `public/uploads`.
5. Confirm the service account can read/write the database and upload directory. Start the app, check public pages, admin login, one image and one document, then inspect logs.
6. Keep the pre-restore copy until those checks pass. Keep at least one additional backup off the VM.

The backup script intentionally does not deploy, stop services, or replace a live database. A restore into the live service is an operator action and must be followed by the checks above.

## Limitations

- Database and uploads are copied sequentially. Pause admin changes/uploads for a consistent combined snapshot.
- The app currently stores uploads beneath `public/uploads`. Mount a persistent disk at that path and back it up together with SQLite.
- Backups contain personal/admin data. Restrict access and encrypt off-VM copies.
- Test the restore procedure again after changing the database path, storage mount, or schema.
