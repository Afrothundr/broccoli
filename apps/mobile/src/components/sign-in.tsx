import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authClient } from '@/lib/auth-client';

type Mode = 'sign-in' | 'sign-up';

// Server auth errors arrive as raw better-auth messages ("INVALID_EMAIL_OR_
// PASSWORD" wording varies by version) — never show those verbatim. Map the
// recognizable ones to plain language; anything unrecognized gets the generic
// line rather than leaking implementation vocabulary at the front door.
function friendlyAuthError(message: string | undefined, mode: Mode): string {
  const raw = (message ?? '').toLowerCase();
  if (raw.includes('invalid email or password') || raw.includes('invalid credential')) {
    return "That email and password don't match. Try again, or create an account.";
  }
  if (raw.includes('already exist') || raw.includes('already registered')) {
    return 'There’s already an account with that email — try signing in instead.';
  }
  if (raw.includes('password') && (raw.includes('short') || raw.includes('length'))) {
    return 'Passwords need at least 8 characters.';
  }
  if (raw.includes('invalid email')) {
    return 'That doesn’t look like an email address — check for typos.';
  }
  return mode === 'sign-in'
    ? "Couldn't sign you in. Check your details and try again."
    : "Couldn't create your account. Check your details and try again.";
}

// Email/password auth against broccoli-api's /api/auth/* routes. On success
// the session lands in expo-secure-store via the expoClient plugin, and
// `onAuthed` tells the root layout to refetch useSession() — on Expo the hook
// doesn't pick up a new session by itself.
export function SignIn({ onAuthed }: { onAuthed?: () => void }) {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    const result =
      mode === 'sign-in'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name });
    setSubmitting(false);
    if (result.error) {
      setError(friendlyAuthError(result.error.message, mode));
      return;
    }
    // No navigation here: the layout swaps to the app once its session
    // refetch (triggered by onAuthed) comes back.
    onAuthed?.();
  }

  // Browser flow: the expoClient plugin opens the system browser for Google's
  // consent screen and resolves once the deep link lands back in the app.
  // Signing in with a Google account whose email matches an existing user
  // links to it server-side (accountLinking) rather than duplicating.
  async function signInWithGoogle() {
    setError(null);
    setGoogleSubmitting(true);
    try {
      // Resolves with {error} for API failures, but THROWS for client-side
      // ones (browser dismissed mid-consent, no browser available) — without
      // the try/finally a throw would leave the spinner running forever.
      // errorCallbackURL: OAuth failures deep-link back into the app (the
      // plugin converts '/' to the broccolimobile:// scheme) instead of
      // stranding the user on an api error page in the browser.
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
        errorCallbackURL: '/',
      });
      if (result.error) {
        setError("Google sign-in didn't finish. Try again.");
        return;
      }
      onAuthed?.();
    } catch {
      setError("Google sign-in didn't finish. Try again.");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Image
          source={require('@/assets/images/brand/logo.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Broccoli"
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
        </ThemedText>

        <ThemedView style={styles.form}>
          {mode === 'sign-up' && (
            <Input
              placeholder="Name"
              autoCapitalize="words"
              autoComplete="name"
              value={name}
              onChangeText={setName}
            />
          )}
          <Input
            placeholder="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            placeholder="Password"
            autoCapitalize="none"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && (
            <ThemedText
              type="small"
              accessibilityRole="alert"
              style={[styles.error, { color: theme.destructive }]}>
              {error}
            </ThemedText>
          )}

          <Button
            title={mode === 'sign-in' ? 'Sign in' : 'Create account'}
            loading={submitting}
            onPress={submit}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.divider}>
            or
          </ThemedText>

          <Button
            title="Continue with Google"
            variant="secondary"
            loading={googleSubmitting}
            onPress={signInWithGoogle}
          />

          <Pressable
            hitSlop={Spacing.two}
            accessibilityRole="button"
            style={({ pressed }) => pressed && styles.pressed}
            onPress={() => {
              setError(null);
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
            }}>
            <ThemedText type="linkPrimary" style={styles.toggle}>
              {mode === 'sign-in'
                ? 'No account? Create one'
                : 'Already have an account? Sign in'}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  logo: {
    alignSelf: 'center',
    width: 240,
    height: 54,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  error: {
    textAlign: 'center',
  },
  divider: {
    textAlign: 'center',
  },
  toggle: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
