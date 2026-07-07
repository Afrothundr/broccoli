import { Feather } from '@expo/vector-icons';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from 'broccoli-api/router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { trpc } from '@/lib/trpc';

type Settings = inferRouterOutputs<AppRouter>['push']['getSettings'];

// 21 → "9 PM", 0 → "12 AM", 12 → "12 PM".
function hour12(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${period}`;
}

// Vertical hitSlop brings the +/− targets up to comfortable size; horizontal
// stays small so the two targets never overlap across the stepper's 8px gaps.
const stepperHitSlop = {
  top: Spacing.three,
  bottom: Spacing.three,
  left: Spacing.one,
  right: Spacing.one,
};

function HourStepper({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={styles.stepper}>
      <Pressable
        onPress={() => onChange((value + 23) % 24)}
        hitSlop={stepperHitSlop}
        accessibilityRole="button"
        accessibilityLabel="One hour earlier"
        style={({ pressed }) => pressed && styles.pressed}>
        <Feather name="minus" size={16} color={theme.textSecondary} />
      </Pressable>
      <ThemedText type="small" style={styles.stepperValue}>
        {hour12(value)}
      </ThemedText>
      <Pressable
        onPress={() => onChange((value + 1) % 24)}
        hitSlop={stepperHitSlop}
        accessibilityRole="button"
        accessibilityLabel="One hour later"
        style={({ pressed }) => pressed && styles.pressed}>
        <Feather name="plus" size={16} color={theme.textSecondary} />
      </Pressable>
    </ThemedView>
  );
}

// Nudge preferences (PRD Pillar 4: welcome, not annoying): the on/off switch
// and quiet hours. Optimistic updates — the switch flips immediately and
// reverts if the save fails. Renders nothing until settings load (and stays
// hidden if the api doesn't have the push surface yet).
export function NudgeSettings() {
  const theme = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    trpc.push.getSettings
      .query()
      .then((s) => active && setSettings(s))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!settings) return null;

  const update = (patch: Partial<Pick<Settings, 'nudgesEnabled' | 'quietHoursStart' | 'quietHoursEnd'>>) => {
    const previous = settings;
    setSettings({ ...settings, ...patch });
    setError(null);
    trpc.push.updateSettings
      .mutate(patch)
      .then(setSettings)
      .catch(() => {
        setSettings(previous);
        setError("Couldn't save — try again.");
      });
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <ThemedText type="smallBold">Nudges</ThemedText>
        <Switch
          value={settings.nudgesEnabled}
          onValueChange={(nudgesEnabled) => update({ nudgesEnabled })}
          trackColor={{ true: theme.primary }}
          accessibilityLabel="Nudges"
        />
      </ThemedView>
      {settings.nudgesEnabled && (
        <ThemedView type="backgroundElement" style={styles.row}>
          <ThemedText type="small" themeColor="textSecondary">
            Quiet hours
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.quietControls}>
            <HourStepper
              value={settings.quietHoursStart}
              onChange={(quietHoursStart) => update({ quietHoursStart })}
            />
            <ThemedText type="small" themeColor="textSecondary">
              to
            </ThemedText>
            <HourStepper
              value={settings.quietHoursEnd}
              onChange={(quietHoursEnd) => update({ quietHoursEnd })}
            />
          </ThemedView>
        </ThemedView>
      )}
      {error && (
        <ThemedText type="small" style={{ color: theme.destructive }}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quietControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  stepperValue: {
    minWidth: 44,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
