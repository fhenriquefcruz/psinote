# PsiNote — Phase 0 Deep Inspection

Date: 2026-10-03
Status: in progress
Scope: repository and static production architecture inspection before redesign.

## ESTADO ANTERIOR

PsiNote is a React 18 + Vite 5 single-page application deployed to GitHub Pages. Firebase Authentication and Cloud Firestore are the primary identity/data services. Supabase Storage is used for documents. The application is mostly JavaScript and client-driven, with no trusted application backend in the repository.

Existing product areas include Dashboard, Patients, Agenda, Documents, Reports, Settings and Administration. The Sessions route exists as a placeholder. Patient sessions are stored by services but there is no complete session workspace.

## PROBLEMA

Critical findings:

1. Administrative privilege was granted in the browser by matching one hard-coded email and writing `role: admin` to Firestore.
2. Multiple direct-by-ID reads and writes did not verify record ownership in the service layer.
3. The repository contained no Firestore/Storage Security Rules, so deployed rule posture could not be audited from source control.
4. New document uploads were sent to Supabase and represented by a public URL.
5. Browser-generated activity records could contain patient names/cancellation context and were not append-only by design.
6. The UI claimed automatic 30-day trash deletion although no purge mechanism exists.
7. The UI claimed CRP conformity automatically for generated reports.
8. Session UX is not implemented; global search can navigate to a session detail route that does not exist.
9. Global search downloads broad collections and filters them client-side.
10. Dashboard performs N+1 session queries and emphasizes aggregate cards/charts over immediate work.
11. Document templates are mutable source strings with no template/document version boundary.
12. Admin account blocking changes a Firestore field but does not itself disable Firebase Authentication.
13. CI previously only built/deployed `main`; no PR security gate existed.
14. No repository test suite, TypeScript gate, accessibility gate, visual regression or security-rules test suite exists.

## DECISÃO

Contain security/privacy risks before redesign.

Phase 0 uses Firebase as the containment boundary because Firebase Auth and Firestore already hold identity and primary application data. This is not yet the final Phase 3 architecture decision.

Authorization principles:

- UI roles are presentation only.
- Administrative authority comes from signed Firebase custom claims.
- Clinical data is owner-scoped by authenticated UID.
- Browser clients cannot mutate roles or authoritative account lifecycle state.
- New files are private by default.
- Audit payloads contain metadata, not clinical narrative.
- Destructive clinical deletion is not exposed as a casual browser action.

## IMPLEMENTAÇÃO

Implemented in branch `phase-0/security-foundation`:

- custom-claim-derived admin UI state;
- Firestore deny-by-default rules;
- per-professional record ownership rules;
- private Firebase Storage rules;
- new private document storage service;
- upload size/type validation and SHA-256 metadata;
- defense-in-depth ownership checks in services;
- append-only/minimized activity events;
- browser admin mutations disabled;
- misleading automatic deletion claim removed;
- unsupported automatic conformity claim removed;
- PR security/build workflow.

## ARQUIVOS ALTERADOS

Core:
- `src/contexts/AuthContext.jsx`
- `src/firebase/config.js`
- `src/services/patientService.js`
- `src/services/sessionService.js`
- `src/services/appointmentService.js`
- `src/services/documentService.js`
- `src/services/fileStorageService.js`
- `src/services/activityService.js`
- `src/services/supabaseStorage.js`
- `src/pages/Admin/Admin.jsx`
- affected patient/document/report UI call sites

Security configuration:
- `firestore.rules`
- `storage.rules`
- `firebase.json`
- `scripts/security-check.mjs`
- `.github/workflows/ci.yml`

## MIGRAÇÕES

No destructive data migration has been run.

Required before production:
- set initial admin custom claim through Firebase Admin SDK;
- deploy/test Firestore rules;
- enable/configure Firebase Storage if required;
- configure Storage CORS for approved web origins;
- inventory legacy Supabase documents;
- migrate legacy objects to private storage and remove/rotate any public exposure;
- reconcile legacy user profiles that lack newer metadata fields.

## TESTES

Automated baseline currently includes:
- static security regression check;
- Vite production build in PR CI.

Still required before merge:
- Firestore emulator security-rule tests;
- Storage rule tests;
- authenticated tenant A/B IDOR tests;
- admin-route tests;
- document upload/download/delete tests;
- browser smoke;
- mobile/a11y regression.

## RESULTADO

The codebase is moving from “client trusts itself” to “backend rules are the authority.” This is a containment phase, not the final product experience.

## SEGURANÇA

The main corrected threat classes are privilege escalation, BOLA/IDOR defense-in-depth, public-by-design new document links and sensitive audit payloads.

Legacy public document URLs remain a migration risk until the underlying Supabase objects are moved or access is changed.

## RISCOS RESTANTES

- deployed Firebase rules are not yet verified against production;
- initial admin claim has not been bootstrapped;
- legacy Supabase files remain;
- Firebase Storage may require billing configuration;
- no trusted admin backend exists yet;
- session history versioning is still stored inside the session document;
- search remains client-heavy;
- no MFA/App Check/rate-limiting strategy implemented;
- no verified backup/restore drill exists;
- no E2E/a11y/mobile/visual suite yet.

## PRÓXIMA FASE

Phase 1/2 combined: domain/product audit + security/privacy threat model, followed by Phase 3 architecture ADR.
