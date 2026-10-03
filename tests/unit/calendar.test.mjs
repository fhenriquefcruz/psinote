import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  addMonths,
  agendaRange,
  dateKey,
  endOfWeek,
  monthGridDays,
  moveAgendaCursor,
  startOfWeek
} from '../../src/utils/calendar.js';

describe('calendar ranges', () => {
  test('week starts on Monday and ends on Sunday', () => {
    const wednesday = new Date(2026, 9, 7, 12);
    assert.equal(dateKey(startOfWeek(wednesday)), '2026-10-05');
    assert.equal(dateKey(endOfWeek(wednesday)), '2026-10-11');

    const sunday = new Date(2026, 9, 11, 12);
    assert.equal(dateKey(startOfWeek(sunday)), '2026-10-05');
  });

  test('month grid includes complete Monday-to-Sunday weeks', () => {
    const days = monthGridDays(new Date(2026, 9, 15, 12));

    assert.equal(days[0].getDay(), 1);
    assert.equal(days[days.length - 1].getDay(), 0);
    assert.equal(dateKey(days[0]), '2026-09-28');
    assert.equal(dateKey(days[days.length - 1]), '2026-11-01');
    assert.equal(days.length, 35);
  });

  test('agenda range matches each view', () => {
    const cursor = new Date(2026, 9, 7, 12);

    assert.deepEqual(agendaRange('day', cursor), {
      start: '2026-10-07',
      end: '2026-10-07'
    });

    assert.deepEqual(agendaRange('week', cursor), {
      start: '2026-10-05',
      end: '2026-10-11'
    });

    assert.deepEqual(agendaRange('month', cursor), {
      start: '2026-09-28',
      end: '2026-11-01'
    });

    assert.deepEqual(agendaRange('list', cursor), {
      start: '2026-09-07',
      end: '2027-04-05'
    });
  });

  test('month movement clamps long dates instead of skipping a month', () => {
    const january31 = new Date(2026, 0, 31, 12);
    assert.equal(dateKey(addMonths(january31, 1)), '2026-02-28');
    assert.equal(
      dateKey(moveAgendaCursor('month', january31, 1)),
      '2026-02-28'
    );
  });
});
