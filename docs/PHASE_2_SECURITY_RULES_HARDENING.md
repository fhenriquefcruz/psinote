# Phase 2 — Security Rules Hardening

## ESTADO ANTERIOR

Phase 0 introduced tenant-aware Firestore/Storage Rules and Phase 1 established a professional workflow. However, authenticated browser clients could still invoke destructive SDK operations directly against their own records/files, bypassing safer UI lifecycle patterns.

Security Rules had not yet been exercised automatically with authenticated/unauthenticated emulator identities.

## PROBLEMA

- browser hard delete remained technically possible for patients, sessions, appointments and documents;
- Firebase Storage allowed destructive update/delete for owner paths;
- client helpers for destructive operations remained in the bundle;
- legacy Supabase browser dependency remained even after new uploads moved to Firebase;
- IDOR/BOLA and privilege-escalation controls had no executable rule tests.

## DECISÃO

Treat the browser as incapable of permanent clinical disposal.

Permanent destruction/retention actions require a future trusted privileged workflow with explicit policy and audit.

Use Firebase Emulator Suite as a required CI authorization gate.

## IMPLEMENTAÇÃO

- Firestore hard delete denied for clinical/operational collections;
- immutable tenant ownership;
- immutable patient linkage for sessions/appointments/documents;
- immutable creation metadata;
- activity-event shape constrained and append-only;
- Firebase Storage owner-scoped read/create only;
- file overwrite/delete denied to browser clients;
- destructive document/appointment controls removed from UI and services;
- destructive storage helper removed;
- legacy Supabase browser client removed;
- security regression scanner blocks destructive SDK patterns;
- emulator configuration added;
- Firestore and Storage Rules test suites added;
- Java 21 + Rules tests added to CI.

## MIGRAÇÕES

No destructive production migration was executed.

Legacy Supabase-hosted historical files remain a controlled migration item; the browser client no longer contains mutation capability for that storage.

## TESTES

Covered through emulator tests:
- owner access;
- unauthenticated denial;
- cross-tenant access denial;
- forged ownership denial;
- patient-link tampering denial;
- creation metadata tampering denial;
- blocked account denial;
- role escalation denial;
- admin clinical-access denial;
- activity log minimization/immutability;
- hard-delete denial;
- Storage private access and immutability.

## SEGURANÇA

This phase closes a direct bypass where a technically capable authenticated user could ignore the UI and call destructive client SDK methods.

## RISCOS RESTANTES

- administrator custom claim still requires trusted bootstrap;
- legacy public Supabase URLs require inventory/migration/revocation;
- audit events for high-value operations are still browser-originated and should move server-side;
- retention/disposal backend does not yet exist;
- CSP/security headers depend on final hosting architecture;
- backup/restore exercises are not yet implemented;
- auth/session E2E tests remain pending.

## PRÓXIMA FASE

Complete security/privacy architecture decisions and then extend the CI quality stack with unit/integration/E2E/accessibility/mobile gates.
