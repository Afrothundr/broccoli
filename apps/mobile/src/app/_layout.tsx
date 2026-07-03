import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

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

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {!isPending && (session ? <AppTabs /> : <SignIn onAuthed={refetch} />)}
    </ThemeProvider>
  );
}
