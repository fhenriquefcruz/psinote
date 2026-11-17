# PsiNote Security

## Security objective

Protect psychological-service records against cross-account access, accidental publication, privilege escalation, data loss and unauthorized modification.

The browser is treated as an untrusted client.

## Security controls

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
- Browser hard delete denied for clinical records and private files.
- Patient linkage and creation metadata are immutable through normal browser updates.
- Firebase Emulator Suite authorization tests are required in CI.
- Dependency audit blocks moderate/high/critical known vulnerabilities.
- Legacy Supabase Storage SDK has been removed from the browser bundle.

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

## Phase 9 — active accounts and private file boundary

- Administrative inspection of other account profiles requires a Firebase custom claim **and** an active Firestore user profile.
- Storage authorization now checks the same profile's existence/blocked state via Firestore. This cross-service rules dependency requires Firebase-managed IAM activation in the actual Firebase project and staging proof before production.
- The app never opens historical `fileURL` public links as a fallback for private documents. The old public objects may still be exposed at the original provider and must be audited, migrated and revoked.
- New Storage object keys are opaque and exclude patient IDs and original filenames. Existing object paths remain readable if owner-scoped and valid.
- A claim update is reflected on Firebase token refresh; immediate administrative revocation remains a trusted-backend operational responsibility.

Detailed audit, residual risks and evidence: `docs/PHASE_9_PRIVACY_SECURITY.md`.

## Known remaining security work

Before production completion:
- bootstrap administrator custom claim securely;
- deploy validated Firestore/Storage rules to a non-production Firebase environment before production;
- inventory legacy Supabase public URLs;
- migrate historical documents to private storage and revoke legacy public access;
- add E2E auth/session-expiry tests;
- define CSP and security headers for the production hosting model;
- define incident response and restore exercises;
- move audit creation for high-value events to trusted backend;
- implement privileged retention/disposal workflow rather than browser deletion.

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

Use only coarse, allowlisted technical categories, generic route keys and random incident references. Never include tenant IDs or record IDs in diagnostics.

## Phase 8 diagnostics and continuity status

The client uses an in-memory, 20-event bounded diagnostics buffer. Only allowlisted categories, error names/codes, generic routes and build IDs are retained. Raw error messages, stacks, URLs, identifiers and clinical text are excluded from our diagnostic event schema. There is **no configured remote collector** in the browser implementation.

Operational backup/export, independent restore drills, incident ownership and production hosting security headers remain outstanding. See `docs/PHASE_8_PRODUCTION_READINESS.md`, `docs/OPERATIONS_RUNBOOK.md` and `docs/INCIDENT_RESPONSE.md`.

## Security changes are not legal certification

Passing technical security gates does not certify regulatory compliance. Legal/ethical requirements depend on professional context and applicable rules.
