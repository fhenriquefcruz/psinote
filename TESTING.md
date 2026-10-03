# PsiNote Testing

## Quality strategy

PsiNote handles potentially sensitive psychological-service records. Automated quality therefore prioritizes authorization, privacy, professional-workflow reliability, accessibility, mobile usability and regression detection.

No automated test may depend on real patient data or production clinical narrative.

## Reproducible install

CI uses:

`npm ci`

`package-lock.json` is versioned and must remain synchronized with `package.json`.

## Current automated gates

### Dependency security

`npm run security:dependencies`

Fails on moderate, high or critical known dependency vulnerabilities.

### Static security regression guard

`npm run security:check`

Blocks known unsafe browser patterns, including:
- hard-coded privileged accounts;
- public Supabase document URL generation;
- direct destructive Firestore deletes;
- direct destructive Firebase Storage deletes;
- destructive Supabase Storage removal;
- clinical narrative fields referenced by the global-search reader/index writer.

### Lint

`npm run lint`

Uses ESLint flat configuration and fails on dead bindings, undefined variables and other recommended JavaScript correctness rules.

Rules are not globally disabled to turn CI green.

### Typecheck

`npm run typecheck`

Uses TypeScript `checkJs` against the existing JavaScript/JSX application with shared JSDoc domain contracts.

This is the incremental path toward stronger typing; it does not require a destructive whole-application TypeScript rewrite.

### Domain unit tests

`npm run test:unit`

Current pure-domain coverage includes:
- weekly/biweekly/monthly appointment recurrence;
- month-end/leap-year clamping;
- recurrence limits;
- reschedule eligibility and terminal appointment states;
- calendar ranges and navigation;
- document template availability/version lookup;
- conditional Declaration validation;
- psychological report structure;
- restricted-template issue denial;
- search normalization and command matching.

### Firebase Security Rules

`npm run test:rules`

Runs Firestore and Storage emulators and covers:
- unauthenticated denial;
- tenant ownership and cross-tenant IDOR/BOLA denial;
- blocked-user denial;
- ownership/patient-link immutability;
- user role escalation denial;
- minimized append-only activity events;
- clinical hard-delete denial;
- private file access and MIME/size controls;
- storage overwrite/delete denial;
- session revision/lifecycle integrity;
- immutable session versions;
- appointment lifecycle/session linkage;
- document draft -> issued lifecycle;
- immutable issued document metadata;
- privacy-safe search-entry integrity.

### Production build

`npm run build`

Validates the production Vite bundle.

### Browser E2E, accessibility and mobile

`npm run test:e2e:emulated`

Runs Chromium against Firebase Auth/Firestore/Storage emulators using synthetic accounts.

Current coverage includes:
- unauthenticated private-route redirect;
- registration/login/logout;
- password-reset request without real email delivery;
- ordinary-user admin-route denial;
- command palette keyboard/navigation behavior;
- automated Axe checks on critical surfaces;
- responsive usability at 375px, 390px and 430px;
- horizontal page-shell overflow checks;
- critical actions remaining reachable on mobile.

Axe automation is a gate, not a substitute for manual screen-reader/keyboard review.

### Visual regression

`npm run test:visual:emulated`

Critical surfaces are rendered on Linux Chromium under a deterministic visual environment.

Current reviewed baselines:
- login shell;
- daily command center;
- documents center.

The test compares SHA-256 of the actual screenshot against a reviewed Linux baseline and attaches the current PNG on failure.

A baseline hash must never be changed merely to make CI pass; the rendered artifact must be inspected first.

### Production smoke

`npm run test:production-smoke`

Current public smoke verifies:
- deployed production URL responds successfully;
- PsiNote shell/title loads;
- the public auth surface renders;
- uncaught page errors are absent.

Authenticated production smoke is intentionally not performed with real professional credentials in CI.

## Local validation

Run:

`npm run validate`

This executes:
1. dependency audit;
2. static security guard;
3. lint;
4. typecheck;
5. domain unit tests;
6. Firebase Rules tests;
7. production build.

Browser gates require Chromium and Java/Firebase emulators and are run separately.

## Test layers still to expand

The current Phase 7 gate is meaningful but not exhaustive. Future additions should include:
- patient create/edit/archive/reactivate E2E;
- session autosave/offline/reload/concurrency E2E;
- appointment -> session -> finalized-record integration;
- generated document draft -> PDF -> private Storage -> immutable issue integration;
- invalid/oversized upload browser flows;
- expired-token behavior;
- manipulated source IDs inside authenticated E2E;
- keyboard-only full workflow;
- screen-reader manual protocol;
- zoom 200% manual/automated layout checks;
- tested backup/restore exercise.

## Security test principles

A UI-hidden action is not considered secured.

Authorization must be proven at the database/storage boundary.

IDs, URLs and routes are attacker-controlled.

Clinical narrative is excluded from technical logs, search indexes and synthetic test fixtures.
