# PsiNote Data Model

## Current canonical ownership

Until the organization/clinic model is introduced, `psychologistId` is the tenant key for clinical and operational records.

## Current collections

### users
Account/profile metadata. Role values stored here do not grant authorization.

### patients
Professional-owned client/patient profile and intake information.

Required security metadata:
- psychologistId
- createdAt
- updatedAt
- createdBy
- updatedBy
- status

### appointments
Scheduling records owned by a professional.

### sessions
Current session workspace / latest clinical record state owned by a professional.

Key integrity fields:
- psychologistId
- patientId
- version
- revision
- status
- createdAt / updatedAt
- createdBy / updatedBy

`version` advances only on a formal save/lifecycle transition. `revision` advances on every persisted edit, including autosave.

New sessions no longer append clinical history into the parent document.

### session_versions
Immutable historical state for a session.

Each record contains:
- psychologistId
- patientId
- sessionId
- version
- revision
- reason
- snapshot
- createdAt
- createdBy

Security Rules validate that the version snapshot corresponds to the actual owned parent session state at the moment it is superseded. Browser clients may append a valid version but cannot update or delete one.

Legacy `sessions.previousVersions` remains readable during migration and is immutable.

### document_drafts
Editable document-authoring state owned by a professional.

Key fields:
- psychologistId
- patientId
- patientName
- templateId / templateVersion
- templateType / templateFamily
- values
- status: draft | issued
- familyId
- issueVersion
- supersedesDocumentId
- issuedDocumentId / issuedAt
- createdAt / updatedAt
- createdBy / updatedBy

Drafts are editable only while status is `draft`. The transition to `issued` must be paired, in the same Firestore batch, with creation of the immutable issued document record.

### documents
Immutable metadata for stored files and issued document artifacts.

Common metadata:
- psychologistId
- patientId (nullable)
- name
- category
- kind: attachment | generated
- status: stored | issued
- storageProvider / storagePath
- fileType / fileSize / sha256
- version
- familyId
- createdAt / uploadedAt / updatedAt
- createdBy / uploadedBy / updatedBy

Generated issued documents additionally store:
- templateId / templateVersion / templateType
- draftId
- supersedesDocumentId
- issuedAt / issuedBy

Every generated issue is a new immutable record. Revision is modeled as a new draft/new issue within the same `familyId`, rather than mutating a previously issued artifact.

System templates are versioned in code under `src/domain/documentTemplates.js`. Future user/organization-authored templates will require a separately secured template registry.

A permanent public URL is not target-state metadata.

### search_entries
Derived, non-authoritative metadata used by the global command/search palette.

Allowed source types:
- patient
- session
- document
- draft

The index intentionally contains only navigation metadata such as title, status, date/session number, document kind/template/version and source IDs. It must not contain clinical narrative, anamnesis, session evolution, observations, interventions, referrals, agreements, next steps or tags.

Security Rules validate each index entry against its source record. Search never grants source access; selecting a result still resolves the original tenant-protected entity.

Key fields:
- psychologistId
- entityType / entityId
- patientId
- title
- status
- searchable
- date / sessionNumber
- kind / templateId / templateVersion / version
- createdAt / updatedAt

### activities
Low-sensitivity operational activity feed. This is not a substitute for an immutable compliance audit log.

## Planned model

The domain model should introduce entities only when their workflow is implemented:

- professional_profiles
- organizations
- organization_memberships
- guardians
- treatment_plans
- clinical_records
- custom_document_templates
- attachments
- consents
- audit_events
- settings
- notifications
- tags

## Modeling rules

- use explicit ownership/tenant fields;
- do not duplicate sensitive narrative into audit/log collections;
- preserve historical issued-document versions;
- prefer soft lifecycle states for clinical records until retention policy authorizes disposal;
- immutable versions must reference their parent record and author;
- formal clinical history must not be silently overwritten; finalized state requires explicit re-opening before editing;
- timestamps should use server-generated time for persisted events;
- relationships involving guardians, organizations and delegated access require explicit authorization semantics.
