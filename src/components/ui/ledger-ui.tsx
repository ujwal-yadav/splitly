import { IconTile } from '@/components/ui/icon-tile';
import { MotionPressable } from '@/components/ui/motion-pressable';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useLedger } from '@/contexts/ledger-context';
import { useTheme } from '@/hooks/use-theme';
import { debts, money, selfId, type Group } from '@/domain/ledger';
export const layout = StyleSheet.create({
  content: { padding: 20, paddingTop: 8, paddingBottom: 28, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.6 },
  body: { fontSize: 13, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600' },
  footer: { padding: 16, gap: 8 },
});
export function Page({
  title,
  children,
  tab = false,
  action,
  footer,
  refresh = false,
}: {
  title: string;
  children: ReactNode;
  tab?: boolean;
  action?: ReactNode;
  footer?: ReactNode;
  refresh?: boolean;
}) {
  const l = useLedger();
  const t = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  return (
    <Screen tab={tab}>
      <ScreenHeader title={title} back={!tab} action={action} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={layout.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            refresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await l.refresh();
                  setRefreshing(false);
                }}
              />
            ) : undefined
          }
        >
          {l.loading ? (
            <ActivityIndicator accessibilityLabel="Loading records" color={t.primary} />
          ) : l.error ? (
            <Panel>
              <ErrorText message={l.error} />
              <Button title="Try again" onPress={() => void l.refresh()} />
            </Panel>
          ) : (
            children
          )}
        </ScrollView>
        {!l.loading && !l.error && footer && (
          <View style={[layout.footer, { backgroundColor: t.surface }]}>{footer}</View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}
export function Panel({ children, hero = false }: { children: ReactNode; hero?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: hero ? t.primaryDark : t.border,
        gap: 10,
        backgroundColor: hero ? t.primaryDark : t.surface,
      }}
    >
      {children}
    </View>
  );
}
export function Copy({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  const t = useTheme();
  return (
    <ThemedText style={[layout.body, muted && { color: t.textSecondary }]}>{children}</ThemedText>
  );
}
export function Heading({ children }: { children: ReactNode }) {
  return (
    <ThemedText accessibilityRole="header" style={layout.title}>
      {children}
    </ThemedText>
  );
}
export function ErrorText({ message }: { message: string }) {
  const t = useTheme();
  return message ? (
    <ThemedText
      accessibilityRole="alert"
      aria-live="polite"
      style={{ color: t.danger, fontSize: 13, lineHeight: 20 }}
    >
      {message}
    </ThemedText>
  ) : null;
}
export function Row({
  title,
  subtitle,
  icon = 'chevron-forward',
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: t.border,
          backgroundColor: t.surface,
          opacity: pressed ? 0.7 : 1,
        },
        layout.row,
      ]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>{title}</ThemedText>
        {subtitle && <Copy muted>{subtitle}</Copy>}
      </View>
      <Ionicons name={icon} size={20} color={t.primary} />
    </MotionPressable>
  );
}
export function AccountButton() {
  const l = useLedger();
  const r = useRouter();
  const t = useTheme();
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel="Profile"
      onPress={() => r.push('/(tabs)/profile')}
    >
      <Avatar
        name={l.preferences.name}
        size="md"
        style={{ borderWidth: 1.5, borderColor: `${t.primary}66` }}
      />
    </MotionPressable>
  );
}
export function GroupRow({ group, hideAmounts = false }: { group: Group; hideAmounts?: boolean }) {
  const r = useRouter();
  const l = useLedger();
  const me = selfId(group, l.userId);
  const all = debts(group);
  const owe = all.filter((d) => d.from === me).reduce((n, d) => n + d.amount, 0);
  const owed = all.filter((d) => d.to === me).reduce((n, d) => n + d.amount, 0);
  const t = useTheme();
  const trip = /trip|goa|travel|holiday/i.test(group.name);
  const home = /home|apartment|flat|family/i.test(group.name);
  const food = /dinner|food|lunch/i.test(group.name);
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={group.name}
      onPress={() => r.push({ pathname: '/group/[id]', params: { id: group.id } })}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: t.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: t.border,
      }}
    >
      <IconTile
        icon={
          trip
            ? 'airplane-outline'
            : home
              ? 'home-outline'
              : food
                ? 'restaurant-outline'
                : 'business-outline'
        }
        tone={home || food ? 'orange' : 'blue'}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>{group.name}</ThemedText>
        <ThemedText style={{ fontSize: 11, color: t.textSecondary }}>
          {group.members.length} people · {group.currency}
        </ThemedText>
      </View>
      <View style={{ maxWidth: '43%', alignItems: 'flex-end', gap: 3 }}>
        {hideAmounts ? (
          <Copy muted>View balances</Copy>
        ) : (
          <>
            {!!owe && (
              <ThemedText
                style={{ color: t.danger, fontSize: 12, fontWeight: '600', textAlign: 'right' }}
              >
                You owe {money(owe, group.currency)}
              </ThemedText>
            )}
            {!!owed && (
              <ThemedText
                style={{ color: t.success, fontSize: 12, fontWeight: '600', textAlign: 'right' }}
              >
                You’re owed {money(owed, group.currency)}
              </ThemedText>
            )}
            {!owe && !owed && group.expenses.some((expense) => !expense.deleted) && (
              <ThemedText style={{ color: t.success, fontSize: 12 }}>Settled</ThemedText>
            )}
          </>
        )}
      </View>
      <Ionicons name="chevron-forward" size={15} color={t.textTertiary} />
    </MotionPressable>
  );
}
export function Confirm({
  visible,
  title,
  children,
  onCancel,
  onConfirm,
  busy = false,
  confirmLabel = 'Confirm',
}: {
  visible: boolean;
  title: string;
  children: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
  confirmLabel?: string;
}) {
  const t = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0008' }}>
        <View
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: 520,
            alignSelf: 'center',
            backgroundColor: t.surface,
            borderRadius: 24,
            padding: 24,
            gap: 16,
          }}
        >
          <Heading>{title}</Heading>
          {children}
          <Button title={confirmLabel} onPress={onConfirm} loading={busy} />
          <Button title="Cancel" variant="ghost" onPress={onCancel} disabled={busy} />
        </View>
      </View>
    </Modal>
  );
}
