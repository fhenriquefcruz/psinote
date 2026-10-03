# PsiNote Testing

## Quality strategy

PsiNote handles potentially sensitive psychological-service records. Tests are therefore organized around professional workflow reliability, authorization, privacy, accessibility and recovery rather than only component rendering.

## Current automated gates

### Dependency security
`npm run security:dependencies`

Fails on moderate, high or critical known dependency vulnerabilities.

### Static security regression guard
`npm run security:check`

Blocks known unsafe patterns in the browser bundle, including:
- hard-coded privileged accounts;
- public Supabase document URL generation;
- direct destructive Firestore deletes;
- direct destructive Firebase Storage deletes;
- destructive Supabase Storage removal.

### Domain unit tests
`npm run test:unit`

Current pure-domain coverage includes:
- weekly/biweekly/monthly appointment recurrence;
- end-of-month clamping, including leap years;
- recurrence validation limits;
- reschedule eligibility and terminal appointment states;
- Monday-to-Sunday week boundaries;
- month calendar grids;
- day/week/month/list query ranges;
- calendar month navigation.

### Firebase Security Rules
`npm run test:rules`

Runs Firestore and Storage emulators using a demo project ID and tests:
- unauthenticated denial;
- tenant ownership;
- cross-tenant IDOR/BOLA denial;
- blocked-user denial;
- ownership and patient-link immutability;
- creation metadata preservation;
- user role escalation denial;
- admin account-profile access without clinical-record bypass;
- append-only minimized activity events;
- clinical hard-delete denial;
- private file access;
- MIME validation;
- empty-file rejection;
- storage overwrite/delete denial;
- session revision sequencing;
- finalized-session silent edit denial;
- immutable version append/read boundaries;
- version snapshot/parent consistency;
- immutable legacy embedded history.

The tests use `@firebase/rules-unit-testing`, which supports mock authenticated contexts against the Emulator Suite without contacting production.

### Production build
`npm run build`

Validates that the current frontend compiles with production settings.

## Local validation

Run:

`npm run validate`

This currently executes dependency audit, static security checks, domain unit tests, Firebase Rules tests and production build.

The Firebase emulator requires Java. CI uses Java 21.

## Required test layers still to add

### Unit still to add
- document-template validation;
- patient/session payload schemas;
- autosave state machine;
- retention eligibility policy.

### Integration
- appointment -> session -> finalized record linkage;
- patient archive/reactivation;
- document metadata + storage upload;
- version history;
- global search query boundaries.

### End-to-end
Use Playwright for:
- registration/login/password reset;
- private-route behavior;
- patient CRUD lifecycle;
- session create/autosave/reload/finalize/reopen;
- agenda status transitions;
- document upload/access;
- admin route denial;
- expired session;
- manipulated URL/ID;
- mobile viewport matrix.

### Accessibility
WCAG 2.2 AA checks:
- keyboard navigation;
- focus visibility/order;
- accessible names/labels;
- dialog semantics;
- contrast;
- 200% zoom;
- reduced motion;
- touch target size.

### Visual regression
Baseline only after the design-system migration is stable. Snapshot changes must be reviewed, never accepted merely to turn the gate green.

### Production smoke
After deployment:
- public auth page loads;
- login succeeds for test account;
- authenticated dashboard loads;
- one tenant-scoped read succeeds;
- cross-tenant fixture remains denied;
- no console error containing personal/clinical data.

## Security test principles

A UI-hidden action is not considered secured.

Authorization behavior must be tested at the database/storage boundary. IDs, routes and links are always treated as attacker-controlled.

Tests must never use production patient data or real clinical narrative.
