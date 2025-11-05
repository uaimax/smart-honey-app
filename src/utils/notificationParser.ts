import { ParsedNotification } from '@/types';

/**
 * Lista de apps bancários conhecidos
 */
const BANKING_APPS = [
  'com.google.android.apps.walletnfcrel', // Google Wallet
  'com.samsung.android.spay', // Samsung Pay
  'com.c6bank.app', // C6 Bank
  'com.nu.production', // Nubank
  'br.com.itau', // Itaú
  'br.com.bradesco', // Bradesco
  'com.santander.app', // Santander
];

/**
 * Verifica se a notificação é de um app bancário
 */
export const isBankingNotification = (packageName: string): boolean => {
  return BANKING_APPS.some(app => packageName.includes(app));
};

/**
 * Extrai valor monetário do texto da notificação
 */
const extractAmount = (text: string): number | null => {
  // Padrões comuns em notificações bancárias
  const patterns = [
    /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i, // R$ 1.234,56
    /R\$\s*(\d+,\d{2})/i,                   // R$ 123,45
    /valor\s*:?\s*R\$\s*(\d+,\d{2})/i,      // Valor: R$ 123,45
    /(\d{1,3}(?:\.\d{3})*,\d{2})/,          // 1.234,56
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Remover pontos de milhar e converter vírgula para ponto
      const valueStr = match[1].replace(/\./g, '').replace(',', '.');
      const value = parseFloat(valueStr);
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
  }

  return null;
};

/**
 * Extrai nome do estabelecimento
 */
const extractEstablishment = (text: string): string => {
  // Remover padrões comuns de notificações bancárias
  let establishment = text;

  // Remover valores monetários
  establishment = establishment.replace(/R\$\s*[\d.,]+/gi, '');

  // Remover palavras comuns de notificações
  const commonWords = [
    'compra aprovada',
    'compra',
    'débito',
    'crédito',
    'transação',
    'pagamento',
    'valor',
    'cartão',
    'cartao',
    'final',
    /\d{4}/, // Últimos 4 dígitos do cartão
  ];

  commonWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    establishment = establishment.replace(regex, '');
  });

  // Limpar pontuações e espaços extras
  establishment = establishment
    .replace(/[:;.,!?-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return establishment || 'Estabelecimento não identificado';
};

/**
 * Extrai últimos 4 dígitos do cartão
 */
const extractCardLast4 = (text: string): string | undefined => {
  const patterns = [
    /final\s*(\d{4})/i,
    /\*{4}\s*(\d{4})/,
    /cartão\s*.*?(\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
};

/**
 * Parse completo de notificação bancária
 */
export const parseNotification = (
  title: string,
  body: string,
  packageName: string
): ParsedNotification | null => {
  // Verificar se é de um app bancário
  if (!isBankingNotification(packageName)) {
    return null;
  }

  const fullText = `${title} ${body}`;

  // Extrair informações
  const amount = extractAmount(fullText);
  if (!amount) {
    console.log('⚠️ Não foi possível extrair valor da notificação');
    return null;
  }

  const description = extractEstablishment(fullText);
  const cardLast4 = extractCardLast4(fullText);

  console.log('🔔 Notificação bancária parseada:', {
    amount,
    description,
    cardLast4,
    source: packageName,
  });

  return {
    description,
    amount,
    timestamp: new Date(),
    cardLast4,
  };
};

/**
 * Exemplos de formatos de notificações bancárias
 *
 * Google Wallet:
 * - "Compra aprovada - R$ 45,90 em IFOOD"
 * - "Débito de R$ 22,50 - Padaria Central"
 *
 * C6 Bank:
 * - "Compra de R$ 18,90 no UBER aprovada"
 * - "Transação aprovada: R$ 127,00 - AMAZON"
 *
 * Nubank:
 * - "Compra no crédito - R$ 50,00 - Supermercado"
 * - "Débito de R$ 30,00 em Posto Shell"
 *
 * Samsung Pay:
 * - "Pagamento aprovado R$ 75,00 - Restaurante"
 */

