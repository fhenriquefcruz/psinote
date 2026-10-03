export const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'done',
  'canceled',
  'rescheduled',
  'missed'
];

export const APPOINTMENT_MODALITIES = [
  'in_person',
  'online',
  'other'
];

const parseDateKey = (dateValue) => {
  const match = String(dateValue || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error('Data de agendamento inválida.');

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

const addMonthsClamped = (date, months) => {
  const originalDay = date.getDate();
  const target = new Date(date);
  target.setDate(1);
  target.setMonth(target.getMonth() + months);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();
  target.setDate(Math.min(originalDay, lastDay));
  return target;
};

export const normalizeAppointmentRecurrence = (recurrence) => {
  if (!recurrence || recurrence.kind === 'none') {
    return { kind: 'none', occurrences: 1 };
  }

  if (!['weekly', 'biweekly', 'monthly'].includes(recurrence.kind)) {
    throw new Error('Recorrência inválida.');
  }

  const occurrences = Number(recurrence.occurrences || 1);
  if (!Number.isInteger(occurrences) || occurrences < 2 || occurrences > 52) {
    throw new Error('A recorrência deve ter entre 2 e 52 ocorrências.');
  }

  return { kind: recurrence.kind, occurrences };
};

export const buildRecurringDateKeys = (startDate, recurrence) => {
  const normalized = normalizeAppointmentRecurrence(recurrence);

  return Array.from({ length: normalized.occurrences }, (_, index) => {
    const date = parseDateKey(startDate);

    if (normalized.kind === 'weekly') {
      date.setDate(date.getDate() + index * 7);
    } else if (normalized.kind === 'biweekly') {
      date.setDate(date.getDate() + index * 14);
    } else if (normalized.kind === 'monthly') {
      return toDateKey(addMonthsClamped(date, index));
    }

    return toDateKey(date);
  });
};

export const canRescheduleAppointment = (status) =>
  ['scheduled', 'confirmed', 'canceled', 'missed'].includes(status);

export const isAppointmentTerminal = (status) =>
  ['done', 'canceled', 'rescheduled', 'missed'].includes(status);
