import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  buildRecurringDateKeys,
  canRescheduleAppointment,
  isAppointmentTerminal,
  normalizeAppointmentRecurrence
} from '../../src/domain/appointments.js';

describe('appointment recurrence domain', () => {
  test('non-recurring appointment keeps the original date', () => {
    assert.deepEqual(
      buildRecurringDateKeys('2026-10-03', { kind: 'none', occurrences: 1 }),
      ['2026-10-03']
    );
  });

  test('weekly recurrence advances seven days', () => {
    assert.deepEqual(
      buildRecurringDateKeys('2026-10-03', {
        kind: 'weekly',
        occurrences: 4
      }),
      ['2026-10-03', '2026-10-10', '2026-10-17', '2026-10-24']
    );
  });

  test('biweekly recurrence advances fourteen days', () => {
    assert.deepEqual(
      buildRecurringDateKeys('2026-10-03', {
        kind: 'biweekly',
        occurrences: 3
      }),
      ['2026-10-03', '2026-10-17', '2026-10-31']
    );
  });

  test('monthly recurrence clamps to the last valid day of the target month', () => {
    assert.deepEqual(
      buildRecurringDateKeys('2026-01-31', {
        kind: 'monthly',
        occurrences: 3
      }),
      ['2026-01-31', '2026-02-28', '2026-03-31']
    );

    assert.deepEqual(
      buildRecurringDateKeys('2028-01-31', {
        kind: 'monthly',
        occurrences: 2
      }),
      ['2028-01-31', '2028-02-29']
    );
  });

  test('invalid recurrence kind and occurrence count are rejected', () => {
    assert.throws(
      () => normalizeAppointmentRecurrence({ kind: 'daily', occurrences: 3 }),
      /Recorrência inválida/
    );
    assert.throws(
      () => normalizeAppointmentRecurrence({ kind: 'weekly', occurrences: 1 }),
      /entre 2 e 52/
    );
    assert.throws(
      () => normalizeAppointmentRecurrence({ kind: 'weekly', occurrences: 53 }),
      /entre 2 e 52/
    );
  });
});

describe('appointment lifecycle domain', () => {
  test('only appropriate source states can be rescheduled', () => {
    assert.equal(canRescheduleAppointment('scheduled'), true);
    assert.equal(canRescheduleAppointment('confirmed'), true);
    assert.equal(canRescheduleAppointment('canceled'), true);
    assert.equal(canRescheduleAppointment('missed'), true);
    assert.equal(canRescheduleAppointment('done'), false);
    assert.equal(canRescheduleAppointment('rescheduled'), false);
  });

  test('terminal states are recognized consistently', () => {
    for (const status of ['done', 'canceled', 'rescheduled', 'missed']) {
      assert.equal(isAppointmentTerminal(status), true);
    }

    assert.equal(isAppointmentTerminal('scheduled'), false);
    assert.equal(isAppointmentTerminal('confirmed'), false);
  });
});
