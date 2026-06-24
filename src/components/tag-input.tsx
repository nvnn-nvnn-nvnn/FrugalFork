import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Optional quick-add chips shown when relevant. */
  suggestions?: string[];
};

/**
 * A free-text "add to a list" control: type → Add → chip. Tap a chip to remove.
 * Shared by onboarding (favorite / usual meals) and the staples screen.
 */
export function TagInput({ value, onChange, placeholder, suggestions = [] }: Props) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const item = raw.trim().toLowerCase();
    if (!item || value.includes(item)) {
      setDraft('');
      return;
    }
    onChange([...value, item]);
    setDraft('');
  };

  const remove = (item: string) => onChange(value.filter((v) => v !== item));

  const openSuggestions = suggestions.filter((s) => !value.includes(s));

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => add(draft)}
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => add(draft)}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: theme.tint },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" themeColor="onTint">
            Add
          </ThemedText>
        </Pressable>
      </View>

      {value.length > 0 && (
        <View style={styles.chips}>
          {value.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityHint="Remove"
              onPress={() => remove(item)}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="small">{item}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                ✕
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      {openSuggestions.length > 0 && (
        <View style={styles.chips}>
          {openSuggestions.map((hint) => (
            <Pressable
              key={hint}
              accessibilityRole="button"
              onPress={() => add(hint)}
              style={({ pressed }) => [
                styles.suggestionChip,
                { borderColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="small" themeColor="textSecondary">
                + {hint}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    fontSize: 16,
    fontFamily: Fonts?.sans,
  },
  addButton: {
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
