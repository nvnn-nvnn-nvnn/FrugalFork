import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { BudgetBar } from '@/components/plan/budget-bar';
import { PlanAddSheet } from '@/components/plan/plan-add-sheet';
import { ThemedText } from '@/components/themed-text';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isPlaceholderPhoto, pickMealPhoto } from '@/lib/photo';
import { usePlan } from '@/lib/plan/context';
import { builderCalories, builderCost } from '@/lib/plan/planner';
import { RECIPES_BY_ID } from '@/lib/plan/recipes';
import { type BuilderItem } from '@/lib/plan/types';
import { useProfile } from '@/lib/profile/context';
import { WEEKDAYS, weekDates, weekRangeLabel } from '@/lib/week/dates';

export default function PlanScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useProfile();
  const {
    ready,
    selectedPlanDay: selectedDay,
    setSelectedPlanDay: setSelectedDay,
    builder,
    addToBuilder,
    removeItem,
    setServings,
    toggleEaten,
    togglePrepped,
    setPhoto,
    isInGroceries,
    toggleGrocery,
    addGroceries,
    logCooked,
  } = usePlan();

  const week = useMemo(() => weekDates(new Date()), []);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{ id: string; title: string } | null>(null);

  if (!ready) return <ThemedView style={styles.root} />;

  const dayItems = builder.filter((b) => b.day === selectedDay);
  const weekTotal = builderCost(builder);
  const dayTotal = builderCost(dayItems);
  const dayCalories = builderCalories(dayItems);

  // Connective tissue to the Shop: planned dishes not flagged for shopping yet.
  const plannedRecipeIds = Array.from(new Set(builder.map((b) => b.recipeId)));
  const notInList = plannedRecipeIds.filter((id) => !isInGroceries(id));

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.four, paddingBottom: BottomTabInset + Spacing.five },
        ]}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <ThemedText type="eyebrow" themeColor="tint">
              This week · {weekRangeLabel()}
            </ThemedText>
            <ThemedText type="title">Your week</ThemedText>
            <ThemedText themeColor="textSecondary">
              Pick a day and set its meals. Budget is for the whole week.
            </ThemedText>
          </View>

          <BudgetBar label="Planned cost (week)" amount={weekTotal} budget={profile.weeklyGroceryBudget} />

          {/* Connective banner → Shop */}
          {builder.length > 0 &&
            (notInList.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => addGroceries(notInList)}
                style={({ pressed }) => [
                  styles.banner,
                  { backgroundColor: theme.tint },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" themeColor="onTint">
                  🛒 Add all to groceries
                </ThemedText>
                <ThemedText type="small" themeColor="onTint">
                  {notInList.length} planned dish{notInList.length === 1 ? '' : 'es'} not on your list yet
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/shop')}
                style={({ pressed }) => [
                  styles.banner,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" themeColor="tint">
                  ✓ Everything’s on your list · View Shop →
                </ThemedText>
              </Pressable>
            ))}

          {/* Day selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelector}>
            {WEEKDAYS.map((label, day) => {
              const on = day === selectedDay;
              const count = builder.filter((b) => b.day === day).length;
              return (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    setSelectedDay(day);
                    setAddOpen(false);
                  }}
                  style={[
                    styles.dayChip,
                    { backgroundColor: on ? theme.tint : theme.backgroundElement },
                  ]}>
                  <ThemedText type="small" themeColor={on ? 'onTint' : 'textSecondary'}>
                    {label}
                  </ThemedText>
                  <ThemedText type="subtitle" themeColor={on ? 'onTint' : 'text'} style={styles.dayNum}>
                    {week[day].getDate()}
                  </ThemedText>
                  <View
                    style={[
                      styles.dayCount,
                      count > 0 && { backgroundColor: on ? theme.onTint : theme.tint },
                    ]}>
                    {count > 0 && (
                      <ThemedText type="small" themeColor={on ? 'tint' : 'onTint'} style={styles.dayCountText}>
                        {count}
                      </ThemedText>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <ThemedText type="small" themeColor="textSecondary">
            {dayItems.length === 0
              ? 'No meals set for this day yet.'
              : `${dayItems.length} meal${dayItems.length === 1 ? '' : 's'} · $${dayTotal.toFixed(2)} · ${dayCalories} kcal`}
          </ThemedText>

          {/* The selected day's dishes — any dish, no meal-time buckets */}
          <Animated.View layout={LinearTransition.springify().damping(18)} style={styles.section}>
            {dayItems.length === 0 && (
              <View style={[styles.emptySlot, { borderColor: theme.backgroundSelected }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  Nothing planned for this day yet.
                </ThemedText>
              </View>
            )}

            {dayItems.map((item) => (
              <MealRow
                key={item.id}
                item={item}
                inGroceries={isInGroceries(item.recipeId)}
                onRemove={() => removeItem(item.id)}
                onToggleEaten={() => {
                  if (!item.eaten) logCooked(item.recipeId, item.servings); // record on the way "on"
                  toggleEaten(item.id);
                }}
                onTogglePrepped={() => togglePrepped(item.id)}
                onPhoto={async () => {
                  const uri = await pickMealPhoto();
                  if (uri) setPhoto(item.id, uri);
                }}
                onSetServings={(n) => setServings(item.id, n)}
                onToggleGroceries={() => {
                  if (isInGroceries(item.recipeId)) {
                    setPendingRemove({
                      id: item.recipeId,
                      title: RECIPES_BY_ID[item.recipeId]?.title ?? 'this dish',
                    });
                  } else {
                    toggleGrocery(item.recipeId);
                  }
                }}
              />
            ))}

            <Pressable
              accessibilityRole="button"
              onPress={() => setAddOpen(true)}
              style={({ pressed }) => [
                styles.addButton,
                { borderColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" themeColor="tint">
                + Add from cookbook
              </ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>

      {addOpen && (
        <PlanAddSheet
          day={selectedDay}
          excludeIds={dayItems.map((i) => i.recipeId)}
          onClose={() => setAddOpen(false)}
          onAdd={(recipeId) => addToBuilder(recipeId, selectedDay)}
        />
      )}

      <ConfirmModal
        visible={!!pendingRemove}
        title="Remove from list?"
        message={
          pendingRemove
            ? `${pendingRemove.title}'s ingredients will be taken off your shopping list.`
            : undefined
        }
        confirmLabel="Remove"
        cancelLabel="Keep"
        onConfirm={() => pendingRemove && toggleGrocery(pendingRemove.id)}
        onClose={() => setPendingRemove(null)}
      />
    </ThemedView>
  );
}

type MealRowProps = {
  item: BuilderItem;
  inGroceries: boolean;
  onRemove: () => void;
  onToggleEaten: () => void;
  onTogglePrepped: () => void;
  onPhoto: () => void;
  onSetServings: (servings: number) => void;
  onToggleGroceries: () => void;
};

function MealRow({
  item,
  inGroceries,
  onRemove,
  onToggleEaten,
  onTogglePrepped,
  onPhoto,
  onSetServings,
  onToggleGroceries,
}: MealRowProps) {
  const theme = useTheme();
  const router = useRouter();
  const recipe = RECIPES_BY_ID[item.recipeId];
  if (!recipe) return null;

  const servings = item.servings;
  const hasPhoto = !!item.photo && !isPlaceholderPhoto(item.photo);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(140)}
      layout={LinearTransition.springify().damping(18)}
      style={[styles.mealCard, Shadow, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.mealTop}>
        <Pressable
          accessibilityRole="button"
          accessibilityHint="View full recipe"
          onPress={() => router.push({ pathname: '/dish/[id]', params: { id: recipe.id } })}
          style={({ pressed }) => [styles.mealTap, pressed && styles.pressed]}>
          {hasPhoto ? (
            <Image source={{ uri: item.photo! }} style={styles.mealThumb} contentFit="cover" />
          ) : (
            <View style={[styles.mealThumb, { backgroundColor: theme.background }]}>
              <ThemedText style={styles.emoji}>{recipe.emoji}</ThemedText>
            </View>
          )}
          <View style={styles.mealBody}>
            <ThemedText type="smallBold">{recipe.title} ›</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              ${(recipe.cost * servings).toFixed(2)} · {recipe.calories * servings} kcal
            </ThemedText>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove"
          onPress={onRemove}
          style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            ✕
          </ThemedText>
        </Pressable>
      </View>

      {/* Servings stepper */}
      <View style={styles.servingsRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Servings
        </ThemedText>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fewer servings"
            disabled={servings <= 1}
            onPress={() => onSetServings(servings - 1)}
            style={({ pressed }) => [
              styles.stepBtn,
              { backgroundColor: theme.backgroundSelected },
              (pressed || servings <= 1) && styles.pressed,
            ]}>
            <ThemedText type="smallBold">−</ThemedText>
          </Pressable>
          <ThemedText type="smallBold" style={styles.stepValue}>
            {servings}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More servings"
            disabled={servings >= 4}
            onPress={() => onSetServings(servings + 1)}
            style={({ pressed }) => [
              styles.stepBtn,
              { backgroundColor: theme.backgroundSelected },
              (pressed || servings >= 4) && styles.pressed,
            ]}>
            <ThemedText type="smallBold">+</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.mealActions}>
        <MealAction label={item.eaten ? '✓ Ate it' : 'I ate this'} active={item.eaten} onPress={onToggleEaten} />
        <MealAction label={item.prepped ? '✓ Prepped' : 'Meal prep'} active={item.prepped} onPress={onTogglePrepped} />
        <MealAction label={hasPhoto ? '✓ Photo' : '📷 Add photo'} active={hasPhoto} onPress={onPhoto} />
        <MealAction
          label={inGroceries ? '✓ On list' : '🛒 Add to list'}
          active={inGroceries}
          onPress={onToggleGroceries}
        />
      </View>
    </Animated.View>
  );
}

function MealAction({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionChip,
        { backgroundColor: active ? theme.tint : theme.backgroundSelected },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="small" themeColor={active ? 'onTint' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  inner: {
    flex: 1,
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  header: { gap: Spacing.two },
  banner: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.half,
  },
  daySelector: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  dayChip: {
    width: 60,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: Spacing.half,
  },
  dayNum: { fontSize: 22, lineHeight: 26 },
  dayCount: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCountText: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
  section: { gap: Spacing.two },
  emptySlot: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  mealCard: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  mealTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  mealTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  mealThumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24, lineHeight: 30 },
  mealBody: { flex: 1, gap: Spacing.half },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 16, textAlign: 'center' },
  mealActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
  },
  addButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  pressed: { opacity: 0.7 },
});
