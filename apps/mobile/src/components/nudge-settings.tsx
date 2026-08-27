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
type MealWindow = inferRouterOutputs<AppRouter>['mealWindows']['list'][number];

// 21 → "9 PM" (or "21:00" where the locale prefers 24-hour time).
function formatHour(h: number): string {
  return new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: 'numeric' });
}

// A quiet window that starts and ends at the same hour is degenerate — the
// api treats it as "no quiet hours", which silently contradicts what the UI
// shows. Stepping onto the other endpoint hops one further in the same
// direction instead of landing on it.
function skipCollision(next: number, current: number, other: number): number {
  if (next !== other) return next;
  const direction = (next - current + 24) % 24 === 1 ? 1 : -1;
  return (next + direction + 24) % 24;
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
        {formatHour(value)}
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
        <ThemedView type="backgroundElement" style={styles.labelColumn}>
          <ThemedText type="smallBold">Nudges</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            A heads-up before food expires.
          </ThemedText>
        </ThemedView>
        <Switch
          value={settings.nudgesEnabled}
          onValueChange={(nudgesEnabled) => update({ nudgesEnabled })}
          trackColor={{ true: theme.primary }}
          accessibilityLabel="Nudges"
        />
      </ThemedView>
      {settings.nudgesEnabled && (
        <ThemedView type="backgroundElement" style={styles.quietSection}>
          <ThemedView type="backgroundElement" style={styles.row}>
            <ThemedText type="small" themeColor="textSecondary">
              Quiet hours
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.quietControls}>
              <HourStepper
                value={settings.quietHoursStart}
                onChange={(next) =>
                  update({ quietHoursStart: skipCollision(next, settings.quietHoursStart, settings.quietHoursEnd) })
                }
              />
              <ThemedText type="small" themeColor="textSecondary">
                to
              </ThemedText>
              <HourStepper
                value={settings.quietHoursEnd}
                onChange={(next) =>
                  update({ quietHoursEnd: skipCollision(next, settings.quietHoursEnd, settings.quietHoursStart) })
                }
              />
            </ThemedView>
          </ThemedView>
          <ThemedText type="small" themeColor="textSecondary">
            Nudges hold during these hours and arrive after they end.
          </ThemedText>
        </ThemedView>
      )}
      {error && (
        <ThemedText type="small" accessibilityRole="alert" style={{ color: theme.destructive }}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Meal reminders (PRD Pillar 4): three opt-in meal-time prompts. Each meal has
// an on/off switch, an hour stepper (whole hours, matching the quiet-hours
// controls), and day-of-week chips. Optimistic updates like NudgeSettings.
// ---------------------------------------------------------------------------

const MEAL_LABELS: Record<MealWindow['meal'], string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
};
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // index 0 = Sunday
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function DayChip({
  day,
  selected,
  onToggle,
}: {
  day: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={stepperHitSlop}
      accessibilityRole="button"
      accessibilityLabel={DAY_LETTERS[day]}
      accessibilityState={{ selected }}
      style={[styles2.chip, selected && { backgroundColor: theme.primary }]}>
      <ThemedText
        type="small"
        style={{ color: selected ? '#fff' : theme.textSecondary }}>
        {DAY_LETTERS[day]}
      </ThemedText>
    </Pressable>
  );
}

function MealRow({
  meal,
  onChange,
}: {
  meal: MealWindow;
  onChange: (meal: MealWindow, patch: Partial<MealWindow>) => void;
}) {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<Pick<MealWindow, 'enabled' | 'hour' | 'days'>>) => {
    const next = { ...meal, ...patch };
    if (next.enabled && next.days.length === 0) {
      setError('Pick at least one day.');
      return;
    }
    setError(null);
    onChange(meal, patch);
  };

  return (
    <ThemedView type="backgroundElement" style={styles2.mealRow}>
      <ThemedView type="backgroundElement" style={styles2.mealHeader}>
        <ThemedText type="smallBold">{MEAL_LABELS[meal.meal]}</ThemedText>
        <Switch
          value={meal.enabled}
          onValueChange={(enabled) => update({ enabled })}
          trackColor={{ true: theme.primary }}
          accessibilityLabel={`${MEAL_LABELS[meal.meal]} reminder`}
        />
      </ThemedView>
      {meal.enabled && (
        <>
          <ThemedView type="backgroundElement" style={styles2.mealControls}>
            <HourStepper value={meal.hour} onChange={(hour) => update({ hour })} />
            <ThemedView type="backgroundElement" style={styles2.chipRow}>
              {ALL_DAYS.map((day) => (
                <DayChip
                  key={day}
                  day={day}
                  selected={meal.days.includes(day)}
                  onToggle={() =>
                    update({
                      days: meal.days.includes(day)
                        ? meal.days.filter((d) => d !== day)
                        : [...meal.days, day].sort(),
                    })
                  }
                />
              ))}
            </ThemedView>
          </ThemedView>
          <ThemedText type="small" themeColor="textSecondary">
            {MEAL_LABELS[meal.meal]} at {formatHour(meal.hour)} — what to eat first.
          </ThemedText>
        </>
      )}
      {error && (
        <ThemedText type="small" accessibilityRole="alert" style={{ color: theme.destructive }}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

// Meal rows apply changes optimistically (switch flips immediately) and
// reconcile with the server list if the save fails.
export function MealReminders() {
  const [meals, setMeals] = useState<MealWindow[] | null>(null);

  useEffect(() => {
    let active = true;
    trpc.mealWindows.list
      .query()
      .then((rows) => active && setMeals(rows))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const applyOptimistic = (meal: MealWindow, patch: Partial<MealWindow>) => {
    setMeals((prev) =>
      prev ? prev.map((m) => (m.meal === meal.meal ? { ...m, ...patch } : m)) : prev
    );
    trpc.mealWindows.upsert
      .mutate({
        meal: meal.meal,
        enabled: patch.enabled ?? meal.enabled,
        hour: patch.hour ?? meal.hour,
        days: patch.days ?? meal.days,
      })
      .catch(() => {
        trpc.mealWindows.list
          .query()
          .then(setMeals)
          .catch(() => {});
      });
  };

  if (!meals) return null;

  return (
    <ThemedView type="backgroundElement" style={styles2.card}>
      <ThemedView type="backgroundElement" style={styles2.labelColumn}>
        <ThemedText type="smallBold">Meal reminders</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          A nudge at meal times about what to eat first.
        </ThemedText>
      </ThemedView>
      {meals.map((meal) => (
        <MealRow key={meal.meal} meal={meal} onChange={applyOptimistic} />
      ))}
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
  labelColumn: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  quietSection: {
    gap: Spacing.two,
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

const styles2 = StyleSheet.create({
  card: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  labelColumn: {
    gap: Spacing.half,
  },
  mealRow: {
    gap: Spacing.two,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealControls: {
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  chip: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.two,
  },
});
