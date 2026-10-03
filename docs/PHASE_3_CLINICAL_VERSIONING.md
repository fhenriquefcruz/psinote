# Phase 3 — Clinical Versioning

## ESTADO ANTERIOR

Session history was embedded in `sessions.previousVersions`, capped at ten items. Autosave and formal saves shared the same parent document, while finalized records did not have a database-bound rule preventing silent browser edits.

## PROBLEMA

- capped embedded history;
- parent document growth;
- historical state could be rewritten with the parent;
- version history was not a first-class secured entity;
- finalized-record integrity depended too much on UI behavior.

## DECISÃO

Keep the current session state in `sessions` and persist superseded formal states in immutable `session_versions`.

Separate:
- `revision`: every persisted edit/autosave;
- `version`: formal save or lifecycle transition.

## IMPLEMENTAÇÃO

- transactional capture of the previous formal state;
- immutable `session_versions`;
- read-only version history in the session workspace;
- legacy embedded history remains readable and immutable;
- explicit lifecycle rules for draft/finalized/archived;
- finalized session cannot be silently edited while remaining finalized;
- version snapshot must match its actual parent session state.

## MIGRAÇÕES

No destructive migration executed.

See `docs/MIGRATION_SESSION_VERSIONS.md` for privileged backfill strategy.

## TESTES

Rules tests cover:
- valid append;
- cross-tenant denial;
- parent/patient mismatch;
- forged historical snapshot denial;
- update/delete denial;
- revision sequencing;
- finalized-session silent edit denial;
- explicit finalized -> draft transition;
- legacy embedded-history mutation denial.

## SEGURANÇA

Clinical history is separated from low-sensitivity activity/audit telemetry. Version records contain clinical content and therefore receive the same tenant isolation as the parent record.

## RISCOS RESTANTES

- existing embedded histories still need trusted backfill;
- high-value compliance audit events remain client-originated;
- no backend privileged retention/disposal runtime yet;
- concurrent editor conflict UX still needs explicit product handling.

## PRÓXIMA FASE

Agenda professional workflow and document architecture, followed by global command/search.
