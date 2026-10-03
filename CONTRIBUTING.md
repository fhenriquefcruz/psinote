# Contributing to PsiNote

PsiNote is evolving toward a professional PsychologyTech product. Contributions must preserve privacy, authorization boundaries and professional-workflow integrity.

## Branch and review strategy

- work on a dedicated branch;
- keep phases/increments reviewable;
- avoid giant unrelated commits;
- use preview/emulated environments before production;
- do not merge with a red required gate.

## Required validation

Before requesting merge, run at minimum:

```bash
npm ci
npm run validate
```

Changes affecting user workflows should also run the relevant Playwright suites.

The CI quality gate currently requires:
- dependency security audit;
- security regression guard;
- lint;
- JavaScript typecheck;
- domain unit tests;
- Firebase Rules tests;
- production build;
- browser E2E;
- automated accessibility;
- mobile viewport matrix;
- visual regression;
- production smoke.

## Sensitive data

Never:
- commit patient information;
- use real clinical narrative in tests;
- put clinical content in console/error telemetry;
- expose permanent public document URLs;
- bypass tenant ownership for convenience.

Use synthetic fixtures with reserved/non-real addresses such as `example.test`.

## Authorization

Frontend visibility is not authorization.

Any clinical-data query or mutation must be protected at Firestore/Storage/backend boundary.

When adding a new entity:
1. define tenant/ownership semantics;
2. create Security Rules or server authorization;
3. add IDOR/BOLA tests;
4. prevent ownership transfer unless explicitly designed.

## Data lifecycle

Prefer reversible/archive workflows for browser actions involving clinical records.

Permanent disposal requires a privileged, auditable retention workflow and must not be introduced as a direct client delete.

Migrations must:
- preserve existing data;
- define rollback;
- run against non-production first;
- reconcile counts/identity;
- be documented.

## Documents

Do not add a psychological-document template solely because a form can be generated.

Verify the current official CFP basis, represent the required professional source process, version the template, and preserve issued artifacts immutably.

## Visual changes

Do not update visual baselines automatically.

If a visual gate fails:
1. inspect the actual screenshot;
2. determine whether the change is intended;
3. fix regressions;
4. only then update the reviewed baseline.

## Dependency changes

Check current stable documentation and breaking changes before upgrading.

Keep `package.json` and `package-lock.json` synchronized and retain `npm ci` compatibility.

## Pull request description

Summarize:
- previous state;
- problem;
- decision;
- implementation;
- migrations;
- tests;
- security/privacy impact;
- remaining risks;
- next phase.
