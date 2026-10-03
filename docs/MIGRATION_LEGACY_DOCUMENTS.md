# Legacy Document Migration

## Purpose

PsiNote historically stored document metadata with mixed provenance:

- manually uploaded files;
- browser-generated PDFs;
- legacy Supabase public URLs;
- records without template/version/lifecycle metadata.

Phase 5 introduces explicit immutable issuance. Legacy records must not be retroactively presented as if they were created under the new issuance model when that cannot be proven.

## Conservative classification

For each legacy record:

### Proven external/private attachment
When provenance indicates an uploaded file and private object identity can be verified:
- classify as `kind=attachment`;
- classify as `status=stored`;
- preserve original creation/upload metadata.

### Proven generated document
Only if historical metadata can reliably prove:
- document type/template identity;
- actual content provenance;
- author;
- issue timestamp;
- patient link;
- file identity;

may a migration assign generated-document metadata.

Do not invent `templateVersion=1` merely because the current template has version 1.

### Unknown provenance
Treat as legacy stored artifact and surface an explicit migration/provenance state if needed. Do not label it as a new-style immutable issue.

## Supabase migration

Historical public URLs remain a known risk until each object is handled.

A privileged migration must:

1. inventory every legacy URL/object;
2. download from the trusted legacy source;
3. verify MIME and size;
4. calculate SHA-256;
5. upload into the private Firebase Storage tenant path;
6. write private storage metadata;
7. verify retrievability with the owner identity;
8. remove or privatize the old object through the provider/backend;
9. record migration telemetry without document body/content.

Never perform the destructive source cleanup from the browser.

## Backups and rollback

Before migration:
- export Firestore document metadata;
- inventory legacy storage objects;
- preserve mapping from legacy record/object to migrated object;
- test restore from the export.

Rollback before legacy cleanup consists of reverting metadata to the original object mapping.

After source cleanup, rollback depends on the verified pre-migration backup.

## Retention

Do not implement arbitrary automatic deletion.

Psychological documents and supporting material require retention analysis under applicable CFP rules and any longer legal/judicial requirement. Disposal requires an explicit privileged policy/workflow with audit evidence.

## Production gate

Before declaring document migration complete:
- all legacy objects inventoried;
- public-link exposure measured;
- non-production migration rehearsal complete;
- hashes/counts reconcile;
- owner access verified;
- cross-tenant access denied;
- restore tested;
- retention/privacy review complete.
