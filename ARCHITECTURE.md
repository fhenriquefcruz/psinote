# PsiNote Architecture

## Product boundary

PsiNote is a professional practice-management and longitudinal-record system for psychologists and other explicitly authorized professional contexts. It is not a diagnostic engine and not an autonomous clinical decision-maker.

Target journey:

Client/patient → intake → anamnesis/context → plan → schedule → session → professional record → longitudinal follow-up → documents → closure/archive.

## Current architecture

- Frontend: React + Vite SPA.
- Hosting: GitHub Pages.
- Identity: Firebase Authentication.
- Primary application database: Cloud Firestore.
- Legacy document storage: Supabase Storage.
- New Phase 0 document storage: Firebase Storage.
- Trusted backend: none in repository today.

## Phase 0 architecture decision

For immediate containment, Firebase is the security boundary because identity and most data already live there. New data paths must use Firebase Auth-aware rules rather than relying on browser conditionals.

This decision is intentionally scoped to containment. Phase 3 will produce an ADR comparing:
- Firebase predominant;
- Supabase/PostgreSQL predominant;
- consciously delimited hybrid.

The final choice must be based on authorization, tenant isolation, relational integrity, transactions, search, auditability, migrations, backup/restore, cost and operational complexity.

## Layering target

UI
→ application/use-cases
→ domain policy
→ repositories/services
→ Firebase or selected infrastructure

Clinical/business rules must not remain distributed across React components.

## Trust boundaries

The browser is untrusted.

The browser may:
- authenticate a user;
- request records allowed by security rules;
- submit user-authored data;
- render authorization state for UX.

The browser may not:
- grant roles;
- disable/enable accounts authoritatively;
- bypass ownership checks;
- write immutable audit events authoritatively;
- issue trusted document signatures;
- decide retention/purge eligibility by itself.

## Data ownership

Every professional-scoped record must carry an immutable owner/tenant key. In the current single-professional model this is `psychologistId`.

If organizations/clinics are introduced, an explicit `organizationId` and membership model will be added rather than overloading user IDs.

## Deployment principle

No direct production merge while a required quality or security gate is red.
