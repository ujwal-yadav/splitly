import { Platform } from 'react-native';

export type ThemeColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  danger: string;
  success: string;
  white: string;
  black: string;
  overlay: string;
};

export type ThemeColorKey = keyof ThemeColors;

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    primary: '#1A7F56',
    primaryLight: '#E8F5ED',
    primaryDark: '#145F40',
    background: '#FFFFFF',
    surface: '#F7F7F9',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    danger: '#E53935',
    success: '#1A7F56',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    primary: '#2ECC71',
    primaryLight: '#1A3A2A',
    primaryDark: '#27AE60',
    background: '#0F0F0F',
    surface: '#1A1A1E',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    border: '#2D2D32',
    danger: '#EF5350',
    success: '#2ECC71',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    mono: 'Menlo',
  },
  default: {
    sans: 'normal',
    mono: 'monospace',
  },
});

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
