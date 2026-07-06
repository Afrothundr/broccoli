import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckInDeck } from '@/components/check-in-deck';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { InventoryItem, useInventory } from '@/hooks/use-inventory';
import { useTheme } from '@/hooks/use-theme';
import { estimateFreshness, Freshness, storageLabel } from '@/lib/freshness';
import { trpc } from '@/lib/trpc';

// purchasedAt is typed Date but arrives as an ISO string over plain-JSON tRPC.
function formatDate(value: Date | string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type Row = { item: InventoryItem; freshness: Freshness | null };
type Section = { key: string; title: string; data: Row[] };

// Urgent items ("use soon" or past their estimate) get lifted into a single
// section on top, most urgent first; everything else stays grouped by receipt
// ("Whole Foods Market · Jun 28"), newest receipt first.
function toSections(items: InventoryItem[]): Section[] {
  const rows: Row[] = items.map((item) => ({ item, freshness: estimateFreshness(item) }));

  const urgent = rows
    .filter((r) => r.freshness !== null && r.freshness.level !== 'good')
    .sort((a, b) => a.freshness!.daysLeft - b.freshness!.daysLeft);
  const urgentIds = new Set(urgent.map((r) => r.item.id));

  const sections: Section[] = urgent.length
    ? [{ key: 'use-first', title: 'Use first (estimated)', data: urgent }]
    : [];

  for (const row of rows) {
    if (urgentIds.has(row.item.id)) continue;
    const last = sections[sections.length - 1];
    if (last?.key === row.item.receiptId) {
      last.data.push(row);
      continue;
    }
    const date = formatDate(row.item.receipt.purchasedAt);
    const store = row.item.receipt.storeName ?? 'Receipt';
    sections.push({
      key: row.item.receiptId,
      title: date ? `${store} · ${date}` : store,
      data: [row],
    });
  }
  return sections;
}

function FreshnessChip({ freshness }: { freshness: Freshness }) {
  const theme = useTheme();
  const color =
    freshness.level === 'bad'
      ? theme.statusBad
      : freshness.level === 'warn'
        ? theme.statusWarn
        : theme.statusGood;

  return (
    // 8-digit hex: chip background is the status color at ~10% opacity.
    <ThemedView style={[styles.chip, { backgroundColor: `${color}1A` }]}>
      <ThemedText type="small" style={{ color }}>
        {freshness.chip}
      </ThemedText>
    </ThemedView>
  );
}

const LOCATIONS = ['PANTRY', 'FRIDGE', 'FREEZER'] as const;
const ADJUSTMENTS: { label: string; days: number }[] = [
  { label: '−1d', days: -1 },
  { label: '+1d', days: 1 },
  { label: '+3d', days: 3 },
  { label: '+1w', days: 7 },
];

function ItemRow({ item, freshness, onChanged }: Row & { onChanged: () => void }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const quantity = item.quantity > 1 || item.unit ? `${item.quantity} ${item.unit}`.trim() : null;

  // Nudge the expiration date ("fine until Friday"): USER-sourced, relative to
  // the current estimate (or today when the item has none).
  const adjustBy = async (days: number) => {
    if (busy) return;
    setBusy(true);
    setRowError(null);
    const base = item.expiresAt ? new Date(item.expiresAt) : new Date();
    const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    try {
      await trpc.item.adjustExpiration.mutate({ id: item.id, expiresAt });
      onChanged();
    } catch {
      setRowError("Couldn't save the new date. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // "I froze that" — recomputes the estimate for the new location server-side.
  const setLocation = async (storageLocation: (typeof LOCATIONS)[number]) => {
    if (busy || item.storageLocation === storageLocation) return;
    setBusy(true);
    setRowError(null);
    try {
      await trpc.item.setStorageLocation.mutate({ id: item.id, storageLocation });
      onChanged();
    } catch {
      setRowError("Couldn't change the location. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const expiresLine = [
    item.expiresAt ? `Expires ${formatDate(item.expiresAt)}` : null,
    storageLabel(item.storageLocation),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable onPress={() => setExpanded((v) => !v)}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <ThemedView type="backgroundElement" style={styles.rowMain}>
          <ThemedText type="small" style={styles.rowName} numberOfLines={expanded ? undefined : 1}>
            {item.name}
          </ThemedText>
          {freshness?.chip != null && <FreshnessChip freshness={freshness} />}
          <ThemedText type="small" themeColor="textSecondary">
            {item.price != null ? `$${item.price.toFixed(2)}` : ''}
          </ThemedText>
        </ThemedView>
        {expanded && (
          <ThemedView type="backgroundElement" style={styles.rowDetail}>
            {freshness && (
              <ThemedText type="small" themeColor="textSecondary">
                {freshness.detail}
              </ThemedText>
            )}
            {expiresLine.length > 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                {expiresLine}
              </ThemedText>
            )}

            <ThemedView type="backgroundElement" style={styles.controlRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Adjust date
              </ThemedText>
              {ADJUSTMENTS.map(({ label, days }) => (
                <Pressable key={label} onPress={() => adjustBy(days)} disabled={busy}>
                  <ThemedView type="backgroundSelected" style={styles.controlChip}>
                    <ThemedText type="small">{label}</ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.controlRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Location
              </ThemedText>
              {LOCATIONS.map((location) => {
                const selected = item.storageLocation === location;
                return (
                  <Pressable key={location} onPress={() => setLocation(location)} disabled={busy}>
                    <ThemedView
                      type={selected ? 'backgroundSelected' : 'backgroundElement'}
                      style={[styles.controlChip, !selected && styles.controlChipGhost]}>
                      <ThemedText
                        type="small"
                        themeColor={selected ? 'text' : 'textSecondary'}>
                        {storageLabel(location)}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </ThemedView>

            {rowError && (
              <ThemedText type="small" style={{ color: theme.statusBad }}>
                {rowError}
              </ThemedText>
            )}
            {item.category && (
              <ThemedText type="small" themeColor="textSecondary">
                {item.category}
              </ThemedText>
            )}
            {quantity && (
              <ThemedText type="small" themeColor="textSecondary">
                Quantity: {quantity}
              </ThemedText>
            )}
            <ThemedText type="small" themeColor="textSecondary">
              Added {formatDate(item.createdAt) ?? 'recently'}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </Pressable>
  );
}

export default function InventoryScreen() {
  const theme = useTheme();
  const { items, error, refreshing, refresh, reload } = useInventory();
  const [checkingIn, setCheckingIn] = useState(false);

  // The daily check-in takes over the screen (same pattern as capture →
  // review); closing it refetches so resolved items drop out of the list.
  if (checkingIn && items && items.length > 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <CheckInDeck
            items={items}
            onClose={() => {
              setCheckingIn(false);
              refresh();
            }}
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Your groceries</ThemedText>

        {items !== null && items.length > 0 && (
          <Button title="Daily check-in" onPress={() => setCheckingIn(true)} />
        )}

        {error && (
          <ThemedText type="small" style={[styles.error, { color: theme.destructive }]}>
            {error}
          </ThemedText>
        )}

        {items === null ? (
          <ThemedView style={styles.center}>
            <ActivityIndicator />
          </ThemedView>
        ) : items.length === 0 ? (
          <ThemedView style={styles.center}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
              Nothing here yet.
            </ThemedText>
            <Link href="/capture">
              <ThemedText type="linkPrimary">Snap a receipt to get started</ThemedText>
            </Link>
          </ThemedView>
        ) : (
          <SectionList
            sections={toSections(items)}
            keyExtractor={(row) => row.item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            renderSectionHeader={({ section }) => (
              <ThemedView style={styles.sectionHeader}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {section.title}
                </ThemedText>
              </ThemedView>
            )}
            renderItem={({ item: row }) => <ItemRow {...row} onChanged={() => void reload()} />}
            stickySectionHeadersEnabled={false}
          />
        )}
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
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'stretch',
    width: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
  list: {
    alignSelf: 'stretch',
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  sectionHeader: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  row: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowName: {
    flex: 1,
  },
  chip: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  rowDetail: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  controlChip: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  controlChipGhost: {
    opacity: 0.7,
  },
  error: {
    textAlign: 'center',
  },
});
