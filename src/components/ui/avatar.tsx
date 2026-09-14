import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string;
  name?: string;
  size?: AvatarSize;
  style?: ImageStyle;
}

const SIZES: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const FONT_SIZES: Record<AvatarSize, number> = {
  sm: 12,
  md: 14,
  lg: 20,
  xl: 28,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const FALLBACK_COLORS = [
  '#E8F5ED',
  '#FFF3E0',
  '#E3F2FD',
  '#FCE4EC',
  '#F3E5F5',
  '#E8EAF6',
  '#E0F7FA',
  '#FFF8E1',
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export function Avatar({ source, name, size = 'md', style }: AvatarProps) {
  const theme = useTheme();
  const dimension = SIZES[size];

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[{ width: dimension, height: dimension, borderRadius: BorderRadius.full }, style]}
        contentFit="cover"
      />
    );
  }

  const bgColor = name ? getColorForName(name) : theme.primaryLight;
  const initials = name ? getInitials(name) : '?';

  return (
    <View
      style={[
        styles.fallback,
        { width: dimension, height: dimension, backgroundColor: bgColor },
        style,
      ]}
    >
      <ThemedText style={[styles.initials, { fontSize: FONT_SIZES[size], color: '#008568' }]}>
        {initials}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
  },
});
