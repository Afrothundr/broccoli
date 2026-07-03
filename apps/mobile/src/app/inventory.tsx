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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { InventoryItem, useInventory } from '@/hooks/use-inventory';

// purchasedAt is typed Date but arrives as an ISO string over plain-JSON tRPC.
function formatDate(value: Date | string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type Section = { key: string; title: string; data: InventoryItem[] };

// Items arrive newest-receipt-first; group consecutive rows by receipt so each
// section reads "Whole Foods Market · Jun 28".
function toSections(items: InventoryItem[]): Section[] {
  const sections: Section[] = [];
  for (const item of items) {
    const last = sections[sections.length - 1];
    if (last?.key === item.receiptId) {
      last.data.push(item);
      continue;
    }
    const date = formatDate(item.receipt.purchasedAt);
    const store = item.receipt.storeName ?? 'Receipt';
    sections.push({
      key: item.receiptId,
      title: date ? `${store} · ${date}` : store,
      data: [item],
    });
  }
  return sections;
}

function ItemRow({ item }: { item: InventoryItem }) {
  const [expanded, setExpanded] = useState(false);
  const quantity = item.quantity > 1 || item.unit ? `${item.quantity} ${item.unit}`.trim() : null;

  return (
    <Pressable onPress={() => setExpanded((v) => !v)}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <ThemedView type="backgroundElement" style={styles.rowMain}>
          <ThemedText type="small" style={styles.rowName} numberOfLines={expanded ? undefined : 1}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {item.price != null ? `$${item.price.toFixed(2)}` : ''}
          </ThemedText>
        </ThemedView>
        {expanded && (
          <ThemedView type="backgroundElement" style={styles.rowDetail}>
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
  const { items, error, refreshing, refresh } = useInventory();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Your groceries</ThemedText>

        {error && (
          <ThemedText type="small" style={styles.error}>
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
            keyExtractor={(item) => item.id}
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
            renderItem={({ item }) => <ItemRow item={item} />}
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
  rowDetail: {
    gap: Spacing.half,
    paddingBottom: Spacing.one,
  },
  error: {
    color: '#e5484d',
    textAlign: 'center',
  },
});
