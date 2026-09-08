import { Colors, ThemeColors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
