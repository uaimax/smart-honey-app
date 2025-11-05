// Sistema de tipografia do Smart Honey

export const typography = {
  // Tamanhos de fonte
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  // Pesos de fonte
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Altura de linha
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },

  // Espaçamento de letras
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

export type Typography = typeof typography;

