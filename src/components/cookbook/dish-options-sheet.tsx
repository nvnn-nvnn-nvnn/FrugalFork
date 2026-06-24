import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type Cookbook } from '@/lib/cookbook/context';
import { RECIPES_BY_ID } from '@/lib/plan/recipes';

type Props = {
  /** The dish being acted on, or null when closed. */
  recipeId: string | null;
  /** Cookbooks this dish could be moved to (everything except the current one). */
  moveTargets: Cookbook[];
  onClose: () => void;
  onView: () => void;
  onRemove: () => void;
  onMove: (targetCookbookId: string) => void;
};

/**
 * Long-press options for a dish in a cookbook. Removing (and moving to another
 * cookbook) live here, behind a deliberate hold, so the list has no easy-to-
 * mis-tap "✕".
 */
export function DishOptionsSheet({ recipeId, moveTargets, onClose, onView, onRemove, onMove }: Props) {
  const theme = useTheme();
  const [moving, setMoving] = useState(false);

  if (!recipeId) return null;
  const recipe = RECIPES_BY_ID[recipeId];
  const canMove = moveTargets.length > 0;

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} accessibilityLabel="Close" onPress={onClose} />
        <ThemedView style={styles.sheet}>
          {recipe && (
            <View style={styles.head}>
              <ThemedText style={styles.emoji}>{recipe.emoji}</ThemedText>
              <ThemedText type="subtitle" numberOfLines={1} style={styles.title}>
                {recipe.title}
              </ThemedText>
            </View>
          )}

          {moving ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => setMoving(false)}
                style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  ‹ Move to another cookbook
                </ThemedText>
              </Pressable>

              <ScrollView style={styles.targetScroll} showsVerticalScrollIndicator={false}>
                {moveTargets.map((cb) => (
                  <Pressable
                    key={cb.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Move to ${cb.name}`}
                    onPress={() => onMove(cb.id)}
                    style={({ pressed }) => [
                      styles.action,
                      styles.targetRow,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold" numberOfLines={1} style={styles.targetName}>
                      {cb.icon ? `${cb.icon} ` : ''}
                      {cb.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {cb.recipeIds.length}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={onView}
                style={({ pressed }) => [
                  styles.action,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold">View recipe</ThemedText>
              </Pressable>

              {canMove && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setMoving(true)}
                  style={({ pressed }) => [
                    styles.action,
                    { backgroundColor: theme.backgroundElement },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold">Move to another cookbook</ThemedText>
                </Pressable>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={onRemove}
                style={({ pressed }) => [
                  styles.action,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" themeColor="tint">
                  Remove from cookbook
                </ThemedText>
              </Pressable>
            </>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Cancel
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
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
    paddingBottom: Spacing.five,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    gap: Spacing.two,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  emoji: { fontSize: 30, lineHeight: 36 },
  title: { flex: 1 },
  backRow: {
    paddingVertical: Spacing.one,
  },
  targetScroll: {
    maxHeight: 220,
  },
  action: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  targetName: { flex: 1 },
  cancel: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  pressed: { opacity: 0.7 },
});
