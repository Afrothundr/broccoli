import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from 'broccoli-api/router';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { trpc } from '@/lib/trpc';

// One row of item.list — an ACTIVE item with its receipt's store/date context.
export type InventoryItem = inferRouterOutputs<AppRouter>['item']['list'][number];

// Loads the caller's inventory, refetching every time the screen gains focus —
// that's what keeps the list current after a save on Capture or a check-in
// swipe, without any cross-screen wiring. Same stale-run guard as
// useReceiptParse: bumping `run` invalidates in-flight loads.
export function useInventory() {
  const [items, setItems] = useState<InventoryItem[] | null>(null); // null = first load
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const run = useRef(0);

  const load = useCallback(async () => {
    const thisRun = ++run.current;
    try {
      const data = await trpc.item.list.query();
      if (run.current !== thisRun) return;
      setItems(data);
      setError(null);
    } catch {
      if (run.current !== thisRun) return;
      setError("Couldn't load your items. Pull down to retry.");
    } finally {
      if (run.current === thisRun) setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        run.current++;
      };
    }, [load])
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  return { items, error, refreshing, refresh };
}
