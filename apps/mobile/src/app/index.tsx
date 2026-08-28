import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsPanel } from '@/components/settings-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { UsageChart } from '@/components/usage-chart';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useBackHandler } from '@/hooks/use-back-handler';
import { type StatsOverview, useStats } from '@/hooks/use-stats';
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

// The hero is an estimate built on a 1/3 baseline — cents would be false
// precision. Exact receipt-derived numbers (tiles, categories) keep cents.
function moneyWhole(n: number): string {
  return `$${Math.round(n)}`;
}

function SavingsHero({ stats }: { stats: StatsOverview }) {
  const theme = useTheme();
  const actualRate =
    stats.totalSpend > 0 ? stats.wastedValue / stats.totalSpend : 0;
  const saved = Math.max(
    stats.totalSpend * BASELINE_WASTE_RATE - stats.wastedValue,
    0,
  );
  const reductionPct =
    stats.totalSpend > 0
      ? ((BASELINE_WASTE_RATE - actualRate) / BASELINE_WASTE_RATE) * 100
      : 0;

  // Savings framing (beta feedback): the first thing a struggling user sees
  // every day must not be a red guilt banner. Doing better than average is
  // lime on the stalk hero; doing worse is amber with the path forward —
  // never destructive-red, which this screen reserves for errors.
  const good = reductionPct >= 0;
  const badgeText = good
    ? `${Math.round(reductionPct)}% less waste than average`
    : `${Math.round(-reductionPct)}% above average — check-ins close the gap`;

  // Prototype 05's hero: stalk surface, Fraunces figure in floret-2, quiet
  // paper metadata. Money stays the hook (PRD §1) but never nudges buying.
  return (
    <ThemedView style={[styles.hero, { backgroundColor: theme.stalk }]}>
      <ThemedText
        type="small"
        style={[styles.heroLabel, { color: `${theme.background}80` }]}>
        Saved so far
      </ThemedText>
      <ThemedText type="display" style={{ color: theme.floret2 }}>
        {moneyWhole(saved)}
      </ThemedText>
      <ThemedView
        style={[
          styles.badge,
          { backgroundColor: good ? `${theme.floret}26` : `${theme.amber}33` },
        ]}>
        <ThemedText type="small" style={{ color: good ? theme.floret2 : theme.amber }}>
          {badgeText}
        </ThemedText>
      </ThemedView>
      <ThemedText
        type="small"
        style={[styles.heroCaption, { color: `${theme.background}99` }]}>
        The average household wastes a third of the groceries it buys — that
        third is what these numbers measure you against.
      </ThemedText>
    </ThemedView>
  );
}

function CategoryInsights({
  categories,
}: {
  categories: StatsOverview['categories'];
}) {
  const theme = useTheme();
  const max = Math.max(...categories.map((c) => c.spend), 1);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Where your money goes</ThemedText>
      {categories.map((c) => (
        <ThemedView
          key={c.category}
          type="backgroundElement"
          style={styles.categoryRow}
        >
          <ThemedView type="backgroundElement" style={styles.categoryHeader}>
            <ThemedText
              type="small"
              style={styles.categoryName}
              numberOfLines={1}
            >
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
                {
                  width: `${(c.spend / max) * 100}%`,
                  backgroundColor: theme.primary,
                },
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
  const { stats, error, retry } = useStats();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Android hardware back dismisses settings instead of exiting the app.
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  useBackHandler(settingsOpen, closeSettings);

  const hasData = stats !== null && stats.receiptCount > 0;
  const kitchenCount = stats ? stats.counts.active + stats.counts.expired : 0;

  if (settingsOpen) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={[styles.safeArea, styles.settingsSafeArea]}>
          <SettingsPanel onClose={closeSettings} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.headerRow}>
            <ThemedText type="subtitle">Your savings</ThemedText>
            <Pressable
              onPress={() => setSettingsOpen(true)}
              hitSlop={Spacing.three}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Feather name="settings" size={24} color={theme.textSecondary} />
            </Pressable>
          </ThemedView>

          {error && (
            <ThemedView style={styles.errorBlock}>
              <ThemedText
                type="small"
                accessibilityRole="alert"
                style={[styles.error, { color: theme.destructive }]}
              >
                {error}
              </ThemedText>
              <Pressable
                onPress={retry}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel="Retry loading your stats"
                style={({ pressed }) => pressed && styles.pressed}
              >
                <ThemedText type="linkPrimary" style={styles.error}>
                  Try again
                </ThemedText>
              </Pressable>
            </ThemedView>
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
                    {stats.counts.eaten}{' '}
                    {stats.counts.eaten === 1 ? 'item' : 'items'} eaten
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <UsageChart weekly={stats.weekly} />

              {stats.categories.length > 0 && (
                <CategoryInsights categories={stats.categories} />
              )}

              {kitchenCount > 0 && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="smallBold">
                    {kitchenCount} {kitchenCount === 1 ? 'item' : 'items'} in
                    your kitchen
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    A quick check-in keeps your savings up to date.
                  </ThemedText>
                  <Button
                    title="Check in on your kitchen"
                    onPress={() => router.push('/inventory')}
                  />
                </ThemedView>
              )}
            </>
          ) : (
            <ThemedView style={styles.emptyState}>
              <ThemedView
                style={[
                  styles.emptyIcon,
                  { backgroundColor: `${theme.primary}1A` },
                ]}
              >
                <Feather name="camera" size={28} color={theme.primary} />
              </ThemedView>
              <ThemedText type="smallBold" style={styles.emptyTitle}>
                Snap your first receipt
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.emptyText}
              >
                Broccoli turns receipts into a kitchen inventory, nudges you
                before food expires, and shows you the money you keep.
              </ThemedText>
              <Button
                title="Snap a receipt"
                onPress={() => router.push('/capture')}
                style={styles.emptyButton}
              />
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
    flexGrow: 1,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hero: {
    borderRadius: 14, // prototype 05's hero radius
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  // Prototype 05's hero label: 11px uppercase, tracked, quiet paper.
  heroLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1.8, // ~0.16em at 11px
  },
  badge: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  heroCaption: {
    textAlign: 'center',
  },
  errorBlock: {
    gap: Spacing.one,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  emptyButton: {
    alignSelf: 'stretch',
    marginTop: Spacing.two,
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
