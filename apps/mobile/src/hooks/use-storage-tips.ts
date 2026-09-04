import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from 'broccoli-api/router';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { trpc } from '@/lib/trpc';

export type StorageTips = inferRouterOutputs<AppRouter>['advice']['storage'];

// Storage advice for the home screen, refetched on focus like useStats. A
// failure is silent — the tips card simply doesn't render, and the screen
// never turns an advice miss into an error state.
export function useStorageTips() {
  const [tips, setTips] = useState<StorageTips['tips'] | null>(null);
  const run = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const thisRun = ++run.current;
      trpc.advice.storage
        .query()
        .then((data) => {
          if (run.current === thisRun) setTips(data.tips);
        })
        .catch(() => {
          if (run.current === thisRun) setTips([]);
        });
      return () => {
        run.current++;
      };
    }, [])
  );

  return tips;
}
