import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_COOKBOOK_ID, useCookbook } from '@/lib/cookbook/context';
import { SLOTS, type Recipe } from '@/lib/plan/types';
import { useRecipes } from '@/lib/recipes/context';

const EMOJI_CHOICES = ['🍽️', '🍝', '🍜', '🥗', '🌮', '🍳', '🥘', '🍲', '🥪', '🍚', '🍕', '🍛'];

type IngredientDraft = { name: string; qty: string; cost: string };

const round = (n: number) => Math.round(n * 100) / 100;

export default function NewRecipeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cookbooks, toggleDish } = useCookbook();
  const { addRecipe } = useRecipes();

  const [emoji, setEmoji] = useState('🍽️');
  const [title, setTitle] = useState('');
  const [calories, setCalories] = useState('');
  const [health, setHealth] = useState('');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([{ name: '', qty: '', cost: '' }]);
  const [steps, setSteps] = useState<string[]>(['']);
  const [cookbookId, setCookbookId] = useState(cookbooks[0]?.id ?? DEFAULT_COOKBOOK_ID);

  const cleanIngredients = ingredients
    .filter((i) => i.name.trim())
    .map((i) => ({
      name: i.name.trim().toLowerCase(),
      qty: i.qty.trim() || '1',
      cost: Number(i.cost) || 0,
    }));
  const estCost = round(cleanIngredients.reduce((s, i) => s + i.cost, 0));
  const valid = title.trim().length > 0 && cleanIngredients.length > 0;

  const setIngredient = (idx: number, patch: Partial<IngredientDraft>) =>
    setIngredients((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const create = useCallback(() => {
    const clean = ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name.trim().toLowerCase(), qty: i.qty.trim() || '1', cost: Number(i.cost) || 0 }));
    if (!title.trim() || clean.length === 0) return;
    const cost = round(clean.reduce((s, i) => s + i.cost, 0));
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
    const recipe: Recipe = {
      id: `user-${Date.now()}`,
      title: title.trim(),
      emoji: emoji || '🍽️',
      slots: [...SLOTS],
      cost,
      calories: Number(calories) || 0,
      health: health.trim() || 'homemade',
      cheap: cost <= 3,
      tags: [],
      contains: [],
      ingredients: clean,
      steps: cleanSteps.length ? cleanSteps : undefined,
      userCreated: true,
    };
    addRecipe(recipe);
    toggleDish(cookbookId, recipe.id); // file it into the chosen cookbook
    router.replace({ pathname: '/dish/[id]', params: { id: recipe.id } });
  }, [ingredients, title, steps, emoji, calories, health, cookbookId, addRecipe, toggleDish, router]);

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: BottomTabInset + Spacing.six },
        ]}>
        <View style={styles.inner}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.back,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">‹ Cancel</ThemedText>
          </Pressable>

          <ThemedText type="title">New recipe</ThemedText>

          {/* Emoji + title */}
          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Icon
            </ThemedText>
            <View style={styles.emojiRow}>
              {EMOJI_CHOICES.map((e) => {
                const on = e === emoji;
                return (
                  <Pressable
                    key={e}
                    accessibilityRole="button"
                    onPress={() => setEmoji(e)}
                    style={({ pressed }) => [
                      styles.emojiTile,
                      { backgroundColor: theme.backgroundElement, borderColor: on ? theme.tint : 'transparent' },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText style={styles.emoji}>{e}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Title
            </ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Garlic butter pasta"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            />
          </View>

          <View style={styles.twoCol}>
            <View style={[styles.field, styles.col]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Calories / serving
              </ThemedText>
              <TextInput
                value={calories}
                onChangeText={(t) => setCalories(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              />
            </View>
            <View style={[styles.field, styles.col]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Health note
              </ThemedText>
              <TextInput
                value={health}
                onChangeText={setHealth}
                placeholder="high protein"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              />
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.field}>
            <View style={styles.sectionHead}>
              <ThemedText type="subtitle">Ingredients</ThemedText>
              <ThemedText type="smallBold" themeColor="textSecondary">
                ~${estCost.toFixed(2)}
              </ThemedText>
            </View>
            {ingredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientRow}>
                <TextInput
                  value={ing.name}
                  onChangeText={(t) => setIngredient(idx, { name: t })}
                  placeholder="ingredient"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, styles.ingName, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                />
                <TextInput
                  value={ing.qty}
                  onChangeText={(t) => setIngredient(idx, { qty: t })}
                  placeholder="qty"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, styles.ingQty, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                />
                <TextInput
                  value={ing.cost}
                  onChangeText={(t) => setIngredient(idx, { cost: t.replace(/[^0-9.]/g, '') })}
                  keyboardType="decimal-pad"
                  placeholder="$"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, styles.ingCost, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove ingredient"
                  onPress={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                  style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    ✕
                  </ThemedText>
                </Pressable>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setIngredients((prev) => [...prev, { name: '', qty: '', cost: '' }])}
              style={({ pressed }) => [styles.addRow, { borderColor: theme.backgroundSelected }, pressed && styles.pressed]}>
              <ThemedText type="smallBold" themeColor="tint">
                + Add ingredient
              </ThemedText>
            </Pressable>
          </View>

          {/* Steps */}
          <View style={styles.field}>
            <ThemedText type="subtitle">Steps</ThemedText>
            {steps.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <ThemedText type="smallBold" themeColor="tint" style={styles.stepNum}>
                  {idx + 1}
                </ThemedText>
                <TextInput
                  value={step}
                  onChangeText={(t) => setSteps((prev) => prev.map((s, i) => (i === idx ? t : s)))}
                  placeholder="Describe this step…"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  style={[styles.input, styles.stepInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove step"
                  onPress={() => setSteps((prev) => prev.filter((_, i) => i !== idx))}
                  style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    ✕
                  </ThemedText>
                </Pressable>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setSteps((prev) => [...prev, ''])}
              style={({ pressed }) => [styles.addRow, { borderColor: theme.backgroundSelected }, pressed && styles.pressed]}>
              <ThemedText type="smallBold" themeColor="tint">
                + Add step
              </ThemedText>
            </Pressable>
          </View>

          {/* Save into */}
          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Save to cookbook
            </ThemedText>
            <View style={styles.chips}>
              {cookbooks.map((cb) => {
                const on = cb.id === cookbookId;
                return (
                  <Pressable
                    key={cb.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => setCookbookId(cb.id)}
                    style={({ pressed }) => [
                      styles.chip,
                      { backgroundColor: on ? theme.tint : theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold" themeColor={on ? 'onTint' : 'text'}>
                      {cb.icon ? `${cb.icon} ` : ''}
                      {cb.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!valid}
            onPress={create}
            style={({ pressed }) => [
              styles.createButton,
              { backgroundColor: valid ? theme.tint : theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" themeColor={valid ? 'onTint' : 'textSecondary'}>
              Create recipe
            </ThemedText>
          </Pressable>
          {!valid && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
              Add a title and at least one ingredient to create.
            </ThemedText>
          )}
        </View>
      </ScrollView>
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
  back: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.lg,
  },
  field: { gap: Spacing.two },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    fontSize: 16,
    fontFamily: Fonts?.sans,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  emojiTile: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24, lineHeight: 30 },
  twoCol: { flexDirection: 'row', gap: Spacing.three },
  col: { flex: 1 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  ingName: { flex: 1 },
  ingQty: { width: 64, textAlign: 'center' },
  ingCost: { width: 64, textAlign: 'center' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepNum: { width: 18, textAlign: 'center' },
  stepInput: { flex: 1, minHeight: 48 },
  removeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
  },
  createButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  hint: { textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
