import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { FontSize, FontWeight, type ThemeColorKey } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: keyof typeof styles;
  themeColor?: ThemeColorKey;
};

export function ThemedText({ style, type, themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type && styles[type],
        style as TextStyle,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: 28,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: 24,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: 20,
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: 16,
  },
});
