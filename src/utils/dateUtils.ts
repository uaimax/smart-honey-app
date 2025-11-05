/**
 * Utilitários para manipulação de datas
 */

/**
 * Garante que o valor retornado é sempre um Date válido
 * Se o valor for inválido, retorna hoje
 */
export const ensureValidDate = (value: any): Date => {
  if (!value) {
    return new Date(); // Hoje
  }

  const date = new Date(value);

  // Verificar se é uma data válida
  if (isNaN(date.getTime())) {
    console.warn('⚠️ Data inválida recebida:', value, '- usando hoje');
    return new Date(); // Hoje
  }

  return date;
};

/**
 * Converte data para o início do dia (00:00:00)
 */
export const startOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Converte data para o fim do dia (23:59:59)
 */
export const endOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

/**
 * Retorna a data de ontem
 */
export const yesterday = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
};

/**
 * Retorna a data de amanhã
 */
export const tomorrow = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
};

/**
 * Verifica se a data é hoje
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Verifica se a data foi ontem
 */
export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Formata data de forma amigável (ex: "Hoje", "Ontem", "15/11")
 */
export const formatFriendlyDate = (date: Date): string => {
  const validDate = ensureValidDate(date);

  if (isToday(validDate)) {
    return 'Hoje';
  }

  if (isYesterday(validDate)) {
    return 'Ontem';
  }

  return validDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
};

/**
 * Formata data e hora completa
 */
export const formatDateTime = (date: Date): string => {
  const validDate = ensureValidDate(date);

  return validDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formata apenas a hora
 */
export const formatTime = (date: Date): string => {
  const validDate = ensureValidDate(date);

  return validDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Parse de expressões temporais relativas
 * Ex: "ontem", "hoje", "amanhã"
 */
export const parseRelativeDate = (text: string): Date | null => {
  const lowerText = text.toLowerCase().trim();

  if (lowerText.includes('ontem')) {
    return yesterday();
  }

  if (lowerText.includes('hoje')) {
    return new Date();
  }

  if (lowerText.includes('amanhã') || lowerText.includes('amanha')) {
    return tomorrow();
  }

  // Tentar parsear formato "DD/MM" ou "DD/MM/YYYY"
  const datePattern = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/;
  const match = text.match(datePattern);

  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JavaScript months são 0-indexed
    let year = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();

    // Se ano tem 2 dígitos, assumir 20XX
    if (year < 100) {
      year += 2000;
    }

    const parsedDate = new Date(year, month, day);

    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return null; // Não conseguiu parsear
};

/**
 * Retorna o mês atual no formato YYYY-MM
 */
export const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Formata mês por extenso
 */
export const formatMonthName = (date: Date = new Date()): string => {
  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
};

