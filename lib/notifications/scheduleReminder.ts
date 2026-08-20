import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  // expo-notifications does not support scheduled local notifications on web (only push,
  // which needs a separate service-worker + VAPID setup out of scope for this MVP). Asking
  // for permission there would either hang or prompt for something we can't act on.
  if (Platform.OS === 'web') return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Schedules a real local device notification for a reminder (spec section 9: a reminder must
 * not merely exist as a database record). Returns the OS notification id on success, or null
 * if permission was denied (or the platform can't support it, e.g. web) — callers must not
 * claim the reminder is "set" unless this succeeds.
 */
export async function scheduleReminderNotification(params: {
  title: string;
  body?: string;
  at: Date;
}): Promise<string | null> {
  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return Notifications.scheduleNotificationAsync({
    content: { title: params.title, body: params.body, sound: false },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: params.at,
      channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    },
  });
}

export async function cancelReminderNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
