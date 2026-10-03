# Appointment Date Migration

## Purpose

The professional agenda uses a canonical local date key in the form `YYYY-MM-DD` for appointment calendar queries.

Legacy PsiNote data may contain mixed appointment date representations, including Firestore Timestamp/Date-like values created before the agenda modernization.

Mixed types are unsafe for range queries because Firestore comparison is type-aware. A string range will not reliably include legacy Timestamp values.

## Target representation

Appointments use:

- `date`: local calendar key `YYYY-MM-DD`;
- `time`: local wall-clock time `HH:mm`;
- `duration`: minutes;
- `modality`: `in_person | online | other`.

The calendar date is intentionally separate from time so routine professional scheduling is stable across browser timezone serialization.

## Migration strategy

Run only from a trusted Firebase Admin environment.

For every appointment:

1. read the current `date` field;
2. if already a valid `YYYY-MM-DD` string, leave it unchanged;
3. if Timestamp/Date-like, derive the intended local calendar day from the original record context;
4. write the normalized string while preserving all lifecycle metadata;
5. record migration telemetry using technical IDs only;
6. reconcile total counts by professional/tenant;
7. sample-check agenda chronology before declaring migration complete.

## Important limitation

A Timestamp does not always encode the original user's intended timezone. If historical records were written at midnight UTC or with inconsistent timezone handling, automated conversion can shift the calendar day.

Therefore the migration must first inspect real legacy date patterns in a non-production copy before choosing the conversion rule.

## Rollback

Take a verified export before migration.

The migration must preserve the pre-migration date value in the backup/export rather than adding duplicate sensitive fields to the production document.

## Production gate

Before switching production fully to bounded period queries:

- inventory legacy date field types;
- run migration against a non-production copy;
- compare appointment counts and sampled dates;
- verify week/month/day views;
- test restore from the pre-migration export.
