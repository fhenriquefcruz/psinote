# Session Version Migration

## Purpose

PsiNote historically stored up to ten prior session states inside `sessions.previousVersions`.

Phase 3 stops growing that embedded array and moves new formal history to immutable `session_versions` records.

No production record is deleted or rewritten as part of this phase.

## Compatibility behavior

While migration is incomplete:

- current session state remains in `sessions`;
- new superseded states are written to `session_versions`;
- existing `previousVersions` remains unchanged;
- the application reads both sources and de-duplicates by version;
- Security Rules prevent a browser from rewriting the legacy array.

## Backfill strategy

Backfill must run from a trusted Firebase Admin environment, never from the browser.

For each session containing `previousVersions`:

1. verify `psychologistId`, `patientId` and session ownership metadata;
2. validate every embedded version shape;
3. create an immutable `session_versions` record using deterministic identity;
4. preserve the original version number and best available historical timestamp/author;
5. calculate and record migration telemetry using technical IDs only;
6. verify count and sampled content hashes;
7. only after complete verified backfill, remove the legacy embedded array through a privileged migration;
8. retain a migration audit record without copying clinical narrative into technical logs.

## Rollback

Before legacy removal, rollback is trivial because the source array remains untouched.

After a future verified cleanup, rollback must use the pre-migration backup/export. Therefore the cleanup phase requires a tested backup/restore exercise before execution.

## Production gate

Do not remove `previousVersions` from production documents until:

- Admin migration runtime exists;
- backup is verified;
- migration has passed in non-production;
- counts/hashes reconcile;
- retention/privacy review is complete.
