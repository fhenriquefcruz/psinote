export const parseDateValue = (value) => {
  if (!value) return null;

  if (typeof value?.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const plainDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (plainDate) {
      const [, year, month, day] = plainDate;
      return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
    }
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
};

export const toDateInputValue = (value) => {
  const date = parseDateValue(value);
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return year + '-' + month + '-' + day;
};

export const formatDatePtBr = (value, fallback = 'Não informado') => {
  const date = parseDateValue(value);
  return date ? date.toLocaleDateString('pt-BR') : fallback;
};

export const startOfLocalDay = (value = new Date()) => {
  const date = parseDateValue(value) || new Date();
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfLocalDay = (value = new Date()) => {
  const date = parseDateValue(value) || new Date();
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};
