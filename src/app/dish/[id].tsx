import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CookingMode } from '@/components/cooking-mode';
import { DishThumb } from '@/components/dish-thumb';
import { AddToPlanSheet } from '@/components/plan/add-to-plan-sheet';
import { SaveToCookbookSheet } from '@/components/cookbook/save-sheet';
import { ThemedText } from '@/components/themed-text';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { IS_ADMIN } from '@/lib/admin';
import { useCookbook } from '@/lib/cookbook/context';
import { useDishImages } from '@/lib/dish-image/context';
import { pickMealPhoto } from '@/lib/photo';
import { usePlan } from '@/lib/plan/context';
import { DIETS, recipeSatisfiesDiet } from '@/lib/plan/diets';
import {
  cookwareSections,
  dishAbout,
  dishMinutes,
  dishReviews,
  ingredientSections,
  instructionSections,
} from '@/lib/plan/dish-detail';
import { RECIPES_BY_ID } from '@/lib/plan/recipes';
import { WEEKDAYS } from '@/lib/week/dates';

const TABS = ['Cookware', 'Ingredients', 'Instructions', 'Reviews'] as const;
type Tab = (typeof TABS)[number];

export default function DishScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { builder, addToBuilder, isInGroceries, toggleGrocery } = usePlan();
  const { isSaved, saveToDefault } = useCookbook();
  const { getImage, setImage } = useDishImages();

  const [tab, setTab] = useState<Tab>('Ingredients');
  const [showInfo, setShowInfo] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [cookingOpen, setCookingOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 2200);
    return () => clearTimeout(timer);
  }, [flash]);

  const recipe = id ? RECIPES_BY_ID[id] : undefined;

  if (!recipe) {
    return (
      <ThemedView style={styles.fallback}>
        <ThemedText type="subtitle">Dish not found</ThemedText>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <ThemedText type="smallBold" themeColor="tint">
            Go back
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const minutes = dishMinutes(recipe);
  const fitsDiets = DIETS.filter((d) => recipeSatisfiesDiet(recipe, d));

  const saved = isSaved(recipe.id);
  const planned = builder.some((b) => b.recipeId === recipe.id);
  // The shopping list is driven by cookbook saves now — a dish just needs to be
  // saved (the "Add to list" action ensures that), not planned.
  const onList = isInGroceries(recipe.id);
  const statusBits = [
    saved && '✓ Saved',
    planned && '🗓 Planned',
    onList && '🛒 On list',
  ].filter(Boolean) as string[];

  const handleAddToPlan = (day: number, servings: number) => {
    // Plans are built from the cookbook, so make sure it's saved first.
    addToBuilder(recipe.id, day, servings);
    if (!saved) saveToDefault(recipe.id);
    setFlash(
      `${saved ? 'Added' : 'Saved & added'} to ${WEEKDAYS[day]} · ${servings} serving${servings > 1 ? 's' : ''}`,
    );
  };

  const handleAddToShop = () => {
    if (onList) {
      setConfirmRemove(true);
      return;
    }
    // A dish must be saved to be on the list — save it to the default cookbook
    // first if it isn't already, then flag it.
    if (!saved) saveToDefault(recipe.id);
    toggleGrocery(recipe.id);
    setFlash(saved ? 'Added to your list' : 'Saved & added to your list');
  };

  const handleShare = () => {
    Share.share({
      message: `${recipe.emoji} ${recipe.title} — $${recipe.cost.toFixed(2)} · ${recipe.calories} kcal\n${dishAbout(recipe)}`,
    }).catch(() => {});
  };

  // Premade (curated) dishes are read-only for normal users — only the dish's
  // creator, or an admin, may set a photo. (Curated dish photos ship via the
  // `image` field in recipes.ts; see docs/10-editing-dishes.md.)
  const canEditPhoto = recipe.userCreated === true || IS_ADMIN;
  const hasPhoto = !!(getImage(recipe.id) ?? recipe.image);
  const changePhoto = async () => {
    const uri = await pickMealPhoto();
    if (!uri) return; // cancelled or denied
    setImage(recipe.id, uri);
    setFlash('Thumbnail updated');
  };

  return (
    <ThemedView style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six }]}>
        {/* Thumbnail with overlaid back + "..." controls */}
        <View style={[styles.thumb, { backgroundColor: theme.backgroundElement }]}>
          <DishThumb
            recipeId={recipe.id}
            emoji={recipe.emoji}
            image={recipe.image}
            emojiSize={56}
            radius={0}
            backgroundColor="transparent"
            style={StyleSheet.absoluteFill}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              { top: insets.top + Spacing.two, left: Spacing.three, backgroundColor: theme.background },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">‹</ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More info"
            onPress={() => setShowInfo((s) => !s)}
            style={({ pressed }) => [
              styles.iconButton,
              { top: insets.top + Spacing.two, right: Spacing.three, backgroundColor: theme.background },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">⋯</ThemedText>
          </Pressable>

          {canEditPhoto && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={hasPhoto ? 'Change dish photo' : 'Add a dish photo'}
              onPress={changePhoto}
              style={({ pressed }) => [
                styles.photoButton,
                Shadow,
                { backgroundColor: theme.background },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold">{hasPhoto ? '📷 Change photo' : '📷 Add photo'}</ThemedText>
            </Pressable>
          )}
        </View>

        <View style={styles.inner}>
          {/* "..." info + add-to-plan panel */}
          {showInfo && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(160)}
              style={[styles.infoPanel, { backgroundColor: theme.backgroundElement }]}>
              <InfoRow label="Cost / serving" value={`$${recipe.cost.toFixed(2)}`} />
              <InfoRow label="Calories" value={`${recipe.calories} kcal`} />
              <InfoRow label="Prep time" value={`~${minutes} min`} />
              <InfoRow label="Good for" value={recipe.tags.join(', ')} />
              <InfoRow label="Fits diets" value={fitsDiets.length ? fitsDiets.join(', ') : 'none'} />
            </Animated.View>
          )}

          {/* Title + features */}
          <View style={styles.titleBlock}>
            <ThemedText type="title">{recipe.title}</ThemedText>
            <ThemedText themeColor="textSecondary">{dishAbout(recipe)}</ThemedText>
            {statusBits.length > 0 ? (
              <ThemedText type="smallBold" themeColor="tint">
                {statusBits.join('  ·  ')}
              </ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Added by the SnackPlan kitchen
              </ThemedText>
            )}

            <View style={styles.features}>
              <Feature label="About" value={recipe.health} />
              <Feature label="Time" value={`~${minutes} min`} />
            </View>
          </View>

          {/* Action row: cookbook / plan / list / share */}
          <View style={styles.actions}>
            <ActionButton
              icon="📕"
              label="Add to cookbook"
              active={saved}
              onPress={() => setSaveOpen(true)}
            />
            <ActionButton
              icon="🗓"
              label="Add to plan"
              active={planned}
              onPress={() => setPlanOpen(true)}
            />
            <ActionButton
              icon="🛒"
              label={onList ? 'On your list' : 'Add to list'}
              active={onList}
              onPress={handleAddToShop}
            />
            <ActionButton icon="↗" label="Share" active={false} onPress={handleShare} />
          </View>

          {/* Start cooking — fullscreen step-by-step */}
          <Pressable
            accessibilityRole="button"
            onPress={() => setCookingOpen(true)}
            style={({ pressed }) => [
              styles.cookButton,
              { backgroundColor: theme.tint },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" themeColor="onTint" style={styles.cookButtonText}>
              👩‍🍳 Start cooking
            </ThemedText>
          </Pressable>

          {flash && (
            <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)}>
              <ThemedText type="small" themeColor="tint" style={styles.menuFlash}>
                ✓ {flash}
              </ThemedText>
            </Animated.View>
          )}

          {/* Tab bar */}
          <View style={[styles.tabBar, { backgroundColor: theme.backgroundElement }]}>
            {TABS.map((t) => {
              const on = t === tab;
              return (
                <Pressable
                  key={t}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => setTab(t)}
                  style={[styles.tab, on && { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="small" themeColor={on ? 'text' : 'textSecondary'}>
                    {t}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Tab content */}
          {tab === 'Ingredients' && (
            <View style={styles.sections}>
              {ingredientSections(recipe).map((section) => (
                <View key={section.title} style={styles.section}>
                  <ThemedText type="smallBold" themeColor="tint" style={styles.sectionTitle}>
                    {section.title}
                  </ThemedText>
                  {section.items.map((ing, i) => (
                    <View key={`${ing.name}-${i}`} style={styles.lineRow}>
                      <ThemedText type="small">
                        {ing.name} · {ing.qty}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        ${ing.cost.toFixed(2)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {tab === 'Cookware' && (
            <View style={styles.sections}>
              {cookwareSections(recipe).map((section) => (
                <View key={section.title} style={styles.section}>
                  <ThemedText type="smallBold" themeColor="tint" style={styles.sectionTitle}>
                    {section.title}
                  </ThemedText>
                  {section.items.map((item) => (
                    <ThemedText key={item} type="small">
                      • {item}
                    </ThemedText>
                  ))}
                </View>
              ))}
            </View>
          )}

          {tab === 'Instructions' && (
            <View style={styles.sections}>
              {instructionSections(recipe).map((section) => (
                <View key={section.title} style={styles.section}>
                  <ThemedText type="smallBold" themeColor="tint" style={styles.sectionTitle}>
                    {section.title}
                  </ThemedText>
                  {section.items.map((step, i) => (
                    <ThemedText key={i} type="small">
                      {i + 1}. {step}
                    </ThemedText>
                  ))}
                </View>
              ))}
            </View>
          )}

          {tab === 'Reviews' && (
            <View style={styles.sections}>
              {dishReviews(recipe).map((review, i) => (
                <View key={i} style={[styles.review, { backgroundColor: theme.backgroundElement }]}>
                  <View style={styles.lineRow}>
                    <ThemedText type="smallBold">{review.user}</ThemedText>
                    <ThemedText type="small" themeColor="tint">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {review.text}
                  </ThemedText>
                </View>
              ))}
              <ThemedText type="small" themeColor="textSecondary" style={styles.placeholderNote}>
                Reviews are placeholders — real user reviews land here later.
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      <SaveToCookbookSheet recipeId={saveOpen ? recipe.id : null} onClose={() => setSaveOpen(false)} />

      {planOpen && (
        <AddToPlanSheet
          title={recipe.title}
          onClose={() => setPlanOpen(false)}
          onConfirm={handleAddToPlan}
        />
      )}

      {cookingOpen && <CookingMode recipe={recipe} onClose={() => setCookingOpen(false)} />}

      <ConfirmModal
        visible={confirmRemove}
        title="Remove from list?"
        message={`${recipe.title}'s ingredients will be taken off your shopping list.`}
        confirmLabel="Remove"
        cancelLabel="Keep"
        onConfirm={() => {
          toggleGrocery(recipe.id);
          setFlash('Removed from your list');
        }}
        onClose={() => setConfirmRemove(false)}
      />
    </ThemedView>
  );
}

function ActionButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: active ? theme.tint : theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <ThemedText style={styles.actionIcon}>{icon}</ThemedText>
      <ThemedText type="smallBold" themeColor={active ? 'onTint' : 'tint'} numberOfLines={1}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.lineRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

function Feature({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.feature, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  content: {
    alignItems: 'center',
  },
  thumb: {
    width: '100%',
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButton: {
    position: 'absolute',
    bottom: Spacing.three,
    right: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
  },
  iconButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  infoPanel: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  action: {
    flexGrow: 1,
    flexBasis: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
  },
  actionIcon: { fontSize: 18, lineHeight: 22 },
  cookButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  cookButtonText: { fontSize: 16, lineHeight: 22 },
  menuFlash: {
    textAlign: 'center',
  },
  titleBlock: {
    gap: Spacing.two,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  feature: {
    ...Shadow,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    gap: Spacing.half,
    flexGrow: 1,
  },
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
  sections: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  review: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.two,
  },
  placeholderNote: {
    textAlign: 'center',
    paddingTop: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
