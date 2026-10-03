# Phase 4 — Professional Agenda

## ESTADO ANTERIOR

The Agenda was a single long list with inline styles, no day/week/month calendar model, no recurrence and destructive rescheduling that overwrote the original date/time.

## PROBLEMA

The agenda did not represent the professional's daily operating surface and lost history when an appointment was rescheduled.

## DECISÃO

Build scheduling around explicit calendar views and preserve the history of appointments.

Status model:
- scheduled
- confirmed
- done
- canceled
- rescheduled
- missed

Rescheduling never rewrites the original appointment. A new appointment is created and both records are linked.

## IMPLEMENTAÇÃO

- day, week, month and list views;
- previous/next/today navigation;
- bounded date-range loading for agenda views;
- status and patient filters;
- responsive appointment cards instead of desktop-only tables;
- mobile bottom-sheet dialogs;
- duration and modality;
- finite recurring series (weekly, biweekly, monthly);
- recurring series identifiers and occurrence position;
- explicit cancel reason;
- history-preserving reschedule links;
- completed appointment -> session record action;
- pending-record visual state;
- pure appointment domain module;
- unit-tested recurrence/calendar logic;
- Firestore lifecycle enforcement.

## SEGURANÇA

Firestore Rules enforce:
- owner-scoped creation/read/update;
- patient and creation metadata immutability;
- appointment date and recurrence immutability after creation;
- valid state transitions;
- terminal-state protections;
- session linkage only after a completed appointment;
- linked session must be finalized, same professional and same patient;
- browser hard delete remains denied.

## MIGRAÇÕES

No destructive migration was executed.

Legacy mixed date types require the controlled migration described in `docs/MIGRATION_APPOINTMENT_DATES.md`.

## TESTES

Domain unit tests cover:
- weekly/biweekly/monthly recurrence;
- leap-year and month-end clamping;
- recurrence bounds;
- reschedule eligibility;
- terminal states;
- calendar week/month boundaries;
- agenda query ranges.

Firebase Rules tests cover:
- recurring appointment creation;
- forged terminal creation;
- cross-tenant creation;
- immutable date/recurrence;
- terminal state reopening denial;
- finalized same-patient session linkage;
- rejection of draft/wrong-patient session links;
- canceled/missed reschedule-only mutation.

## RISCOS RESTANTES

- legacy date type migration must be validated before relying exclusively on range queries in production;
- external calendar synchronization is intentionally not implemented;
- recurrence edits/cancel-entire-series require a future explicit series workflow;
- timezone policy for external integrations still needs an ADR.

## PRÓXIMA FASE

Rebuild Documents around versioned templates, draft/issued lifecycle and immutable issued versions.
