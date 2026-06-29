import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { CookbookSettingsSheet } from '@/components/cookbook/cookbook-settings-sheet';
import { DishOptionsSheet } from '@/components/cookbook/dish-options-sheet';
import { RecipeInputSheet } from '@/components/cookbook/recipe-input-sheet';
import { AddToPlanSheet } from '@/components/plan/add-to-plan-sheet';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_COOKBOOK_ID, type Cookbook, useCookbook } from '@/lib/cookbook/context';
import { usePlan } from '@/lib/plan/context';
import { RECIPES_BY_ID } from '@/lib/plan/recipes';
import { WEEKDAYS } from '@/lib/week/dates';

type Sort = 'recent' | 'az';

/**
 * The "Cookbook" tab in Decide. Top level is a **grid of cookbooks** (sortable);
 * tapping one opens its dishes, where each can be added to the weekly plan.
 * Creating / importing happens via the screen's CookbookFab.
 */
type Props = {
  /** Notifies the host which cookbook is open (null at the grid), so it can hide its FAB. */
  onOpenChange?: (cookbook: Cookbook | null) => void;
};

export function CookbookView({ onOpenChange }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const { cookbooks, toggleDish, moveDish } = useCookbook();
  const { addToBuilder } = usePlan();

  const [sort, setSort] = useState<Sort>('recent');
  const [openId, setOpenId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [optionsFor, setOptionsFor] = useState<string | null>(null);
  const [recipeMenuOpen, setRecipeMenuOpen] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);

  // "Add to plan" modal — which dish is being scheduled.
  const [planFor, setPlanFor] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 1800);
    return () => clearTimeout(timer);
  }, [flash]);

  const sorted = useMemo(() => {
    const list = [...cookbooks];
    if (sort === 'az') list.sort((a, b) => a.name.localeCompare(b.name));
    return list; // 'recent' keeps creation order (default first, newest last)
  }, [cookbooks, sort]);

  const open = openId ? cookbooks.find((c) => c.id === openId) : null;
  const tileWidth = gridWidth > 0 ? (gridWidth - Spacing.three) / 2 : 0;
  const onGridLayout = (e: LayoutChangeEvent) => setGridWidth(e.nativeEvent.layout.width);

  const openCookbook = (cb: Cookbook) => {
    setOpenId(cb.id);
    onOpenChange?.(cb);
  };

  const back = () => {
    setOpenId(null);
    setPlanFor(null);
    setSettingsOpen(false);
    onOpenChange?.(null);
  };

  const confirmPlan = (recipeId: string, title: string, day: number, servings: number) => {
    addToBuilder(recipeId, day, servings);
    setFlash(`Added ${title} to ${WEEKDAYS[day]} · ${servings} serving${servings > 1 ? 's' : ''}`);
  };

  const flashPill = flash && (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(160)}
      style={[styles.flash, Shadow, { backgroundColor: theme.tint }]}>
      <ThemedText type="smallBold" themeColor="onTint">
        {flash}
      </ThemedText>
    </Animated.View>
  );

  // ---- Open cookbook: its dishes -----------------------------------------
  if (open) {
    const personalized = open.id !== DEFAULT_COOKBOOK_ID;
    return (
      <View style={styles.wrapper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to cookbooks"
          onPress={back}
          style={({ pressed }) => [
            styles.backChip,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold">‹ Cookbooks</ThemedText>
        </Pressable>

        <View style={styles.detailHead}>
          <View style={styles.detailTitle}>
            <ThemedText type="subtitle" numberOfLines={1}>
              {open.icon ? `${open.icon} ` : ''}
              {open.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {open.recipeIds.length} dish{open.recipeIds.length === 1 ? '' : 'es'}
            </ThemedText>
          </View>
          {personalized && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cookbook settings"
              onPress={() => setSettingsOpen(true)}
              style={({ pressed }) => [
                styles.settingsButton,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                ⋯
              </ThemedText>
            </Pressable>
          )}
        </View>

        {flashPill}

        {open.recipeIds.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary">
              No dishes yet. Tap ＋ on a dish in Discover to save it here.
            </ThemedText>
          </View>
        ) : (
          open.recipeIds.map((recipeId) => {
            const recipe = RECIPES_BY_ID[recipeId];
            if (!recipe) return null;
            return (
              <Animated.View
                key={recipeId}
                layout={LinearTransition.springify().damping(18)}
                style={[styles.dishCard, Shadow, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.dishRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityHint="Opens the recipe. Hold for options."
                    onPress={() => router.push({ pathname: '/dish/[id]', params: { id: recipeId } })}
                    onLongPress={() => setOptionsFor(recipeId)}
                    style={({ pressed }) => [styles.dishTap, pressed && styles.pressed]}>
                    <View style={[styles.thumb, { backgroundColor: theme.background }]}>
                      <ThemedText style={styles.emoji}>{recipe.emoji}</ThemedText>
                    </View>
                    <View style={styles.dishBody}>
                      <ThemedText type="smallBold" numberOfLines={1} style={styles.dishTitle}>
                        {recipe.title}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        themeColor="textSecondary"
                        numberOfLines={1}
                        style={styles.dishMeta}>
                        ${recipe.cost.toFixed(2)} · {recipe.calories} kcal
                      </ThemedText>
                    </View>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add to plan"
                    onPress={() => setPlanFor(recipeId)}
                    style={({ pressed }) => [
                      styles.planPill,
                      { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold" themeColor="tint">
                      ＋ Plan
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Dish options"
                    accessibilityHint="Move or remove this dish"
                    onPress={() => setOptionsFor(recipeId)}
                    style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      ⋯
                    </ThemedText>
                  </Pressable>
                </View>
              </Animated.View>
            );
          })
        )}

        {settingsOpen && (
          <CookbookSettingsSheet
            cookbook={open}
            onClose={() => setSettingsOpen(false)}
            onDeleted={back}
          />
        )}

        {optionsFor && (
          <DishOptionsSheet
            recipeId={optionsFor}
            moveTargets={cookbooks.filter((c) => c.id !== open.id)}
            onClose={() => setOptionsFor(null)}
            onView={() => {
              const id = optionsFor;
              setOptionsFor(null);
              router.push({ pathname: '/dish/[id]', params: { id } });
            }}
            onRemove={() => {
              toggleDish(open.id, optionsFor);
              setOptionsFor(null);
            }}
            onMove={(targetId) => {
              const target = cookbooks.find((c) => c.id === targetId);
              moveDish(open.id, targetId, optionsFor);
              setOptionsFor(null);
              if (target) setFlash(`Moved to ${target.name}`);
            }}
          />
        )}

        {planFor && (
          <AddToPlanSheet
            title={RECIPES_BY_ID[planFor]?.title}
            onClose={() => setPlanFor(null)}
            onConfirm={(day, servings) =>
              confirmPlan(planFor, RECIPES_BY_ID[planFor]?.title ?? 'Dish', day, servings)
            }
          />
        )}
      </View>
    );
  }

  // ---- Grid of cookbooks --------------------------------------------------
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <ThemedText type="title">Cookbook</ThemedText>
          <ThemedText themeColor="textSecondary">
            Your collections of saved dishes. Tap one to open it.
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a recipe"
          onPress={() => setRecipeMenuOpen(true)}
          style={({ pressed }) => [
            styles.menuButton,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            ⋯
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.gridHead}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {cookbooks.length} cookbook{cookbooks.length === 1 ? '' : 's'}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort: ${sort === 'recent' ? 'recent' : 'A to Z'}`}
          onPress={() => setSort((s) => (s === 'recent' ? 'az' : 'recent'))}
          style={({ pressed }) => [
            styles.sortButton,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" themeColor="tint">
            ⇅ {sort === 'recent' ? 'Recent' : 'A–Z'}
          </ThemedText>
        </Pressable>
      </View>

      {flashPill}

      <View style={styles.grid} onLayout={onGridLayout}>
        {tileWidth > 0 &&
          sorted.map((cb) => {
            const previews = cb.recipeIds
              .map((id) => RECIPES_BY_ID[id]?.emoji)
              .filter(Boolean)
              .slice(0, cb.icon ? 3 : 4);
            const empty = !cb.icon && previews.length === 0;
            return (
              <Animated.View
                key={cb.id}
                layout={LinearTransition.springify().damping(18)}
                entering={FadeIn.duration(220)}
                style={{ width: tileWidth }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${cb.name}`}
                  onPress={() => openCookbook(cb)}
                  style={({ pressed }) => [
                    styles.cookbookCard,
                    Shadow,
                    { backgroundColor: theme.backgroundElement },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.previewRow}>
                    {cb.icon && (
                      <View style={[styles.previewTile, { backgroundColor: theme.backgroundSelected }]}>
                        <ThemedText style={styles.previewEmoji}>{cb.icon}</ThemedText>
                      </View>
                    )}
                    {empty ? (
                      <View style={[styles.previewTile, { backgroundColor: theme.background }]}>
                        <ThemedText style={styles.previewEmoji}>🍽️</ThemedText>
                      </View>
                    ) : (
                      previews.map((emoji, i) => (
                        <View
                          key={i}
                          style={[styles.previewTile, { backgroundColor: theme.background }]}>
                          <ThemedText style={styles.previewEmoji}>{emoji}</ThemedText>
                        </View>
                      ))
                    )}
                  </View>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {cb.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {cb.recipeIds.length} dish{cb.recipeIds.length === 1 ? '' : 'es'}
                  </ThemedText>
                </Pressable>
              </Animated.View>
            );
          })}
      </View>

      <RecipeInputSheet
        visible={recipeMenuOpen}
        onClose={() => setRecipeMenuOpen(false)}
        onImport={() => {
          setRecipeMenuOpen(false);
          setFlash('Importing from a link is coming soon.');
        }}
        onUpload={() => {
          setRecipeMenuOpen(false);
          router.push('/recipe/new');
        }}
        onScan={() => {
          setRecipeMenuOpen(false);
          setFlash('Recipe scanning (OCR) is coming soon.');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.four },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  header: { flex: 1, gap: Spacing.two },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
  },
  flash: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  cookbookCard: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  previewRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  previewTile: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: { fontSize: 22, lineHeight: 28 },
  // Open-cookbook view
  backChip: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.lg,
  },
  detailHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  detailTitle: { flex: 1, gap: Spacing.half },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: Radius.md,
    padding: Spacing.four,
  },
  dishCard: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dishTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26, lineHeight: 32 },
  dishBody: { flex: 1, gap: Spacing.half },
  dishTitle: { fontSize: 15, lineHeight: 20 },
  dishMeta: { fontSize: 13, lineHeight: 17 },
  planPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
  },
  optionsButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
