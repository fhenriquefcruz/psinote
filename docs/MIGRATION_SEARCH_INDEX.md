# Search Index Migration

## Purpose

Phase 6 introduces `search_entries`, a derived metadata-only index.

Existing patients, sessions, documents and document drafts created before Phase 6 do not automatically have index entries.

The migration must create search metadata without copying clinical narrative into the index.

## Source-to-index mapping

### Patient
Copy only:
- psychologistId;
- entity ID;
- patient ID;
- name;
- lifecycle status;
- searchable flag derived from active status.

Do not copy contact details, anamnesis or notes.

### Session
Copy only:
- psychologistId;
- session ID;
- patientId;
- patientName;
- session date;
- sessionNumber;
- lifecycle status;
- formal version;
- searchable flag derived from archive status.

Do not copy:
- theme;
- observations;
- evolution;
- interventions;
- referrals;
- agreements;
- next steps;
- tags;
- any session-version snapshot content.

### Document
Copy only:
- psychologistId;
- document ID;
- patientId;
- file/document name;
- status;
- kind;
- template ID/version;
- document version.

Do not copy document body or PDF text.

### Draft
Copy only:
- psychologistId;
- draft ID;
- patientId;
- patientName;
- draft status;
- template ID/version;
- issue version.

Do not copy draft values/form contents.

## Execution strategy

Backfill must run from a trusted Admin environment.

For each source collection:

1. page records in bounded batches;
2. construct the allowed metadata projection;
3. write deterministic `search_entries/{entityType}_{entityId}`;
4. record counts by entity type/tenant;
5. run invariant checks against source IDs;
6. verify no forbidden clinical field exists in any index document.

## Verification

Required checks:
- index count by entity type;
- random source/index equality samples;
- zero cross-tenant reads in emulator/non-production;
- zero unexpected keys in index entries;
- search opens source entities only after source authorization succeeds;
- archived/deleted patient entries are non-searchable;
- archived session entries are non-searchable;
- issued drafts are non-searchable.

## Rollback

The index is derivative and non-authoritative.

Rollback can delete/rebuild the index from a privileged maintenance environment without modifying source records.

Browser clients must not perform destructive index cleanup.

## Production gate

Before relying on global search for legacy data:
- Admin backfill runtime exists;
- non-production backfill completes;
- counts reconcile;
- forbidden-field scan passes;
- source authorization tests pass;
- search result quality is sampled with synthetic/non-production data.
