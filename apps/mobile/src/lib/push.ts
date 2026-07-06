import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { trpc } from './trpc';

// Push registration (Phase 4). Called fire-and-forget once a session exists:
// ask permission, fetch the Expo push token, hand it to broccoli-api together
// with the device timezone (quiet hours mean *this* device's evening). Every
// failure path is a logged no-op — a build without FCM credentials, a denied
// permission, or an offline api must never break the app.

// Foreground behavior: show nudges even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForNudges(): Promise<boolean> {
  try {
    // Android needs a channel before anything can be displayed.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Nudges',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    const permission = existing.granted
      ? existing
      : await Notifications.requestPermissionsAsync();
    if (!permission.granted) {
      console.log('push: permission not granted, skipping registration');
      return false;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    await trpc.push.register.mutate({
      token,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    console.log('push: registered for nudges');
    return true;
  } catch (err) {
    // Typically: no FCM credentials in this build, or the api is unreachable.
    console.log('push: registration unavailable —', String(err));
    return false;
  }
}
