import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { DishThumb } from '@/components/dish-thumb';
import { BudgetBar } from '@/components/plan/budget-bar';
import { usePlusAction } from '@/components/premium/paywall-gate';
import { ShopMenuSheet } from '@/components/plan/shop-menu-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCookbook } from '@/lib/cookbook/context';
import { scanReceipt, type ReceiptScan } from '@/lib/ocr';
import { usePlan } from '@/lib/plan/context';
import { buildRecipeSections, buildShoppingSections } from '@/lib/plan/planner';
import { RECIPES_BY_ID } from '@/lib/plan/recipes';
import type { ShoppingItem } from '@/lib/plan/types';
import { useProfile } from '@/lib/profile/context';
import { weekRangeLabel } from '@/lib/week/dates';

export default function ShopScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useProfile();
  const { groceries, spend, addSpend, isChecked, toggleChecked, markAllChecked } = usePlan();
  const { isSaved } = useCookbook();
  const guard = usePlusAction();

  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ReceiptScan | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [groupBy, setGroupBy] = useState<'aisle' | 'recipe'>('aisle');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 2600);
    return () => clearTimeout(timer);
  }, [flash]);

  // Notify here when a dish leaves the list (e.g. removed from a planned meal).
  const prevGroceries = useRef(groceries);
  useEffect(() => {
    const currIds = new Set(groceries);
    const removed = prevGroceries.current.filter((id) => !currIds.has(id));
    if (removed.length > 0) {
      const name = RECIPES_BY_ID[removed[0]]?.title ?? 'A dish';
      setFlash(
        removed.length === 1
          ? `${name} was removed from your list`
          : `${removed.length} dishes were removed from your list`,
      );
    }
    prevGroceries.current = groceries;
  }, [groceries]);

  // A dish is on the list if it's flagged for shopping AND still saved in a
  // cookbook — saving is the prerequisite (the plan no longer drives the list).
  // Each saved dish counts as one serving.
  const entries = useMemo(
    () => groceries.filter((id) => isSaved(id)).map((id) => ({ recipeId: id, servings: 1 })),
    [groceries, isSaved],
  );

  // Two cuts of the same list: aggregated by aisle, or split out per recipe.
  const shopping = useMemo(
    () => (entries.length > 0 ? buildShoppingSections(entries) : null),
    [entries],
  );
  const byRecipe = useMemo(
    () => (entries.length > 0 ? buildRecipeSections(entries) : null),
    [entries],
  );

  const allItems = shopping ? shopping.sections.flatMap((s) => s.items) : [];
  const gotCount = allItems.filter((i) => isChecked(i.name)).length;

  // Optionally hide crossed-off items to focus on what's left. Works for either cut.
  const hideDone = <T extends { items: ShoppingItem[] }>(sections: T[]): T[] =>
    !hideCompleted
      ? sections
      : sections
          .map((s) => ({ ...s, items: s.items.filter((i) => !isChecked(i.name)) }))
          .filter((s) => s.items.length > 0);

  const displaySections = shopping ? hideDone(shopping.sections) : [];

  // "By recipe" is a dropdown: choose one dish, see its ingredients. Default to
  // the first dish; fall back if the selected one leaves the list.
  const recipeSections = byRecipe?.sections ?? [];
  const activeRecipeId =
    selectedRecipeId && recipeSections.some((s) => s.recipeId === selectedRecipeId)
      ? selectedRecipeId
      : (recipeSections[0]?.recipeId ?? null);
  const activeRecipe = recipeSections.find((s) => s.recipeId === activeRecipeId) ?? null;
  const activeRecipeItems = !activeRecipe
    ? []
    : hideCompleted
      ? activeRecipe.items.filter((i) => !isChecked(i.name))
      : activeRecipe.items;

  const allDone = allItems.length > 0 && gotCount === allItems.length;

  // One checkable item row, shared by both views. Crossing off is by ingredient
  // name, so checking "rice" off marks it in every recipe that needs it.
  const renderItem = (item: ShoppingItem, showDishes: boolean) => {
    const done = isChecked(item.name);
    return (
      <Pressable
        key={item.name}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={item.name}
        onPress={() => toggleChecked(item.name)}
        style={({ pressed }) => [
          styles.itemRow,
          { backgroundColor: theme.backgroundElement },
          done && styles.itemDone,
          pressed && styles.pressed,
        ]}>
        <View
          style={[
            styles.checkbox,
            { borderColor: theme.backgroundSelected },
            done && { backgroundColor: theme.tint, borderColor: theme.tint },
          ]}>
          {done && (
            <ThemedText type="small" themeColor="onTint" style={styles.check}>
              ✓
            </ThemedText>
          )}
        </View>
        <View style={styles.itemBody}>
          <ThemedText type="smallBold" style={done && styles.struck}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {item.qtys.length > 1 ? `${item.qtys.length}× · ` : ''}
            {item.qtys.join(', ')}
          </ThemedText>
          {showDishes && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              for {item.dishes.join(' · ')}
            </ThemedText>
          )}
        </View>
        <ThemedText type="smallBold" themeColor="textSecondary" style={done && styles.struck}>
          ${item.cost.toFixed(2)}
        </ThemedText>
      </Pressable>
    );
  };

  const shareList = () => {
    if (!shopping) return;
    const body = shopping.sections
      .map(
        (s) =>
          `${s.category}\n` +
          s.items.map((i) => `• ${i.name}${i.qtys.length ? ` (${i.qtys.join(', ')})` : ''}`).join('\n'),
      )
      .join('\n\n');
    Share.share({ message: `Shopping list — est. $${shopping.total.toFixed(2)}\n\n${body}` }).catch(
      () => {},
    );
  };

  const contentStyle = [
    styles.content,
    { paddingTop: insets.top + Spacing.four, paddingBottom: BottomTabInset + Spacing.five },
  ];

  const onScan = async () => {
    setScanning(true);
    try {
      const result = await scanReceipt();
      if (!result) return; // user cancelled the picker
      setLastScan(result);
      addSpend(result.total);
      setFlash(`Logged $${result.total.toFixed(2)} from your receipt`);
    } catch (e) {
      setFlash(e instanceof Error ? e.message : 'Could not read that receipt.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <ThemedView style={styles.root}>
      <ScrollView contentContainerStyle={contentStyle}>
        <View style={styles.inner}>
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <ThemedText type="eyebrow" themeColor="tint">
                This week · {weekRangeLabel()}
              </ThemedText>
              <ThemedText type="title">Shopping</ThemedText>
              <ThemedText themeColor="textSecondary">
                One curated list for the week, and your real spend vs budget.
              </ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="List options"
              onPress={() => setMenuOpen(true)}
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

          {flash && (
            <View style={[styles.flash, { backgroundColor: theme.tint }]}>
              <ThemedText type="smallBold" themeColor="onTint">
                {flash}
              </ThemedText>
            </View>
          )}

          {/* Real spend tracking + receipt OCR */}
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <BudgetBar label="Spent this week" amount={spend} budget={profile.weeklyGroceryBudget} />

            <Pressable
              accessibilityRole="button"
              disabled={scanning}
              onPress={() => guard('ocr', onScan)}
              style={({ pressed }) => [
                styles.scanButton,
                { backgroundColor: theme.tint },
                (pressed || scanning) && styles.pressed,
              ]}>
              {scanning ? (
                <ActivityIndicator color={theme.onTint} />
              ) : (
                <ThemedText type="smallBold" themeColor="onTint">
                  📷 Scan a receipt
                </ThemedText>
              )}
            </Pressable>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
              Snap a photo — Plus reads the items and total into your spend.
            </ThemedText>

            {lastScan && (
              <View style={[styles.receipt, { borderTopColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold">Last receipt</ThemedText>
                {lastScan.items.map((item, i) => (
                  <View key={i} style={styles.receiptRow}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      ${item.cost.toFixed(2)}
                    </ThemedText>
                  </View>
                ))}
                <View style={styles.receiptRow}>
                  <ThemedText type="smallBold">Total</ThemedText>
                  <ThemedText type="smallBold">${lastScan.total.toFixed(2)}</ThemedText>
                </View>
              </View>
            )}
          </View>

          {/* Curated ingredients for the planned week */}
          {!shopping ? (
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Your list is empty</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Save a dish to a cookbook, then open it and tap “Add to list” — its ingredients land
                here as one categorized list.
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/cookbook')}
                style={({ pressed }) => [
                  styles.emptyCta,
                  { backgroundColor: theme.tint },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" themeColor="onTint">
                  Go to your cookbook →
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.listSection}>
              <View style={styles.listHeader}>
                <ThemedText type="subtitle">Ingredients</ThemedText>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  est. ${shopping.total.toFixed(2)}
                </ThemedText>
              </View>

              <BudgetBar
                label="Estimated grocery cost"
                amount={shopping.total}
                budget={profile.weeklyGroceryBudget}
              />

              <ThemedText type="small" themeColor="textSecondary">
                Tap an item to cross it off · {gotCount}/{allItems.length} in the cart
              </ThemedText>

              {/* Group the same list by aisle or by recipe */}
              <View style={[styles.toggle, { backgroundColor: theme.backgroundElement }]}>
                {(['aisle', 'recipe'] as const).map((mode) => {
                  const on = groupBy === mode;
                  return (
                    <Pressable
                      key={mode}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      onPress={() => setGroupBy(mode)}
                      style={[styles.toggleSeg, on && { backgroundColor: theme.backgroundSelected }]}>
                      <ThemedText type="smallBold" themeColor={on ? 'text' : 'textSecondary'}>
                        {mode === 'aisle' ? 'By aisle' : 'By recipe'}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {allDone && (
                <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="smallBold">All done 🎉</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Every item is crossed off. Use the ⋯ menu to show completed items again.
                  </ThemedText>
                </View>
              )}

              {groupBy === 'aisle' &&
                displaySections.map((section) => (
                  <View key={section.category} style={styles.categorySection}>
                    <View style={styles.categoryHead}>
                      <ThemedText type="smallBold" themeColor="tint" style={styles.categoryTitle}>
                        {section.category}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        ${section.cost.toFixed(2)}
                      </ThemedText>
                    </View>
                    {section.items.map((item) => renderItem(item, true))}
                  </View>
                ))}

              {groupBy === 'recipe' && activeRecipe && (
                <>
                  {/* Recipe dropdown: choose a dish to see its ingredients */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Choose a recipe — ${activeRecipe.title} selected`}
                    accessibilityState={{ expanded: pickerOpen }}
                    onPress={() => setPickerOpen((o) => !o)}
                    style={({ pressed }) => [
                      styles.dropdown,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <DishThumb
                      recipeId={activeRecipe.recipeId}
                      emoji={activeRecipe.emoji}
                      image={activeRecipe.image}
                      emojiSize={20}
                      radius={Radius.sm}
                      backgroundColor={theme.background}
                      style={styles.dropThumb}
                    />
                    <View style={styles.dropBody}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {activeRecipe.title}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {activeRecipe.items.length} ingredient{activeRecipe.items.length === 1 ? '' : 's'} ·
                        ${activeRecipe.cost.toFixed(2)}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      {pickerOpen ? '▴' : '▾'}
                    </ThemedText>
                  </Pressable>

                  {pickerOpen ? (
                    <View style={[styles.dropList, { backgroundColor: theme.backgroundElement }]}>
                      {recipeSections.map((sec, i) => {
                        const on = sec.recipeId === activeRecipeId;
                        return (
                          <Pressable
                            key={sec.recipeId}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                            onPress={() => {
                              setSelectedRecipeId(sec.recipeId);
                              setPickerOpen(false);
                            }}
                            style={({ pressed }) => [
                              styles.dropOption,
                              i > 0 && {
                                borderTopWidth: StyleSheet.hairlineWidth,
                                borderTopColor: theme.backgroundSelected,
                              },
                              (on || pressed) && { backgroundColor: theme.backgroundSelected },
                            ]}>
                            <DishThumb
                              recipeId={sec.recipeId}
                              emoji={sec.emoji}
                              image={sec.image}
                              emojiSize={20}
                              radius={Radius.sm}
                              backgroundColor={theme.background}
                              style={styles.dropThumb}
                            />
                            <ThemedText type="smallBold" numberOfLines={1} style={styles.dropOptionTitle}>
                              {sec.title}
                            </ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              ${sec.cost.toFixed(2)}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.categorySection}>
                      {activeRecipeItems.length === 0 ? (
                        <ThemedText type="small" themeColor="textSecondary">
                          Everything for this dish is crossed off.
                        </ThemedText>
                      ) : (
                        activeRecipeItems.map((item) => renderItem(item, false))
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <ShopMenuSheet
        visible={menuOpen}
        completedHidden={hideCompleted}
        onClose={() => setMenuOpen(false)}
        onShopOnline={() => setFlash('Online shopping is coming soon.')}
        onToggleCompleted={() => setHideCompleted((h) => !h)}
        onMarkAll={() => markAllChecked(allItems.map((i) => i.name))}
        onShare={shareList}
        onPrint={() => setFlash('Printing is coming soon.')}
      />
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
  flash: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  card: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  emptyCta: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  scanButton: {
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  centerText: { textAlign: 'center' },
  receipt: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: Spacing.half,
  },
  toggleSeg: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  dropThumb: { width: 36, height: 36 },
  dropBody: { flex: 1, gap: Spacing.half },
  dropList: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  dropOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  dropOptionTitle: { flex: 1 },
  listSection: { gap: Spacing.three },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  categorySection: { gap: Spacing.two },
  categoryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.one,
  },
  categoryTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.three,
  },
  itemDone: { opacity: 0.5 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { lineHeight: 18 },
  struck: { textDecorationLine: 'line-through' },
  itemBody: {
    flex: 1,
    gap: Spacing.half,
  },
  pressed: { opacity: 0.7 },
});
