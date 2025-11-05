// Sistema de cores do Smart Honey

export const lightColors = {
  // Cores principais
  primary: '#FFA500', // Honey orange
  primaryDark: '#FF8C00',
  primaryLight: '#FFB733',

  // Background e superfícies
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceVariant: '#E8E8E8',

  // Texto
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textOnPrimary: '#FFFFFF',

  // Estados
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Bordas e divisores
  border: '#E0E0E0',
  divider: '#F0F0F0',

  // Sombras
  shadow: 'rgba(0, 0, 0, 0.1)',

  // Estados de interação
  hover: 'rgba(255, 165, 0, 0.1)',
  pressed: 'rgba(255, 165, 0, 0.2)',
  disabled: '#D0D0D0',

  // Específicos do app
  recording: '#EF4444',
  sending: '#F59E0B',
  sent: '#10B981',
};

export const darkColors = {
  // Cores principais
  primary: '#FFB833', // Honey orange mais claro para dark mode
  primaryDark: '#FFA500',
  primaryLight: '#FFC966',

  // Background e superfícies
  background: '#1A1A1A',
  surface: '#2D2D2D',
  surfaceVariant: '#3D3D3D',

  // Texto
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#707070',
  textOnPrimary: '#1A1A1A',

  // Estados (mesmas cores, funcionam bem em dark)
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Bordas e divisores
  border: '#404040',
  divider: '#333333',

  // Sombras
  shadow: 'rgba(0, 0, 0, 0.5)',

  // Estados de interação
  hover: 'rgba(255, 184, 51, 0.15)',
  pressed: 'rgba(255, 184, 51, 0.25)',
  disabled: '#505050',

  // Específicos do app
  recording: '#EF4444',
  sending: '#F59E0B',
  sent: '#10B981',
};

export type Colors = typeof lightColors;

