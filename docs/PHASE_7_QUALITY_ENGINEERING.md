# Phase 7 — Quality Engineering

## ESTADO ANTERIOR

The project had a security/build baseline and emulator Rules tests, but the original quality contract was incomplete:

- no lint gate;
- no static typecheck gate;
- no browser E2E gate;
- no automated accessibility gate;
- no formal 375/390/430 mobile matrix;
- no reviewed visual regression gate;
- no public production smoke gate;
- CI used mutable `npm install`.

## PROBLEMA

A build-only definition of success could allow regressions in authentication, routing, accessibility, mobile usability and visual layout.

The lack of lint/type contracts also hid real defects, including one legacy patient-profile path that called the ownership-aware service without the current professional ID.

## DECISÃO

Create a layered quality system:

1. reproducible dependency install;
2. dependency/security guard;
3. lint;
4. JavaScript typecheck via TypeScript `checkJs`;
5. domain unit tests;
6. Firebase Rules tests;
7. production build;
8. browser E2E with synthetic emulator data;
9. automated WCAG checks;
10. mobile viewport matrix;
11. reviewed visual regression;
12. public production smoke.

## IMPLEMENTAÇÃO

### Reproducibility
- synchronized `package-lock.json`;
- CI uses `npm ci`;
- Node 24;
- Java 21 for Firebase Emulator Suite.

### Static quality
- ESLint 10 flat configuration;
- TypeScript 7 `checkJs`;
- shared JSDoc domain records;
- dead code/import cleanup;
- corrected legacy PatientProfile ownership call.

### Browser isolation
- Auth, Firestore and Storage emulator support in frontend config;
- synthetic `example.test` accounts;
- no production data/credentials in E2E.

### Accessibility
- semantic login/register/reset forms;
- explicit labels and headings;
- Axe A/AA checks on critical surfaces.

### Mobile
- Playwright matrix:
  - 375x812;
  - 390x844;
  - 430x932;
- core actions and horizontal-shell overflow checks.

### Visual regression
Reviewed Linux Chromium baselines for:
- login shell;
- command center;
- documents center.

Actual screenshot bytes are hashed and compared against reviewed SHA-256 baselines. Failure artifacts include the current PNG.

### Production smoke
Public production shell is checked for HTTP success, auth rendering and uncaught page errors without using real credentials.

## TESTES / QUALITY GATES

A validated Phase 7 head requires all CI jobs to pass:

### Baseline
- dependency audit;
- static security;
- lint;
- typecheck;
- unit tests;
- Firebase Rules;
- build.

### Browser quality
- E2E;
- Axe accessibility;
- mobile matrix.

### Visual regression
- reviewed critical-surface baselines.

### Production smoke
- deployed public shell.

## SEGURANÇA

Tests use local Firebase emulators and synthetic identities.

No clinical narrative or real patient data is required.

Browser tests do not weaken Firestore/Storage authorization.

## RISCOS RESTANTES

Quality coverage is materially stronger, but not complete.

Still required in future hardening:
- full patient lifecycle E2E;
- session autosave/offline/concurrency E2E;
- document Storage issuance E2E;
- expired-token tests;
- browser-level manipulated-ID cases;
- manual screen-reader protocol;
- explicit 200% zoom verification;
- backup/restore rehearsal.

## PRÓXIMA FASE

Observability, backup/recovery and production-readiness architecture, followed by staged integration of the stacked phases.
