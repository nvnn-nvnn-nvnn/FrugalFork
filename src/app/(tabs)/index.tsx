import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Href, useRouter } from 'expo-router';

import { SaveToCookbookSheet } from '@/components/cookbook/save-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Shadow, ShadowSoft, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCookbook } from '@/lib/cookbook/context';
import { recipeSatisfiesDiets } from '@/lib/plan/diets';
import { RECIPES } from '@/lib/plan/recipes';
import { SLOTS, SLOT_META, type Slot } from '@/lib/plan/types';
import { useProfile } from '@/lib/profile/context';
import { formatLongDate } from '@/lib/week/dates';

type Toast = { text: string; href?: Href };

function timeGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Still up?';
}

function currentSlot(date = new Date()): Slot {
  const h = date.getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  return 'dinner';
}

export default function DiscoverScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useProfile();
  const { isInDefault, saveToDefault } = useCookbook();

  // Always showcase exactly 2 dishes per row. We measure the grid's real width
  // (rather than the window) so the two tiles always fit, then split it in half.
  const [gridWidth, setGridWidth] = useState(0);
  const tileWidth = gridWidth > 0 ? (gridWidth - Spacing.three) / 2 : 0;
  const onGridLayout = (e: LayoutChangeEvent) => setGridWidth(e.nativeEvent.layout.width);

  const today = useMemo(() => new Date(), []);
  const [slot, setSlot] = useState<Slot>(() => currentSlot());
  const [toast, setToast] = useState<Toast | null>(null);
  const [saveTarget, setSaveTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const recommendations = useMemo(
    () =>
      RECIPES.filter((r) => r.slots.includes(slot) && recipeSatisfiesDiets(r, profile.diets)).sort(
        (a, b) => a.cost - b.cost,
      ),
    [slot, profile.diets],
  );

  const handleSaveDefault = (recipeId: string, title: string) => {
    const wasIn = isInDefault(recipeId);
    saveToDefault(recipeId);
    setToast(
      wasIn
        ? { text: `Removed ${title} from your cookbook` }
        : { text: `Saved ${title} · Plan it →`, href: '/plan' },
    );
  };

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.four, paddingBottom: BottomTabInset + Spacing.five },
        ]}>
        <View style={styles.inner}>
          <View style={styles.topRow}>
            <ThemedText type="eyebrow" themeColor="textSecondary">
              {timeGreeting(today)} · {formatLongDate(today)}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [
                styles.gear,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                ⚙
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.header}>
            <ThemedText type="title">Discover dishes</ThemedText>
            <ThemedText themeColor="textSecondary">
              Cheap, good food. Tap a dish for the recipe, or + to save it to your cookbook.
            </ThemedText>
          </View>

          {/* Category tabs (placeholder genres) */}
          <View style={[styles.tabBar, { backgroundColor: theme.backgroundElement }]}>
            {SLOTS.map((s) => {
              const on = s === slot;
              return (
                <Pressable
                  key={s}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => setSlot(s)}
                  style={[styles.tab, on && { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold" themeColor={on ? 'text' : 'textSecondary'}>
                    {SLOT_META[s].emoji} {SLOT_META[s].label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.grid} onLayout={onGridLayout}>
            {tileWidth > 0 &&
              recommendations.map((recipe, i) => {
                const inCookbook = isInDefault(recipe.id);
                const openDish = () =>
                  router.push({ pathname: '/dish/[id]', params: { id: recipe.id } });
                return (
                  <Animated.View
                    key={recipe.id}
                    entering={FadeInDown.duration(260).delay(Math.min(i, 8) * 35)}
                    layout={LinearTransition.springify().damping(18)}
                    style={[styles.tile, { width: tileWidth, backgroundColor: theme.backgroundElement }]}>
                    <View style={styles.thumbWrap}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityHint="View full recipe"
                        onPress={openDish}
                        style={({ pressed }) => [
                          styles.thumb,
                          { backgroundColor: theme.background },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText style={styles.thumbEmoji}>{recipe.emoji}</ThemedText>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={inCookbook ? 'Remove from cookbook' : 'Save to cookbook'}
                        accessibilityHint="Long press to choose a specific cookbook"
                        onPress={() => handleSaveDefault(recipe.id, recipe.title)}
                        onLongPress={() => setSaveTarget(recipe.id)}
                        style={({ pressed }) => [
                          styles.addBadge,
                          { backgroundColor: inCookbook ? theme.tint : theme.backgroundSelected },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText
                          type="smallBold"
                          themeColor={inCookbook ? 'onTint' : 'text'}
                          style={styles.addBadgeText}>
                          {inCookbook ? '✓' : '+'}
                        </ThemedText>
                      </Pressable>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityHint="View full recipe"
                      onPress={openDish}
                      style={({ pressed }) => [styles.tileBody, pressed && styles.pressed]}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {recipe.title}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        ${recipe.cost.toFixed(2)} · {recipe.calories} kcal
                      </ThemedText>
                    </Pressable>
                  </Animated.View>
                );
              })}
          </View>
        </View>
      </ScrollView>

      <SaveToCookbookSheet recipeId={saveTarget} onClose={() => setSaveTarget(null)} />

      {toast && (
        <View style={styles.toastWrap} pointerEvents="box-none">
          <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(180)}>
            <Pressable
              disabled={!toast.href}
              accessibilityRole={toast.href ? 'button' : undefined}
              onPress={() => {
                const href = toast.href;
                setToast(null);
                if (href) router.push(href);
              }}
              style={[styles.toast, Shadow, { backgroundColor: theme.tint }]}>
              <ThemedText type="smallBold" themeColor="onTint">
                {toast.text}
              </ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </ThemedView>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  gear: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { gap: Spacing.two },
  tabBar: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: Spacing.half,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  tile: {
    ...Shadow,
    borderRadius: Radius.lg,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  thumbWrap: { position: 'relative' },
  thumb: {
    aspectRatio: 1,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: { fontSize: 44, lineHeight: 50 },
  addBadge: {
    ...ShadowSoft,
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBadgeText: { fontSize: 18, lineHeight: 22 },
  tileBody: {
    gap: Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BottomTabInset + Spacing.six,
    alignItems: 'center',
  },
  toast: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
  },
  pressed: { opacity: 0.7 },
});
