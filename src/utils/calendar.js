import { parseDateValue, toDateInputValue } from './date.js';

export const addDays = (value, amount) => {
  const date = parseDateValue(value) || new Date();
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

export const addMonths = (value, amount) => {
  const date = parseDateValue(value) || new Date();
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + amount);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();
  result.setDate(Math.min(originalDay, lastDay));
  return result;
};

export const startOfWeek = (value) => {
  const date = parseDateValue(value) || new Date();
  const result = new Date(date);
  const day = result.getDay();
  const distance = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + distance);
  result.setHours(12, 0, 0, 0);
  return result;
};

export const endOfWeek = (value) => addDays(startOfWeek(value), 6);

export const startOfMonth = (value) => {
  const date = parseDateValue(value) || new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
};

export const endOfMonth = (value) => {
  const date = parseDateValue(value) || new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0, 0);
};

export const dateKey = (value) => toDateInputValue(value);

export const isSameDay = (left, right) =>
  Boolean(dateKey(left) && dateKey(left) === dateKey(right));

export const monthGridDays = (value) => {
  const first = startOfWeek(startOfMonth(value));
  const last = endOfWeek(endOfMonth(value));
  const days = [];

  for (
    let cursor = new Date(first);
    cursor <= last;
    cursor = addDays(cursor, 1)
  ) {
    days.push(new Date(cursor));
  }

  return days;
};

export const agendaRange = (view, cursor) => {
  if (view === 'day') {
    const key = dateKey(cursor);
    return { start: key, end: key };
  }

  if (view === 'week') {
    return {
      start: dateKey(startOfWeek(cursor)),
      end: dateKey(endOfWeek(cursor))
    };
  }

  if (view === 'month') {
    const days = monthGridDays(cursor);
    return {
      start: dateKey(days[0]),
      end: dateKey(days[days.length - 1])
    };
  }

  return {
    start: dateKey(addDays(cursor, -30)),
    end: dateKey(addDays(cursor, 180))
  };
};

export const moveAgendaCursor = (view, cursor, direction) => {
  if (view === 'day') return addDays(cursor, direction);
  if (view === 'week') return addDays(cursor, direction * 7);
  if (view === 'month') return addMonths(cursor, direction);
  return addMonths(cursor, direction);
};

export const formatAgendaRange = (view, cursor) => {
  const date = parseDateValue(cursor) || new Date();

  if (view === 'day') {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  if (view === 'week') {
    const start = startOfWeek(date);
    const end = endOfWeek(date);
    return (
      start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
      ' – ' +
      end.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    );
  }

  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });
};
