import { Feather } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsPanel } from '@/components/settings-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { UsageChart } from '@/components/usage-chart';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { StatsOverview, useStats } from '@/hooks/use-stats';
import { useTheme } from '@/hooks/use-theme';

// Home = the savings dashboard (PRD §7 Phase 5, reframed per feedback):
// leads with how much the user has SAVED against the ~1/3 of groceries the
// average household wastes (same math as the legacy dashboard's
// TotalSavings), then where the money goes, then a nudge back to the
// check-in. The waste number still exists — as the reason the savings
// number is real — but the tone is "look what you kept."

const BASELINE_WASTE_RATE = 1 / 3;

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function SavingsHero({ stats }: { stats: StatsOverview }) {
  const theme = useTheme();
  const actualRate = stats.totalSpend > 0 ? stats.wastedValue / stats.totalSpend : 0;
  const saved = Math.max(stats.totalSpend * BASELINE_WASTE_RATE - stats.wastedValue, 0);
  const reductionPct =
    stats.totalSpend > 0 ? ((BASELINE_WASTE_RATE - actualRate) / BASELINE_WASTE_RATE) * 100 : 0;

  const badgeColor =
    reductionPct > 25 ? theme.statusGood : reductionPct > -25 ? theme.statusWarn : theme.destructive;
  const badgeText =
    reductionPct >= 0
      ? `${Math.round(reductionPct)}% less waste than average`
      : `${Math.round(-reductionPct)}% more waste than average`;

  return (
    <ThemedView type="backgroundElement" style={styles.hero}>
      <ThemedText type="small" themeColor="textSecondary">
        Saved so far
      </ThemedText>
      <ThemedText type="subtitle" style={styles.heroValue}>
        {money(saved)}
      </ThemedText>
      <ThemedView style={[styles.badge, { backgroundColor: `${badgeColor}1A` }]}>
        <ThemedText type="small" style={{ color: badgeColor }}>
          {badgeText}
        </ThemedText>
      </ThemedView>
      <ThemedText type="small" themeColor="textSecondary">
        The average household wastes a third of the groceries it buys.
      </ThemedText>
    </ThemedView>
  );
}

function CategoryInsights({ categories }: { categories: StatsOverview['categories'] }) {
  const theme = useTheme();
  const max = Math.max(...categories.map((c) => c.spend), 1);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Where your money goes</ThemedText>
      {categories.map((c) => (
        <ThemedView key={c.category} type="backgroundElement" style={styles.categoryRow}>
          <ThemedView type="backgroundElement" style={styles.categoryHeader}>
            <ThemedText type="small" style={styles.categoryName} numberOfLines={1}>
              {c.category}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {money(c.spend)}
              {c.wasted > 0 ? ` · ${money(c.wasted)} wasted` : ''}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.categoryTrack} type="backgroundSelected">
            <ThemedView
              style={[
                styles.categoryBar,
                { width: `${(c.spend / max) * 100}%`, backgroundColor: theme.primary },
              ]}
            />
          </ThemedView>
        </ThemedView>
      ))}
    </ThemedView>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const { stats, error } = useStats();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const hasData = stats !== null && stats.receiptCount > 0;
  const kitchenCount = stats ? stats.counts.active + stats.counts.expired : 0;

  if (settingsOpen) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.settingsSafeArea]}>
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.headerRow}>
            <ThemedText type="subtitle">Your food money</ThemedText>
            <Pressable
              onPress={() => setSettingsOpen(true)}
              hitSlop={Spacing.three}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={({ pressed }) => pressed && styles.pressed}>
              <Feather name="settings" size={24} color={theme.textSecondary} />
            </Pressable>
          </ThemedView>

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
              <SavingsHero stats={stats} />

              <ThemedView style={styles.tiles}>
                <ThemedView type="backgroundElement" style={styles.tile}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Spent
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.tileValue}>
                    {money(stats.totalSpend)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {money(stats.averageReceipt)} avg · {stats.receiptCount}{' '}
                    {stats.receiptCount === 1 ? 'trip' : 'trips'}
                  </ThemedText>
                </ThemedView>
                <ThemedView type="backgroundElement" style={styles.tile}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Put to use
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.tileValue}>
                    {money(stats.eatenValue)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {stats.counts.eaten} {stats.counts.eaten === 1 ? 'item' : 'items'} eaten
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <UsageChart weekly={stats.weekly} />

              {stats.categories.length > 0 && <CategoryInsights categories={stats.categories} />}

              {kitchenCount > 0 && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="smallBold">
                    {kitchenCount} {kitchenCount === 1 ? 'item' : 'items'} in your kitchen
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    A quick check-in keeps your savings number honest.
                  </ThemedText>
                  <Button title="Update your inventory" onPress={() => router.push('/inventory')} />
                </ThemedView>
              )}
            </>
          ) : (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Your savings will show up here once you save a receipt.
              </ThemedText>
              <Link href="/capture">
                <ThemedText type="linkPrimary">Snap your first receipt</ThemedText>
              </Link>
            </ThemedView>
          )}
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
  settingsSafeArea: {
    paddingBottom: BottomTabInset + Spacing.three,
  },
  scroll: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hero: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  heroValue: {
    fontSize: 40,
    lineHeight: 48,
  },
  badge: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
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
    fontSize: 22,
    lineHeight: 28,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  categoryRow: {
    gap: Spacing.one,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  categoryName: {
    flexShrink: 1,
  },
  categoryTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBar: {
    height: 8,
    borderRadius: 4,
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
  pressed: {
    opacity: 0.6,
  },
});
