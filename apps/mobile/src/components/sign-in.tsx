import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authClient } from '@/lib/auth-client';

type Mode = 'sign-in' | 'sign-up';

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

  async function submit() {
    setError(null);
    setSubmitting(true);
    const result =
      mode === 'sign-in'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name });
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? 'Something went wrong.');
      return;
    }
    // No navigation here: the layout swaps to the app once its session
    // refetch (triggered by onAuthed) comes back.
    onAuthed?.();
  }

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Broccoli
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          {mode === 'sign-in' ? 'Sign in to your account' : 'Create your account'}
        </ThemedText>

        <ThemedView style={styles.form}>
          {mode === 'sign-up' && (
            <TextInput
              style={inputStyle}
              placeholder="Name"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              autoComplete="name"
              value={name}
              onChangeText={setName}
            />
          )}
          <TextInput
            style={inputStyle}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={inputStyle}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <Pressable
            style={[styles.button, { backgroundColor: theme.text }, submitting && styles.disabled]}
            disabled={submitting}
            onPress={submit}>
            <ThemedText type="smallBold" themeColor="background">
              {submitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </ThemedText>
          </Pressable>

          <Pressable
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
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    color: '#e5484d',
    textAlign: 'center',
  },
  toggle: {
    textAlign: 'center',
  },
});
