import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/contexts/auth-context';
export default function Start() {
  const a = useAuth();
  if (a.loading)
    return (
      <Screen>
        <ActivityIndicator accessibilityLabel="Restoring your session" />
      </Screen>
    );
  return <Redirect href={a.session ? '/(tabs)' : '/onboarding'} />;
}
