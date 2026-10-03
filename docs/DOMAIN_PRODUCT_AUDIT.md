# PsiNote — Domain and Product Audit

Date: 2026-10-03
Status: Phase 1 baseline
Primary persona: psychologist managing a recurring weekly caseload.

## Official sources reviewed

The product direction is grounded in current official material, not blogs:

- Conselho Federal de Psicologia — Manual Orientativo de Registro e Elaboração de Documentos Psicológicos, 2025:
  https://site.cfp.org.br/publicacao/manual-orientativo-de-registro-e-elaboracao-de-documentos-psicologicos/
- Conselho Federal de Psicologia — Resolução CFP nº 06/2019 and official explanatory material:
  https://site.cfp.org.br/publicada-nova-resolucao-sobre-elaboracao-de-documentos-escritos/
- Lei nº 13.709/2018 — LGPD:
  https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm

Normative interpretation can depend on professional context. Product behavior must therefore expose the underlying premise instead of pretending that one workflow is universally mandatory.

## What the professional record actually needs to support

The CFP manual treats psychological records as a longitudinal account of the work performed, not as a collection of disconnected forms. It identifies a minimum common structure centered on:

1. identification of the person/institution;
2. evaluation of the demand and definition of work objectives;
3. evolution of the work and technical-scientific procedures used;
4. referrals or closure.

This directly changes the PsiNote information architecture.

The system should not make the therapist fill a rigid medical-style form every session. It should support a concise, high-quality narrative record and optional structured metadata.

## Prontuário versus registro documental

The product must represent this distinction explicitly.

Default for ordinary health/assistance workflows:
- prontuário as the prioritized longitudinal record;
- accessible/exportable according to applicable rights and professional process;
- contains the information necessary for continuity and quality of care.

Restricted record mode:
- used only when the professional context justifies restricted sharing;
- clearly separated from the ordinary patient-facing record;
- never silently mixed into documents generated for third parties.

The current PsiNote has no such separation. Session notes, anamnesis and generated reports are treated as interchangeable data sources. That is unsafe conceptually.

## Product journey

The target journey becomes:

Client/patient
→ entry/intake
→ demand and objectives
→ initial context/anamnesis when useful
→ follow-up plan
→ appointments
→ sessions
→ professional record/evolution
→ longitudinal timeline
→ documents
→ referrals/closure
→ archive/retention

Each stage must remain flexible. A professional can skip optional parts when they are not pertinent.

## Patient profile target

The individual workspace is the product's longitudinal hub.

### Overview
- status;
- last and next appointment;
- follow-up start;
- current objectives;
- open operational pendencies;
- recent activity.

### Identification and administrative data
Only what is necessary for the service. Avoid collecting demographic or health fields by default merely because they might be useful someday.

### Demand and intake
- initial demand;
- requester/source when applicable;
- objectives;
- relevant context;
- optional flexible anamnesis sections.

### Follow-up plan
- objectives;
- focus areas;
- strategies;
- review dates;
- active/closed items.

### Professional record
- chronological evolution notes;
- procedure/intervention metadata only when pertinent;
- referrals and decisions;
- closure entry.

### Restricted materials
Separated workspace with stronger explanation and access controls.

### Documents
Issued documents, uploaded files, versions and delivery history.

### Consents/acknowledgements
When required by context.

### Timeline
A unified chronology of major events without exposing complete sensitive narrative in the timeline itself.

## Session workspace target

The session workspace should optimize continuity of work.

Context shown before writing:
- person;
- session date/number;
- previous session summary;
- current objectives;
- prior agreements/next steps;
- recent relevant events.

Writing area:
- free narrative as the primary interaction;
- optional structured fields for main theme, procedures/interventions, referrals, agreements, next steps and tags;
- autosave;
- recovery;
- saved-state indicator;
- version history;
- explicit finalize action.

The system must not imply that every optional field is mandatory.

## Document architecture

Current string replacement templates are not sufficient.

The target distinguishes:

### Psychological documents governed by the professional-document framework
- declaration;
- psychological certificate/attestation;
- psychological report;
- multiprofessional report when applicable;
- psychological report/laudo;
- psychological opinion/parecer.

### Supporting/administrative artifacts
- service agreement;
- acknowledgement/consent terms;
- referral form;
- document request;
- document delivery receipt;
- attachments from other professionals/services.

Supporting artifacts must not be mislabeled as if they were document modalities defined by CFP Resolution 06/2019.

Every issued document must retain:
- document type;
- requester;
- purpose;
- recipient/destination;
- patient/person linkage;
- author snapshot;
- CRP snapshot;
- template version;
- content version;
- issue timestamp;
- file hash;
- delivery metadata;
- immutable historical file.

A template update must never rewrite an already issued document.

## Retention and disposal

The product must not implement a universal 30-day trash purge.

Retention policy must be configurable by record class and context. The system should support:
- minimum retention date;
- extended retention reason;
- legal/professional hold;
- responsible custodian;
- eligible-for-disposal state;
- privileged final disposal;
- disposal audit evidence.

Archive/closure and physical deletion are separate concepts.

## Dashboard target

The dashboard is a work command center, not a statistics wall.

Priority blocks:
- now/next appointment;
- today's schedule;
- unfinished session records;
- documents requiring review/delivery;
- follow-up items due;
- recently updated patients;
- operational alerts.

Secondary analytics:
- appointments by period;
- attendance/cancellation;
- active follow-ups;
- new/closed follow-ups;
- schedule utilization.

No clinical aggregate should exist merely because a chart library is available.

## Search target

Global command/search must search only authorized tenant data and avoid loading full collections to the browser.

First-class commands:
- new patient;
- new appointment;
- new session;
- issue document;
- open recent patient;
- navigate to page.

Clinical free-text search will require a deliberate privacy/indexing architecture and will not be introduced by naïvely copying narrative into a third-party search service.

## AI product boundary

The 2025 CFP manual explicitly allows support uses such as organization, clarity and structuring while preserving the professional's responsibility and excluding substitution of professional judgment.

Therefore:
- AI suggestions are visually separate from the professional record;
- no diagnosis;
- no autonomous clinical conclusion;
- no silent write;
- no external sensitive-data transfer by default;
- explicit professional approval before inclusion in an official record;
- complete data-flow and provider review before enabling any sensitive feature.

Phase 15 remains disabled until the privacy architecture can satisfy these conditions.

## Product principles

1. Longitudinal continuity over isolated forms.
2. Freedom to write over forced checklists.
3. Minimum necessary data over maximal collection.
4. Professional review over automated legal-compliance claims.
5. Secure defaults over convenience shortcuts.
6. Operational clarity over decorative metrics.
7. Reversible workflow actions over accidental destructive actions.
8. Accessibility as product architecture, not cosmetic remediation.
