import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// The app's one text field, shadcn-inspired (styling epic 3nl.4): bordered,
// quiet background, themed placeholder. Replaces the per-screen input styles.
export function Input({ style, ...rest }: TextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      style={[
        styles.input,
        {
          color: theme.text,
          backgroundColor: theme.background,
          borderColor: theme.border,
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
