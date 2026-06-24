import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCookbook } from '@/lib/cookbook/context';
import { recipeSatisfiesDiets } from '@/lib/plan/diets';
import { RECIPES_BY_ID } from '@/lib/plan/recipes';
import { useProfile } from '@/lib/profile/context';
import { WEEKDAYS } from '@/lib/week/dates';

type Props = {
  /** Which weekday (0=Sun..6=Sat) the dish will be added to. */
  day: number;
  /** Recipe ids already on that day (hidden from the dish list). */
  excludeIds: string[];
  onClose: () => void;
  onAdd: (recipeId: string) => void;
};

/**
 * Slide-up picker for the Plan's "Add from cookbook": first choose a cookbook,
 * then a dish from it. Rendered as a Modal so it floats above the screen.
 */
export function PlanAddSheet({ day, excludeIds, onClose, onAdd }: Props) {
  const theme = useTheme();
  const { profile } = useProfile();
  const { cookbooks } = useCookbook();
  const [cookbookId, setCookbookId] = useState<string | null>(null);

  const cookbook = cookbookId ? cookbooks.find((c) => c.id === cookbookId) : null;

  const dishes = cookbook
    ? cookbook.recipeIds
        .map((id) => RECIPES_BY_ID[id])
        .filter((r) => r && !excludeIds.includes(r.id) && recipeSatisfiesDiets(r, profile.diets))
    : [];

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} accessibilityLabel="Close" onPress={onClose} />
        <ThemedView style={styles.sheet}>
          <View style={styles.head}>
            {cookbook ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to cookbooks"
                onPress={() => setCookbookId(null)}
                style={({ pressed }) => [pressed && styles.pressed]}>
                <ThemedText type="subtitle">‹ {cookbook.name}</ThemedText>
              </Pressable>
            ) : (
              <ThemedText type="subtitle">Add to {WEEKDAYS[day]}</ThemedText>
            )}
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            {cookbook ? 'Pick a dish to add.' : 'Pick a cookbook.'}
          </ThemedText>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {!cookbook
              ? cookbooks.map((cb) => (
                  <Pressable
                    key={cb.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${cb.name}`}
                    onPress={() => setCookbookId(cb.id)}
                    style={({ pressed }) => [
                      styles.row,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <View style={[styles.iconTile, { backgroundColor: theme.background }]}>
                      <ThemedText style={styles.icon}>{cb.icon ?? '📕'}</ThemedText>
                    </View>
                    <View style={styles.rowBody}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {cb.name}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {cb.recipeIds.length} dish{cb.recipeIds.length === 1 ? '' : 'es'}
                      </ThemedText>
                    </View>
                    <ThemedText type="subtitle" themeColor="textSecondary" style={styles.chevron}>
                      ›
                    </ThemedText>
                  </Pressable>
                ))
              : dishes.length === 0
                ? (
                    <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement }]}>
                      <ThemedText type="small" themeColor="textSecondary">
                        No dishes to add here — everything&apos;s already on this day, or this
                        cookbook is empty.
                      </ThemedText>
                    </View>
                  )
                : dishes.map((recipe) => (
                    <Pressable
                      key={recipe!.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${recipe!.title}`}
                      onPress={() => {
                        onAdd(recipe!.id);
                        onClose();
                      }}
                      style={({ pressed }) => [
                        styles.row,
                        { backgroundColor: theme.backgroundElement },
                        pressed && styles.pressed,
                      ]}>
                      <View style={[styles.iconTile, { backgroundColor: theme.background }]}>
                        <ThemedText style={styles.icon}>{recipe!.emoji}</ThemedText>
                      </View>
                      <View style={styles.rowBody}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {recipe!.title}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          ${recipe!.cost.toFixed(2)} · {recipe!.calories} kcal
                        </ThemedText>
                      </View>
                      <ThemedText type="smallBold" themeColor="tint" style={styles.chevron}>
                        ＋
                      </ThemedText>
                    </Pressable>
                  ))}
          </ScrollView>

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
    maxHeight: '80%',
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    gap: Spacing.three,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scroll: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 24, lineHeight: 30 },
  rowBody: { flex: 1, gap: Spacing.half },
  chevron: { lineHeight: 28 },
  emptyCard: {
    borderRadius: Radius.md,
    padding: Spacing.four,
  },
  cancel: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: { opacity: 0.7 },
});
