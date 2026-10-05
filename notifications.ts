import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { notificationsApi } from '../api/endpoints';

/**
 * Push-notification bootstrap.
 *
 * The app is designed so that notifications are a *nice to have*: if the user
 * denies permission, or the runtime cannot mint a push token (e.g. Expo Go,
 * simulator, missing EAS project id), everything else keeps working. We never
 * throw out of these helpers.
 */

let handlerConfigured = false;

/** Show alerts even when the app is foregrounded. Call once at startup. */
export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

/** Android requires an explicit channel for heads-up notifications. */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Warzone Companion',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lightColor: '#F2A33C',
    });
  } catch {
    // Channel setup is best-effort.
  }
}

/**
 * Ask for permission (if not already granted) and register the device push
 * token with our backend. Returns the token when one was obtained, otherwise
 * `null`. Safe to call on every app start.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Expo Go on Android cannot provide remote push notifications. Calling the
  // native token API there triggers a fatal Expo Go runtime error, so skip it
  // entirely. A development/production build can use the normal path below.
  if (Constants.appOwnership === 'expo') return null;

  try {
    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
        ?.projectId ??
      (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse?.data;
    if (!token) return null;

    await notificationsApi.registerPushToken(token, Platform.OS);
    return token;
  } catch {
    // Simulators / Expo Go / no project id → notifications simply unavailable.
    return null;
  }
}

/**
 * Subscribe to notification taps. Returns an unsubscribe function so callers
 * can clean up on unmount.
 */
export function addNotificationResponseListener(
  onResponse: (response: Notifications.NotificationResponse) => void,
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => sub.remove();
}
