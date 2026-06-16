// ============================================
// FUNÇÕES AUXILIARES PARA DATAS
// ============================================

/**
 * Converte qualquer formato de data para objeto Date de forma segura
 * @param {any} value - Timestamp, string ISO, número ou Date
 * @returns {Date|null} - Objeto Date ou null se inválido
 */
export const parseDate = (value) => {
  if (!value) return null;

  // Se for Timestamp do Firestore (tem método toDate)
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

/**
 * Formata data para exibição (apenas data)
 * @param {any} value - Data em qualquer formato
 * @param {string} locale - Localidade (padrão: 'pt-BR')
 * @param {object} options - Opções adicionais do toLocaleDateString
 * @returns {string} - Data formatada ou 'Não informado'
 */
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

/**
 * Formata data e hora para exibição
 * @param {any} value - Data em qualquer formato
 * @param {string} locale - Localidade (padrão: 'pt-BR')
 * @returns {string} - Data e hora formatadas ou 'Não informado'
 */
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

/**
 * Converte data para string ISO (YYYY-MM-DD)
 * @param {any} value - Data em qualquer formato
 * @returns {string} - Data no formato YYYY-MM-DD ou string vazia
 */
export const toISOStringSafe = (value) => {
  const date = parseDate(value);
  if (!date) return '';
  return date.toISOString().slice(0, 10);
};
