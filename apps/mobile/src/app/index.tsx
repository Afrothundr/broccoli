import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NudgeSettings } from '@/components/nudge-settings';
import { SpendChart } from '@/components/spend-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useStats } from '@/hooks/use-stats';
import { useTheme } from '@/hooks/use-theme';
import { authClient } from '@/lib/auth-client';

// Home = the spend & waste dashboard (PRD §7 Phase 5): what you spend, what
// you waste, and the trend — the financial hook that brings people back,
// backed by the waste data the check-in collects (§1 north star).

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.tile}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="subtitle" style={styles.tileValue}>
        {value}
      </ThemedText>
      {sub && (
        <ThemedText type="small" themeColor="textSecondary">
          {sub}
        </ThemedText>
      )}
    </ThemedView>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const { stats, error } = useStats();
  const { refetch } = authClient.useSession();

  const hasData = stats !== null && stats.receiptCount > 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Your food money</ThemedText>

          {error && (
            <ThemedText type="small" style={[styles.error, { color: theme.destructive }]}>
              {error}
            </ThemedText>
          )}

          {stats === null && !error ? (
            <ThemedView style={styles.empty}>
              <ActivityIndicator />
            </ThemedView>
          ) : hasData ? (
            <>
              <ThemedView style={styles.tiles}>
                <StatTile
                  label="Spent"
                  value={money(stats.totalSpend)}
                  sub={`${money(stats.averageReceipt)} avg · ${stats.receiptCount} ${
                    stats.receiptCount === 1 ? 'trip' : 'trips'
                  }`}
                />
                <StatTile
                  label="Lost to waste"
                  value={money(stats.wastedValue)}
                  sub={
                    stats.wasteRatePct != null
                      ? `${stats.wasteRatePct.toFixed(0)}% of what you bought`
                      : `${stats.counts.tossed + stats.counts.expired} ${
                          stats.counts.tossed + stats.counts.expired === 1 ? 'item' : 'items'
                        }`
                  }
                />
              </ThemedView>

              <SpendChart weekly={stats.weekly} />
            </>
          ) : (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Your spend and waste numbers will show up here once you save a receipt.
              </ThemedText>
              <Link href="/capture">
                <ThemedText type="linkPrimary">Snap your first receipt</ThemedText>
              </Link>
            </ThemedView>
          )}

          <NudgeSettings />

          <Pressable onPress={() => authClient.signOut().then(() => refetch())}>
            <ThemedText type="linkPrimary" style={styles.signOut}>
              Sign out
            </ThemedText>
          </Pressable>
        </ScrollView>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  scroll: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  tile: {
    flex: 1,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.half,
  },
  tileValue: {
    fontSize: 26,
    lineHeight: 32,
  },
  empty: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyText: {
    textAlign: 'center',
  },
  error: {
    textAlign: 'center',
  },
  signOut: {
    textAlign: 'center',
  },
});
