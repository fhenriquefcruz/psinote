# Phase 6 — Safe Command Search

## ESTADO ANTERIOR

The header contained a small search box that queried full patient/session/document records in the browser.

Session search compared fields such as clinical theme/evolution/tags client-side. Even when only a short result row was rendered, the browser still downloaded full clinical session documents.

## PROBLEMA

- clinical narrative entered the global-search path;
- search returned full source records to the component;
- no command palette or keyboard workflow;
- result scope was inconsistent;
- data scanning became more expensive as collections grew;
- no regression guard prevented sensitive clinical fields from returning to search.

## DECISÃO

Global search must operate only on a derived metadata index.

`search_entries` is:
- tenant-scoped;
- non-authoritative;
- source-validated by Firestore Rules;
- limited to navigation metadata;
- safe to rebuild;
- never a replacement for source authorization.

The command palette combines:
- static product commands;
- patient metadata;
- session patient/date/status metadata;
- document name/template/version metadata;
- document-draft metadata.

It does not search clinical narrative.

## IMPLEMENTAÇÃO

### Command palette
- click trigger in Header;
- `Ctrl/Cmd + K`;
- Escape closes;
- arrow navigation;
- Enter opens;
- mouse/focus selection aligned;
- mobile bottom-sheet behavior;
- commands available even with an empty query.

### Metadata index
New `search_entries` collection.

Source workflows maintain derived entries for:
- patient create/update/archive/restore/trash/duplicate;
- session create/formal save/finalize/reopen/archive/restore/duplicate;
- document draft creation/issue;
- private attachment creation;
- generated document issue.

Index failures do not roll back the authoritative source record. Reconciliation/backfill can restore the derivative index.

### Search results
The search service reads only `search_entries`.

It returns a minimized projection:
- source ID;
- type;
- title;
- safe subtitle;
- route/action.

Opening a document triggers a fresh authorized document lookup by ID.

### Regression guard
`security:check` fails if the global-search reader or index writer references clinical narrative fields including:
- mainTheme;
- clinicalEvolution/evolution;
- observations;
- interventions;
- referrals;
- agreements;
- nextSteps;
- anamnesis;
- tags.

## SEGURANÇA

Firestore Rules validate every search entry against its source record:
- owner must match;
- source must exist;
- title/status/patient link must match source;
- session date/number/version must match source;
- document kind/template/version must match source;
- draft template/version/status must match source;
- arbitrary fields are denied;
- delete is denied;
- another tenant cannot read the entry.

The search index does not grant source access.

## MIGRAÇÕES

Existing source records need a trusted metadata-index backfill.

See `docs/MIGRATION_SEARCH_INDEX.md`.

There is intentionally no fallback that scans clinical collections merely to make legacy search results appear.

## TESTES

Unit:
- accent/case/whitespace normalization;
- metadata matching;
- command matching.

Security Rules:
- owner read;
- cross-tenant denial;
- forged title denial;
- forged searchability denial;
- clinical-field smuggling denial;
- source-bound session metadata;
- source-bound document/draft metadata;
- immutable entity identity.

Static security:
- clinical narrative references in either search boundary file fail the build gate.

## RISCOS RESTANTES

- legacy entities are absent from global search until backfilled/touched;
- search currently scans a bounded number of lightweight index entries per tenant instead of using an external full-text engine;
- organization/shared-tenant search semantics require the future organization model;
- typo tolerance/ranking beyond normalization is intentionally limited;
- recent-search history is intentionally not persisted to avoid creating another sensitive behavioral dataset.

## PRÓXIMA FASE

Expand quality engineering: integration tests, Playwright E2E, accessibility, mobile matrix, visual regression and production smoke.
