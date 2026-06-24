import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MAX_COOKBOOKS, useCookbook } from '@/lib/cookbook/context';
import { RECIPES_BY_ID } from '@/lib/plan/recipes';

type Props = {
  /** The dish being saved, or null when the sheet is closed. */
  recipeId: string | null;
  onClose: () => void;
};

/** Bottom-sheet overlay to save a dish into one or more cookbooks. */
export function SaveToCookbookSheet({ recipeId, onClose }: Props) {
  const theme = useTheme();
  const { cookbooks, toggleDish, createCookbook } = useCookbook();
  const [newName, setNewName] = useState('');

  if (!recipeId) return null;
  const recipe = RECIPES_BY_ID[recipeId];

  const atCap = cookbooks.length >= MAX_COOKBOOKS;

  const onCreate = () => {
    const id = createCookbook(newName);
    if (id) {
      toggleDish(id, recipeId);
      setNewName('');
    }
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} accessibilityLabel="Close" onPress={onClose} />
      <ThemedView style={styles.sheet}>
        <ThemedText type="subtitle">Save to cookbook</ThemedText>
        {recipe && (
          <ThemedText type="small" themeColor="textSecondary">
            {recipe.emoji} {recipe.title}
          </ThemedText>
        )}

        <View style={styles.list}>
          {cookbooks.map((cb) => {
            const saved = cb.recipeIds.includes(recipeId);
            return (
              <Pressable
                key={cb.id}
                accessibilityRole="button"
                accessibilityState={{ selected: saved }}
                onPress={() => toggleDish(cb.id, recipeId)}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.rowBody}>
                  <ThemedText type="smallBold">{cb.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {cb.recipeIds.length} dish{cb.recipeIds.length === 1 ? '' : 'es'}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" themeColor={saved ? 'tint' : 'textSecondary'}>
                  {saved ? '✓ Saved' : '+ Save'}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {atCap ? (
          <ThemedText type="small" themeColor="textSecondary">
            You&apos;ve reached the limit of {MAX_COOKBOOKS} cookbooks.
          </ThemedText>
        ) : (
          <View style={styles.createRow}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="New cookbook name…"
              placeholderTextColor={theme.textSecondary}
              onSubmitEditing={onCreate}
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            />
            <Pressable
              accessibilityRole="button"
              onPress={onCreate}
              style={({ pressed }) => [
                styles.createButton,
                { backgroundColor: theme.tint },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" themeColor="onTint">
                Create
              </ThemedText>
            </Pressable>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" themeColor="tint">
            Done
          </ThemedText>
        </Pressable>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    gap: Spacing.three,
  },
  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  rowBody: { gap: Spacing.half },
  createRow: {
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
  createButton: {
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  doneButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: { opacity: 0.7 },
});
