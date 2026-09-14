import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

const tones = {
  green: ['#E3F8F0', '#008568'],
  blue: ['#EAF3FF', '#2870EA'],
  orange: ['#FFF2E4', '#C86410'],
  purple: ['#F1ECFF', '#7952CB'],
} as const;
export function IconTile({
  icon,
  tone = 'green',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: keyof typeof tones;
}) {
  const [backgroundColor, color] = tones[tone];
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 11,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={24} color={color} />
    </View>
  );
}
