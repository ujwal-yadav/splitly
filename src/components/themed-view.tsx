import { View, type ViewProps } from 'react-native';

import { type ThemeColorKey } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  bgColor?: ThemeColorKey;
};

export function ThemedView({ style, bgColor, ...props }: ThemedViewProps) {
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[bgColor ?? 'background'] }, style]} {...props} />;
}
