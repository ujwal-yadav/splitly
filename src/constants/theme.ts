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
    primary: '#246F58',
    primaryLight: '#E4F1E9',
    primaryDark: '#184F40',
    background: '#F5F6F2',
    surface: '#FFFFFF',
    text: '#1D3029',
    textSecondary: '#68766F',
    textTertiary: '#7C8982',
    border: '#E9EDF5',
    danger: '#E54465',
    success: '#287555',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    primary: '#73C7A1',
    primaryLight: '#1A3A2A',
    primaryDark: '#246F58',
    background: '#101923',
    surface: '#192632',
    text: '#FFFFFF',
    textSecondary: '#B1BDD0',
    textTertiary: '#8E9DB5',
    border: '#2B3C4B',
    danger: '#F19982',
    success: '#73C7A1',
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
  sm: 13,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 26,
  '4xl': 32,
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
  xl: 24,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const BorderRadius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 28,
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
