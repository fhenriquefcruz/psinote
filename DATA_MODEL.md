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
Session workspace/record metadata owned by a professional.

Current version history is embedded and capped. This is transitional; formal clinical record versioning should move to immutable version records.

### documents
Document metadata.

Target metadata:
- psychologistId
- patientId (nullable)
- name
- category
- storageProvider
- storagePath
- fileType
- fileSize
- sha256
- version
- createdAt / updatedAt
- createdBy / updatedBy

A permanent public URL is not target-state metadata.

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
- clinical_record_versions
- document_templates
- document_versions
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
- timestamps should use server-generated time for persisted events;
- relationships involving guardians, organizations and delegated access require explicit authorization semantics.
