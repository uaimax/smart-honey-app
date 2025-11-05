import { useColorScheme } from 'react-native';
import { lightColors, darkColors, Colors } from './colors';
import { typography, Typography } from './typography';
import { spacing, borderRadius, iconSizes, Spacing, BorderRadius, IconSizes } from './spacing';

export interface Theme {
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  iconSizes: IconSizes;
  isDark: boolean;
}

/**
 * Hook para obter o tema atual baseado no modo do sistema
 */
export const useTheme = (): Theme => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colors: isDark ? darkColors : lightColors,
    typography,
    spacing,
    borderRadius,
    iconSizes,
    isDark,
  };
};

// Exportar partes individuais
export { lightColors, darkColors };
export { typography };
export { spacing, borderRadius, iconSizes };
export type { Colors, Typography, Spacing, BorderRadius, IconSizes };

