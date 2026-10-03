# PsiNote — Domain and Product Audit

## Scope

This document translates current official professional and privacy requirements into product constraints for PsiNote. It is not legal advice and must be revalidated before each major release.

## Official references reviewed

- Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD).
- Resolução CFP nº 1/2009, as amended — documentary records arising from psychological services.
- Resolução CFP nº 6/2019 — written documents produced by psychologists in professional practice.
- Resolução CFP nº 9/2024 — professional practice of Psychology mediated by digital information and communication technologies.
- Current CFP/CRP guidance derived from those resolutions.

## Product implications

### 1. Record keeping is a core workflow, not an optional note feature

Professional records must support concise documentation of the service, evolution and procedures adopted.

Product consequence:
- session records and longitudinal evolution become first-class entities;
- status "realizado" in Agenda must surface a pending-record action until documentation is completed;
- records require author, timestamps and version history;
- a session cannot silently overwrite an earlier finalized record.

### 2. Prontuário and restricted professional notes must not be conflated

The product must distinguish information that belongs in the user's accessible record from material that may require restricted handling according to professional rules/context.

Product consequence:
- no generic "private note" switch is implemented until the exact professional purpose/access rule is modeled;
- the data model must support separate record classes with different sharing/export policies;
- the UI must explain which record category is being edited.

### 3. Retention is policy-driven

PsiNote must not infer that "delete" means immediate destruction.

Product consequence:
- archive, trash and legal/professional retention are separate states;
- permanent disposal is privileged, delayed and auditable;
- retention policy must be configurable by record/document class;
- destructive action requires eligibility checks, not only a confirmation modal.

### 4. Documents require purpose, recipient and stable historical version

Psychological documents are professional outputs, not generic PDFs.

Product consequence:
- templates are versioned;
- issued documents retain the original template/content version;
- metadata includes author, patient/client, purpose, recipient when applicable, creation/issuance date and document version;
- generated drafts are not treated as issued records until professional confirmation;
- document templates in the legacy app are considered provisional and require redesign before production reliance.

### 5. Digital/remote practice requires technology transparency and confidentiality

Current CFP rules for TDIC-mediated work require professional evaluation of the technology and attention to confidentiality/privacy.

Product consequence:
- modality belongs to appointment/session metadata;
- remote-work consent/contract metadata can be represented explicitly when applicable;
- PsiNote must not claim that using the software alone makes remote practice compliant;
- future video/calendar integrations require a processor/privacy review before implementation.

### 6. Sensitive data is not normal product analytics

Psychological and health-related data may be sensitive personal data under LGPD.

Product consequence:
- no clinical narrative in telemetry;
- no default external AI processing;
- no cross-tenant analytics;
- aggregate reports should prefer administrative counts;
- any semantic search over clinical text requires a separate architecture/privacy decision.

## Primary persona

Psychologist with multiple weekly appointments who needs to:
- see today's work immediately;
- register a session quickly;
- resume context without hunting through screens;
- understand longitudinal trajectory;
- manage documents safely;
- avoid administrative burden.

## Current product gaps

### Critical
- Sessions route is a placeholder.
- Dashboard is metric/chart-first instead of work-first.
- Patient profile is fragmented and not longitudinal.
- Document generator is string-template based and lacks issued-version architecture.
- Admin operations previously relied on browser authority.
- Search performs broad client-side reads.
- No consent/guardian model.
- No treatment-plan model.
- No formal closure/reactivation model.
- No server-side immutable audit system.

### High
- Agenda lacks day/week/month/list modes and recurrence.
- No explicit pending-record workflow after completed appointments.
- No reliable draft recovery UX for sessions.
- No global command palette.
- No structured accessibility test suite.
- Mobile behavior depends heavily on inline desktop grids.
- No error boundary or centralized domain error treatment.

## Target information architecture

### Hoje
- Hoje / Command Center
- Agenda

### Atendimento
- Pacientes
- Sessões

### Documentação
- Documentos
- Relatórios

### Gestão
- Configurações

### Administração
- Administração (authorized users only)

## Target patient lifecycle

1. Intake
2. Initial context/anamnesis
3. Objectives/plan
4. Appointments
5. Sessions
6. Professional records/evolution
7. Documents/consents
8. Reviews
9. Closure/archive
10. Reactivation when applicable

## Phase 1 implementation priorities

1. Work-oriented dashboard.
2. Explicit Sessions navigation.
3. Functional session workspace with autosave/draft state.
4. Longitudinal patient overview.
5. Shared design system foundations.
6. Mobile-first layout corrections.

The product should optimize continuity of professional work rather than maximize the number of visible metrics.
