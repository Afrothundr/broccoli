import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { SignIn } from '@/components/sign-in';
import { authClient } from '@/lib/auth-client';
import { registerForNudges } from '@/lib/push';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // Session is restored from secure storage on launch. While it resolves we
  // show only the splash; then unauthenticated users get the sign-in screen
  // and authenticated users get the app.
  //
  // `refetch` is threaded to SignIn because on Expo the useSession atom does
  // not refresh itself after signIn/signUp (unlike web) — without an explicit
  // refetch the app stays on the sign-in screen even though the session
  // cookie landed in secure storage.
  const { data: session, isPending, refetch } = authClient.useSession();

  // Brand typeface — Produce Ledger (styling, planning/mobile-redesign-2026-08-28.md).
  // If loading errors we render anyway — ThemedText falls back to the system
  // font for unregistered families.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fraunces_600SemiBold,
  });
  const fontsReady = fontsLoaded || fontError != null;

  // Register the device for push nudges once per signed-in user (Phase 4).
  // Fire-and-forget: registerForNudges no-ops gracefully on any failure.
  const userId = session?.user.id;
  useEffect(() => {
    if (userId) void registerForNudges();
  }, [userId]);

  return (
    // Gesture root is required once, above any Gesture.* usage (check-in deck).
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {!isPending && fontsReady && (session ? <AppTabs /> : <SignIn onAuthed={refetch} />)}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
