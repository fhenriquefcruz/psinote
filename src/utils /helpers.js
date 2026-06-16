// ============================================
// FUNÇÕES AUXILIARES PARA DATAS
// ============================================

export const parseDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  return null;
};
