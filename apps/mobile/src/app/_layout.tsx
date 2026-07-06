import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { SignIn } from '@/components/sign-in';
import { authClient } from '@/lib/auth-client';

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

  // Brand typeface (styling epic 3nl.3). If loading errors we render anyway —
  // ThemedText falls back to the system font for unregistered families.
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });
  const fontsReady = fontsLoaded || fontError != null;

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
