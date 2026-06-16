// Função segura para converter qualquer formato de data para Date
export const parseDate = (value) => {
  if (!value) return null;
  
  // Se for Timestamp do Firestore
  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }
  
  // Se for string ISO ou timestamp numérico
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Se já for objeto Date
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  
  return null;
};

// Função segura para formatar data
export const formatDateSafe = (value, locale = 'pt-BR', options = {}) => {
  const date = parseDate(value);
  if (!date) return 'Não informado';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  });
};

// Função segura para formatar data e hora
export const formatDateTimeSafe = (value, locale = 'pt-BR') => {
  const date = parseDate(value);
  if (!date) return 'Não informado';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
