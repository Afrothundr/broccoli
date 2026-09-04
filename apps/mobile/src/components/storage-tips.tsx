import { Feather } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { StorageTips } from '@/hooks/use-storage-tips';
import { useTheme } from '@/hooks/use-theme';

// "Keep it fresh" card (beta feedback 2026-09-04): sits right under the
// savings hero, turning the 1/3-waste statistic into something actionable —
// advice about the food actually in the user's kitchen, plus a nudge about
// what keeps ending up in the trash. Server supplies up to four tips
// (FoodKeeper backfill or LLM copy); nothing renders while empty.
export function StorageTips({ tips }: { tips: StorageTips['tips'] }) {
  const theme = useTheme();
  if (!tips || tips.length === 0) return null;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Keep it fresh</ThemedText>
      {tips.map((tip) => (
        <ThemedView key={tip.title + tip.detail} style={styles.tipRow}>
          <ThemedView
            style={[
              styles.tipIcon,
              {
                backgroundColor:
                  tip.tag === 'waste' ? `${theme.amber}33` : `${theme.floret}26`,
              },
            ]}>
            <Feather
              name={tip.tag === 'waste' ? 'trash-2' : 'droplet'}
              size={14}
              color={tip.tag === 'waste' ? theme.amber : theme.statusGood}
            />
          </ThemedView>
          <ThemedView style={styles.tipText}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {tip.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {tip.detail}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flexShrink: 1,
    gap: 1,
    backgroundColor: 'transparent',
  },
});
