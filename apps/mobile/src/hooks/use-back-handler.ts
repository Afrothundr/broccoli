import { useEffect } from 'react';
import { BackHandler } from 'react-native';

// Android hardware back for the app's take-over surfaces (settings, the
// check-in deck). They're state swaps rather than routes, so without this the
// back button exits the whole app instead of dismissing the takeover.
// No-ops on iOS, where BackHandler never fires.
export function useBackHandler(enabled: boolean, onBack: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true; // consumed — don't bubble up to "exit app"
    });
    return () => sub.remove();
  }, [enabled, onBack]);
}
