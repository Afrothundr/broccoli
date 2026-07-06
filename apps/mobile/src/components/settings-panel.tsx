import { Pressable, StyleSheet } from 'react-native';

import { NudgeSettings } from '@/components/nudge-settings';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';

// Settings, opened from the gear on Home (same take-over pattern as
// capture → review). Nudge preferences and account actions live here so the
// dashboard stays about the numbers.
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { data: session, refetch } = authClient.useSession();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle">Settings</ThemedText>
        <Pressable
          onPress={onClose}
          hitSlop={Spacing.three}
          accessibilityRole="button"
          accessibilityLabel="Close settings"
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            ✕
          </ThemedText>
        </Pressable>
      </ThemedView>

      <NudgeSettings />

      <ThemedView type="backgroundElement" style={styles.card}>
        {session && (
          <ThemedView type="backgroundElement" style={styles.row}>
            <ThemedText type="small" themeColor="textSecondary">
              Signed in as
            </ThemedText>
            <ThemedText type="small">{session.user.email}</ThemedText>
          </ThemedView>
        )}
        <Pressable
          onPress={() => authClient.signOut().then(() => refetch())}
          hitSlop={Spacing.two}
          accessibilityRole="button"
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText type="linkPrimary">Sign out</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
