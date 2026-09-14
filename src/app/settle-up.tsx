import { useLocalSearchParams } from 'expo-router';
import { SettleScreen } from '@/components/settle-screen';

export default function SettleUp() {
  const { groupId, currency } = useLocalSearchParams<{ groupId?: string; currency?: string }>();
  return <SettleScreen groupId={groupId} currency={currency} />;
}
