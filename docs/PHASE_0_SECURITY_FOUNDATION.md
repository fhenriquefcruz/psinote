# Phase 0 — Inspection and Security Foundation

## Estado anterior

PsiNote was a React/Vite static application with Firebase Authentication + Firestore and Supabase Storage. Core pages existed for dashboard, patients, agenda, documents, reports and administration; the Sessions page was only a placeholder.

## Problema

Critical issues found:
- browser-side admin escalation tied to a specific e-mail;
- no versioned Firestore/Storage security rules in the repository;
- direct record reads by ID without an ownership parameter;
- new document uploads generating public Supabase URLs;
- admin mutations performed directly from the browser;
- client audit events carrying unnecessary descriptive fields;
- misleading UI promise of automatic deletion after 30 days;
- no meaningful CI beyond build/deploy.

## Decisão

Prioritize containment before redesign.

Architecture direction: Firebase predominant for current modernization, with Supabase treated as legacy document storage pending migration.

## Implementação

- custom-claim based admin intent;
- deny-by-default Firestore rules;
- per-professional ownership rules;
- private Firebase Storage path for new documents;
- file MIME/size validation and SHA-256 metadata;
- defensive ownership checks in services;
- privacy-minimized activity events;
- admin mutations closed in browser;
- reversible clinical trash;
- security baseline workflow.

## Arquivos alterados

See PR diff. Foundation documents:
- ARCHITECTURE.md
- SECURITY.md
- PRIVACY.md
- DATA_MODEL.md

## Migrações

No destructive data migration has been executed.

Pending:
- legacy Supabase document inventory/migration;
- administrator custom-claim bootstrap;
- deployment of new Firebase rules.

## Testes

Current automated gate:
- security static regression checks;
- production build.

Still required before merge:
- Firebase rules unit tests;
- tenant isolation/IDOR cases;
- authenticated private-storage tests;
- E2E auth/blocked-account tests.

## Resultado

Production remains untouched. Security changes are isolated in a draft PR.

## Segurança

Risk is reduced in code, but production risk is not considered closed until rules and legacy-file migration are validated.

## Riscos restantes

- historical Supabase public URLs;
- no trusted admin backend yet;
- no immutable server-side audit trail yet;
- no tested restore/backup procedure yet;
- document templates require domain/regulatory redesign;
- Sessions workspace is not implemented.

## Próxima fase

Phase 1: domain/product audit and target workflows, followed by Phase 2 security/LGPD completion and Phase 3 target technical architecture refinement.
