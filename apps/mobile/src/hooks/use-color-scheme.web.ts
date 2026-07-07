import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// To support static rendering, this value needs to be re-calculated on the
// client side for web: the server snapshot is `false`, so SSR always renders
// the light scheme, and the first client render swaps in the real one.
const subscribe = () => () => {};
const useHasHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

export function useColorScheme() {
  const hasHydrated = useHasHydrated();
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
