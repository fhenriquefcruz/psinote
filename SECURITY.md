# PsiNote Security

## Security objective

Protect psychological-service records against cross-account access, accidental publication, privilege escalation, data loss and unauthorized modification.

The browser is treated as an untrusted client.

## Phase 0 controls

- Firestore deny-by-default rules.
- Tenant isolation by authenticated `request.auth.uid` and record `psychologistId`.
- Ownership preservation on updates.
- Firebase custom claims for administrative authorization.
- User profile updates restricted to non-privileged fields.
- New document uploads use private Firebase Storage paths.
- Storage validates owner, MIME type and maximum file size.
- Service-layer ownership checks provide defense in depth.
- Client activity events are append-only.
- Audit payloads intentionally exclude clinical narrative.
- No hard-coded administrator e-mail.
- No new Supabase public document URL generation.

## Threat model

### High priority threats

1. **IDOR/BOLA** — user A reads/updates a patient, session, appointment or document owned by user B by changing an ID.
2. **Privilege escalation** — a regular account modifies its role/profile to become admin.
3. **Public file exposure** — a clinical attachment can be accessed through a long-lived public URL.
4. **Sensitive telemetry leakage** — names, clinical notes or documents reach logs/analytics.
5. **Destructive record loss** — browser actions permanently delete records without retention controls.
6. **Stored content injection** — user-authored text is rendered unsafely.
7. **Unsafe upload** — oversized or unexpected files are accepted.
8. **Session/account abuse** — expired/blocked users retain access.
9. **Supply-chain compromise** — dependencies or CI actions introduce malicious behavior.

## Authorization invariants

- A user can access a clinical record only when its tenant owner matches the authenticated UID, unless a future explicit delegated-access model authorizes otherwise.
- Ownership cannot be changed by a normal update.
- Role fields in Firestore are informational only.
- Admin UI visibility is not authorization.
- Privileged changes require a trusted server/Admin SDK.
- Document access must be authenticated and owner-scoped.

## Known remaining security work

Before merge/deployment:
- deploy and test Firestore/Storage rules in emulator/non-production;
- bootstrap administrator custom claim securely;
- inventory legacy Supabase public URLs;
- migrate historical documents to private storage;
- add rule-unit tests for IDOR/BOLA;
- add E2E auth/session-expiry tests;
- define CSP and security headers for the production hosting model;
- add dependency/SCA scanning;
- define incident response and restore exercises;
- move audit creation for high-value events to trusted backend.

## Logging rules

Do not log:
- patient/client names;
- clinical narrative;
- anamnesis;
- session notes;
- diagnoses/hypotheses;
- document contents;
- access tokens;
- raw uploaded files.

Use technical IDs and coarse operation metadata when troubleshooting.

## Security changes are not legal certification

Passing technical security gates does not certify regulatory compliance. Legal/ethical requirements depend on professional context and applicable rules.
