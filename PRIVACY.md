# PsiNote Privacy

## Privacy posture

PsiNote processes information that may include health data and other sensitive personal data. Privacy is therefore an architectural constraint rather than an optional feature.

## Governing references

Implementation decisions must be re-checked against current official sources before release, including:

- Lei nº 13.709/2018 (LGPD), especially principles, sensitive personal data, security and data-subject rights;
- Resolução CFP nº 1/2009, as amended, regarding psychological service records;
- Resolução CFP nº 6/2019 regarding written psychological documents;
- Resolução CFP nº 9/2024 regarding professional practice mediated by digital information and communication technologies;
- Code of Ethics and any later CFP/CRP rules applicable to the professional context.

This document is engineering guidance, not legal advice.

## Data minimization

Collect a field only when it supports a defined professional, administrative, legal or safety workflow.

Optional demographic/clinical fields must not become mandatory merely because the database supports them.

Technical logs must not contain clinical narrative.

## Purpose limitation

Clinical records, scheduling, documents, administrative metadata and product telemetry have different purposes and should remain logically separated.

Data collected for care organization must not automatically become analytics or AI training data.

## Retention

The application must not promise automatic deletion without a validated retention policy and a tested deletion mechanism.

CFP guidance requires a minimum retention period for psychological-service records in relevant contexts and allows longer retention when required by law, judicial determination or specific circumstances.

Therefore:
- trash/archive is reversible;
- permanent disposal is a privileged workflow;
- retention class, legal/professional rationale and disposal event must be auditable;
- document type and context may require different retention behavior.

## Data-subject access and export

The architecture must support controlled access/export workflows without exposing another professional's tenant.

Exports must be generated on demand, scoped and audited.

## Children, adolescents and guardians

Guardian/representative relationships must be modeled explicitly when relevant. Access rights must not be inferred from a generic emergency-contact field.

## External processors

No provider may receive sensitive data merely because it is convenient.

Before introducing analytics, AI, e-mail, messaging, search or observability processors, document:
- purpose;
- data categories;
- necessity/minimization;
- legal basis assumption requiring professional/legal validation;
- geography/international transfer;
- retention;
- security controls;
- contractual role.

## AI

Sensitive data must not be sent to an external model by default.

AI-generated content is suggestion only and requires explicit professional review before becoming part of an official record.

## Legacy Supabase documents

Historical public document URLs are a privacy migration risk.

The migration plan must:
1. inventory metadata and object paths;
2. verify ownership;
3. copy to private storage;
4. verify hash/size;
5. update metadata;
6. verify authenticated access;
7. remove public legacy access only after successful verification;
8. retain a migration audit event without copying clinical content into logs.
