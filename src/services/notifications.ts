import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return token;
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ push_token: token }).eq('id', userId);

  if (error) throw error;
}

export async function sendExpenseNotification(
  pushTokens: string[],
  title: string,
  amount: number,
  groupName: string,
  paidByName: string,
): Promise<void> {
  const messages = pushTokens.map((token) => ({
    to: token,
    sound: 'default' as const,
    title: `New expense in ${groupName}`,
    body: `${paidByName} added "${title}" for ₹${amount.toLocaleString('en-IN')}`,
    data: { type: 'expense', groupName },
  }));

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
}

export async function sendSettlementNotification(
  pushToken: string,
  fromName: string,
  amount: number,
  groupName: string,
): Promise<void> {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: pushToken,
      sound: 'default',
      title: 'Settlement received',
      body: `${fromName} settled ₹${amount.toLocaleString('en-IN')} in ${groupName}`,
      data: { type: 'settlement', groupName },
    }),
  });
}

export async function sendReminderNotification(
  pushToken: string,
  toName: string,
  amount: number,
  fromName: string,
): Promise<void> {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: pushToken,
      sound: 'default',
      title: 'Payment reminder',
      body: `${fromName} is requesting ₹${amount.toLocaleString('en-IN')} from you`,
      data: { type: 'reminder', toName },
    }),
  });
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
