import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from 'broccoli-api/router';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { trpc } from '@/lib/trpc';

export type StatsOverview = inferRouterOutputs<AppRouter>['stats']['overview'];

// Dashboard numbers, refetched whenever Home gains focus — same pattern as
// useInventory, so a capture or check-in on another tab shows up on return.
export function useStats() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = useRef(0);

  const load = useCallback(async () => {
    const thisRun = ++run.current;
    try {
      const data = await trpc.stats.overview.query();
      if (run.current !== thisRun) return;
      setStats(data);
      setError(null);
    } catch {
      if (run.current !== thisRun) return;
      setError("Couldn't load your stats.");
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

  return { stats, error };
}
