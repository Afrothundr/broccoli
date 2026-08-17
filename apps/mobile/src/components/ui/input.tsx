import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// The app's one text field, shadcn-inspired (styling epic 3nl.4): bordered,
// quiet background, themed placeholder. Replaces the per-screen input styles.
//
// The placeholder doubles as the accessibility label by default: a placeholder
// disappears once the field is filled, so without this a screen reader hears
// an unnamed text field everywhere a visual label was skipped.
export function Input({ style, onFocus, onBlur, accessibilityLabel, ...rest }: TextInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      accessibilityLabel={accessibilityLabel ?? rest.placeholder}
      placeholderTextColor={theme.textSecondary}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        styles.input,
        {
          color: theme.text,
          backgroundColor: theme.background,
          borderColor: focused ? theme.primary : theme.border,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two, // dashboard --radius: 8px
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
});
