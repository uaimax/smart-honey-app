// Parsers para texto inteligente do Smart Honey
import { parseRelativeDate } from './dateUtils';

/**
 * Detecta valor monetário no texto
 * Formatos aceitos: R$ 22,50 | 22.50 | 18,90
 */
export const parseAmount = (text: string): number | null => {
  if (!text) return null;

  // Remove espaços e converte para minúsculas
  const cleaned = text.trim().toLowerCase();

  // Regex para valores: R$ 22,50 ou 22.50 ou 18,90
  const patterns = [
    /r\$\s*(\d+)[.,](\d{2})/,  // R$ 22,50 ou R$22.50
    /(\d+)[.,](\d{2})/,         // 22,50 ou 22.50
    /(\d+)/,                     // 22 (sem centavos)
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      if (match[2]) {
        // Tem centavos
        return parseFloat(`${match[1]}.${match[2]}`);
      } else {
        // Só reais
        return parseFloat(match[1]);
      }
    }
  }

  return null;
};

/**
 * Detecta cartão no texto baseado em apelidos
 */
export const parseCard = (text: string, availableCards: Array<{ id: string; name: string; owner: string }>): string | null => {
  if (!text || !availableCards) return null;

  const cleaned = text.trim().toLowerCase();

  // Buscar por nome do cartão ou owner
  for (const card of availableCards) {
    const cardName = card.name.toLowerCase();
    const owner = card.owner.toLowerCase();
    const combined = `${cardName} ${owner}`.toLowerCase();

    if (
      cleaned.includes(cardName) ||
      cleaned.includes(owner) ||
      cleaned.includes(combined)
    ) {
      return card.id;
    }
  }

  // Buscar por apelidos comuns
  const aliases: Record<string, string[]> = {
    'c6': ['c6', 'c 6', 'c-6'],
    'nubank': ['nubank', 'nu', 'roxo'],
    'itau': ['itau', 'itaú', 'laranja'],
    'bruna': ['bruna'],
    'max': ['max', 'maxwell'],
    'uz': ['uz'],
  };

  for (const [key, variations] of Object.entries(aliases)) {
    if (variations.some(alias => cleaned.includes(alias))) {
      // Encontrar cartão que corresponde ao alias
      const card = availableCards.find(c =>
        c.name.toLowerCase().includes(key) ||
        c.owner.toLowerCase().includes(key)
      );
      if (card) {
        return card.id;
      }
    }
  }

  return null;
};

/**
 * Detecta responsável no texto
 */
export const parseUser = (text: string, availableUsers: Array<{ id: string; name: string }>): string | null => {
  if (!text || !availableUsers) return null;

  const cleaned = text.trim().toLowerCase();

  // Buscar por nome do usuário
  for (const user of availableUsers) {
    const userName = user.name.toLowerCase();
    if (cleaned.includes(userName)) {
      return user.id;
    }
  }

  return null;
};

/**
 * Detecta data no texto (ontem, hoje, amanhã, DD/MM)
 * Retorna hoje por padrão se não encontrar
 */
export const parseDate = (text: string): Date => {
  if (!text) return new Date();

  const cleaned = text.trim().toLowerCase();

  // Tentar parsear expressões relativas (ontem, hoje, amanhã)
  const parsedDate = parseRelativeDate(cleaned);

  if (parsedDate) {
    console.log('📅 Data detectada:', parsedDate.toLocaleDateString('pt-BR'));
    return parsedDate;
  }

  // Se não encontrou data, retornar hoje
  return new Date();
};

/**
 * Extrai descrição do texto removendo valores e metadados detectados
 */
export const parseDescription = (text: string): string => {
  if (!text) return 'Despesa';

  let description = text.trim();

  // Remover valores monetários
  description = description.replace(/r\$\s*\d+[.,]\d{2}/gi, '');
  description = description.replace(/\d+[.,]\d{2}/g, '');

  // Remover menções comuns de cartão/usuário
  const commonWords = ['bruna', 'max', 'uz', 'c6', 'nubank', 'itau', 'itaú', 'cartão', 'cartao'];
  commonWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    description = description.replace(regex, '');
  });

  // Remover expressões temporais
  const temporalWords = ['ontem', 'hoje', 'amanhã', 'amanha'];
  temporalWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    description = description.replace(regex, '');
  });

  // Limpar espaços extras
  description = description.replace(/\s+/g, ' ').trim();

  return description || 'Despesa';
};

/**
 * Parser completo que extrai todas as informações
 */
export interface ParsedInput {
  amount: number | null;
  cardId: string | null;
  userId: string | null;
  description: string;
  date: Date; // Data do lançamento (hoje por padrão)
  confidence: 'high' | 'medium' | 'low';
}

export const parseSmartInput = (
  text: string,
  availableCards: Array<{ id: string; name: string; owner: string }>,
  availableUsers: Array<{ id: string; name: string }>
): ParsedInput => {
  const amount = parseAmount(text);
  const cardId = parseCard(text, availableCards);
  const userId = parseUser(text, availableUsers);
  const date = parseDate(text); // Detectar data (hoje por padrão)
  const description = parseDescription(text);

  // Calcular confiança baseado no que foi detectado
  let confidence: 'high' | 'medium' | 'low' = 'low';
  const detectedCount = [amount, cardId, userId].filter(Boolean).length;

  if (detectedCount === 3) {
    confidence = 'high';
  } else if (detectedCount === 2) {
    confidence = 'medium';
  }

  return {
    amount,
    cardId,
    userId,
    description,
    date,
    confidence,
  };
};

