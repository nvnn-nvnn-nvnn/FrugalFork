import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePlan } from '@/lib/plan/context';
import { RECIPES_BY_ID } from '@/lib/plan/recipes';
import { formatLongDate } from '@/lib/week/dates';

export default function CookedScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cookedLog } = usePlan();

  const totals = useMemo(() => {
    let cost = 0;
    let calories = 0;
    for (const e of cookedLog) {
      const r = RECIPES_BY_ID[e.recipeId];
      if (!r) continue;
      cost += r.cost * e.servings;
      calories += r.calories * e.servings;
    }
    return { cost: Math.round(cost * 100) / 100, calories };
  }, [cookedLog]);

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: BottomTabInset + Spacing.five },
        ]}>
        <View style={styles.inner}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.back,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">‹ Settings</ThemedText>
          </Pressable>

          <View style={styles.header}>
            <ThemedText type="title">Cooking history</ThemedText>
            <ThemedText themeColor="textSecondary">
              Every dish you marked “I ate this.”
            </ThemedText>
          </View>

          {cookedLog.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Nothing yet. On your plan, tap “I ate this” on a meal and it shows up here.
              </ThemedText>
            </View>
          ) : (
            <>
              <View style={[styles.summary, Shadow, { backgroundColor: theme.backgroundElement }]}>
                <Stat value={`${cookedLog.length}`} label="dishes cooked" />
                <Stat value={`$${totals.cost.toFixed(2)}`} label="est. spent" />
                <Stat value={`${totals.calories}`} label="kcal" />
              </View>

              {cookedLog.map((entry, i) => {
                const recipe = RECIPES_BY_ID[entry.recipeId];
                return (
                  <Pressable
                    key={`${entry.recipeId}-${entry.at}-${i}`}
                    accessibilityRole="button"
                    accessibilityHint="View recipe"
                    disabled={!recipe}
                    onPress={() =>
                      recipe && router.push({ pathname: '/dish/[id]', params: { id: recipe.id } })
                    }
                    style={({ pressed }) => [
                      styles.row,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <View style={[styles.thumb, { backgroundColor: theme.background }]}>
                      <ThemedText style={styles.emoji}>{recipe?.emoji ?? '🍽️'}</ThemedText>
                    </View>
                    <View style={styles.body}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {recipe?.title ?? 'Removed dish'}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatLongDate(new Date(entry.at))}
                        {entry.servings > 1 ? ` · ${entry.servings} servings` : ''}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText type="subtitle" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
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
  back: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.lg,
  },
  header: { gap: Spacing.two },
  empty: {
    borderRadius: Radius.md,
    padding: Spacing.four,
  },
  summary: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: Spacing.four,
  },
  stat: { flex: 1, alignItems: 'center', gap: Spacing.half },
  statValue: { fontSize: 26, lineHeight: 30 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28, lineHeight: 34 },
  body: { flex: 1, gap: Spacing.half },
  pressed: { opacity: 0.7 },
});
