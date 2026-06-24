import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BudgetBar } from '@/components/plan/budget-bar';
import { ShopMenuSheet } from '@/components/plan/shop-menu-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { scanReceipt, type ReceiptScan } from '@/lib/ocr';
import { usePlan } from '@/lib/plan/context';
import { buildShoppingSections } from '@/lib/plan/planner';
import { RECIPES_BY_ID } from '@/lib/plan/recipes';
import { useProfile } from '@/lib/profile/context';
import { weekRangeLabel } from '@/lib/week/dates';

export default function ShopScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useProfile();
  const { builder, groceries, spend, addSpend, isChecked, toggleChecked, markAllChecked } = usePlan();

  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ReceiptScan | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
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

  // A dish is only on the list if it's PLANNED and flagged for shopping. Servings
  // are derived from the plan (summed across days), so the list stays in sync.
  const shopping = useMemo(() => {
    const plannedServings = new Map<string, number>();
    for (const b of builder) {
      plannedServings.set(b.recipeId, (plannedServings.get(b.recipeId) ?? 0) + b.servings);
    }
    const entries = groceries
      .filter((id) => plannedServings.has(id))
      .map((id) => ({ recipeId: id, servings: plannedServings.get(id)! }));
    return entries.length > 0 ? buildShoppingSections(entries) : null;
  }, [builder, groceries]);

  const allItems = shopping ? shopping.sections.flatMap((s) => s.items) : [];
  const gotCount = allItems.filter((i) => isChecked(i.name)).length;

  // Optionally hide crossed-off items to focus on what's left.
  const displaySections = !shopping
    ? []
    : hideCompleted
      ? shopping.sections
          .map((s) => ({ ...s, items: s.items.filter((i) => !isChecked(i.name)) }))
          .filter((s) => s.items.length > 0)
      : shopping.sections;

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
      setLastScan(result);
      addSpend(result.total);
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
              onPress={onScan}
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
              Placeholder — adds a sample receipt to your spend.
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
                On a planned meal (or a dish page), tap “Add to list” — its ingredients land here as
                one categorized list.
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/plan')}
                style={({ pressed }) => [
                  styles.emptyCta,
                  { backgroundColor: theme.tint },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" themeColor="onTint">
                  Go to your plan →
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

              {displaySections.length === 0 && (
                <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="smallBold">All done 🎉</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Every item is crossed off. Use the ⋯ menu to show completed items again.
                  </ThemedText>
                </View>
              )}

              {displaySections.map((section) => (
                <View key={section.category} style={styles.categorySection}>
                  <View style={styles.categoryHead}>
                    <ThemedText type="smallBold" themeColor="tint" style={styles.categoryTitle}>
                      {section.category}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      ${section.cost.toFixed(2)}
                    </ThemedText>
                  </View>

                  {section.items.map((item) => {
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
                          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                            for {item.dishes.join(' · ')}
                          </ThemedText>
                        </View>
                        <ThemedText
                          type="smallBold"
                          themeColor="textSecondary"
                          style={done && styles.struck}>
                          ${item.cost.toFixed(2)}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
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
    padding: Spacing.four,
    gap: Spacing.three,
  },
  emptyCta: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  scanButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
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
