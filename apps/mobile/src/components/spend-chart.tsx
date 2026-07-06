import { useState } from 'react';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { StatsOverview } from '@/hooks/use-stats';

// Weekly spend vs wasted, paired bars, one shared $ axis. Series colors were
// chosen with the dataviz palette validator (CVD-checked per theme):
//   spend  — brand green (#4A7A34 light / #5E9943 dark)
//   wasted — #DC2626 in BOTH themes (the dark-theme destructive #F87171 fails
//            the mark lightness band; #DC2626 passes both, deutan ΔE 16.9 dark)
// Light-mode CVD sits in the floor band (11.7), so identity never rides on
// color alone: fixed pair order (spend left), 2px gaps, a legend, and
// tap-to-read exact values.
const SERIES = {
  light: { spend: '#4A7A34', wasted: '#DC2626' },
  dark: { spend: '#5E9943', wasted: '#DC2626' },
};

const CHART_HEIGHT = 120;

type Week = StatsOverview['weekly'][number];

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function weekLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function SpendChart({ weekly }: { weekly: Week[] }) {
  const scheme = useColorScheme();
  const colors = SERIES[scheme === 'dark' ? 'dark' : 'light'];
  // Start on the latest week that has anything to say.
  const lastActive = weekly.reduce(
    (best, w, i) => (w.spend > 0 || w.wasted > 0 ? i : best),
    weekly.length - 1
  );
  const [selected, setSelected] = useState(lastActive);

  const max = Math.max(...weekly.map((w) => Math.max(w.spend, w.wasted)), 1);
  const barHeight = (value: number) =>
    value > 0 ? Math.max((value / max) * CHART_HEIGHT, 3) : 0;

  const current = weekly[selected];
  const hasAny = weekly.some((w) => w.spend > 0 || w.wasted > 0);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView type="backgroundElement" style={styles.legend}>
        <ThemedView style={[styles.legendDot, { backgroundColor: colors.spend }]} />
        <ThemedText type="small" themeColor="textSecondary">
          Spent
        </ThemedText>
        <ThemedView style={[styles.legendDot, { backgroundColor: colors.wasted }]} />
        <ThemedText type="small" themeColor="textSecondary">
          Wasted
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.plot}>
        {weekly.map((week, index) => (
          <Pressable key={week.weekStart} onPress={() => setSelected(index)} style={styles.group}>
            <ThemedView type="backgroundElement" style={styles.bars}>
              <ThemedView
                style={[styles.bar, { height: barHeight(week.spend), backgroundColor: colors.spend }]}
              />
              <ThemedView
                style={[styles.bar, { height: barHeight(week.wasted), backgroundColor: colors.wasted }]}
              />
            </ThemedView>
            <ThemedView
              style={[styles.selector, index === selected && styles.selectorOn]}
              type={index === selected ? 'backgroundSelected' : 'backgroundElement'}
            />
          </Pressable>
        ))}
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.axis}>
        <ThemedText type="small" themeColor="textSecondary">
          {weekLabel(weekly[0].weekStart)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {weekLabel(weekly[weekly.length - 1].weekStart)}
        </ThemedText>
      </ThemedView>

      <ThemedText type="small" themeColor="textSecondary" style={styles.caption}>
        {hasAny
          ? `Week of ${weekLabel(current.weekStart)} — ${money(current.spend)} spent · ${money(current.wasted)} wasted`
          : 'No activity in the last 8 weeks yet.'}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.one,
  },
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT + 10,
  },
  group: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.one,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2, // surface gap between paired marks
    height: CHART_HEIGHT,
  },
  bar: {
    width: 9,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  selector: {
    height: 3,
    alignSelf: 'stretch',
    marginHorizontal: Spacing.one,
    borderRadius: 2,
  },
  selectorOn: {
    height: 3,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caption: {
    textAlign: 'center',
  },
});
