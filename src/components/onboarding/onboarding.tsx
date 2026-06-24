import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TagInput } from '@/components/tag-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DIETS } from '@/lib/plan/diets';
import { useProfile } from '@/lib/profile/context';

const FAVORITE_HINTS = ['pizza', 'sushi', 'tacos', 'ramen', 'burgers', 'pasta'];
const USUAL_HINTS = ['eggs', 'salad', 'sandwich', 'stir fry', 'leftovers'];
const BUDGET_PRESETS = [30, 60, 100, 150];

/**
 * First-launch onboarding. Quick questions that seed the planner so day-1 picks
 * aren't cold: favorite meals, usual meals, dietary lifestyle, weekly spend.
 */
export function Onboarding() {
  const theme = useTheme();
  const { completeOnboarding } = useProfile();

  const [step, setStep] = useState(0);
  const [favoriteMeals, setFavoriteMeals] = useState<string[]>([]);
  const [usualMeals, setUsualMeals] = useState<string[]>([]);
  const [diets, setDiets] = useState<string[]>([]);
  const [budgetText, setBudgetText] = useState('');

  const lastStep = 3;
  const onLast = step === lastStep;
  const budget = budgetText ? Number(budgetText) : null;

  const toggleDiet = (diet: string) =>
    setDiets((prev) => (prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]));

  const next = () => {
    if (onLast) {
      completeOnboarding({
        favoriteMeals,
        usualMeals,
        diets,
        weeklyGroceryBudget: Number.isFinite(budget) ? budget : null,
      });
      return;
    }
    setStep((s) => s + 1);
  };

  const canAdvance =
    (step === 0 && favoriteMeals.length > 0) ||
    (step === 1 && usualMeals.length > 0) ||
    step === 2 || // diets are optional
    step === 3;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.progress}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i <= step ? theme.tint : theme.backgroundSelected },
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <View style={styles.stepBlock}>
              <ThemedText type="small" themeColor="tint" style={styles.kicker}>
                WELCOME TO SNACKPLAN
              </ThemedText>
              <ThemedText type="title">What do you love to eat?</ThemedText>
              <ThemedText themeColor="textSecondary">
                A few favorites so we know your taste from day one.
              </ThemedText>
              <View style={styles.inputArea}>
                <TagInput
                  value={favoriteMeals}
                  onChange={setFavoriteMeals}
                  placeholder="add a favorite meal…"
                  suggestions={FAVORITE_HINTS}
                />
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepBlock}>
              <ThemedText type="small" themeColor="tint" style={styles.kicker}>
                YOUR EVERYDAY
              </ThemedText>
              <ThemedText type="title">What do you usually eat?</ThemedText>
              <ThemedText themeColor="textSecondary">
                Your go-to, weeknight, no-thinking-required meals.
              </ThemedText>
              <View style={styles.inputArea}>
                <TagInput
                  value={usualMeals}
                  onChange={setUsualMeals}
                  placeholder="add a usual meal…"
                  suggestions={USUAL_HINTS}
                />
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepBlock}>
              <ThemedText type="small" themeColor="tint" style={styles.kicker}>
                DIETARY LIFESTYLE
              </ThemedText>
              <ThemedText type="title">Any dietary needs?</ThemedText>
              <ThemedText themeColor="textSecondary">
                Pick any that apply — we&apos;ll only plan meals that fit. Skip if none.
              </ThemedText>
              <View style={styles.inputArea}>
                <View style={styles.chips}>
                  {DIETS.map((diet) => {
                    const on = diets.includes(diet);
                    return (
                      <Pressable
                        key={diet}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        onPress={() => toggleDiet(diet)}
                        style={({ pressed }) => [
                          styles.chip,
                          {
                            backgroundColor: on ? theme.tint : theme.backgroundElement,
                            borderColor: on ? theme.tint : theme.backgroundSelected,
                          },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText type="smallBold" themeColor={on ? 'onTint' : 'text'}>
                          {diet}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepBlock}>
              <ThemedText type="small" themeColor="tint" style={styles.kicker}>
                BUDGET
              </ThemedText>
              <ThemedText type="title">Weekly grocery spend?</ThemedText>
              <ThemedText themeColor="textSecondary">
                Roughly. It helps us balance cooking against ordering out.
              </ThemedText>
              <View style={styles.inputArea}>
                <View style={styles.budgetRow}>
                  <ThemedText type="title" themeColor="textSecondary">
                    $
                  </ThemedText>
                  <TextInput
                    value={budgetText}
                    onChangeText={(t) => setBudgetText(t.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.budgetInput, { color: theme.text }]}
                  />
                </View>
                <View style={styles.presets}>
                  {BUDGET_PRESETS.map((amount) => {
                    const selected = budget === amount;
                    return (
                      <Pressable
                        key={amount}
                        accessibilityRole="button"
                        onPress={() => setBudgetText(String(amount))}
                        style={({ pressed }) => [
                          styles.preset,
                          {
                            backgroundColor: selected ? theme.tint : theme.backgroundElement,
                          },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText
                          type="smallBold"
                          themeColor={selected ? 'onTint' : 'textSecondary'}>
                          ${amount}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep((s) => s - 1)}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Back
              </ThemedText>
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}

          <Pressable
            accessibilityRole="button"
            disabled={!canAdvance}
            onPress={next}
            style={({ pressed }) => [
              styles.nextButton,
              { backgroundColor: theme.tint },
              !canAdvance && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" themeColor="onTint">
              {onLast ? 'Start deciding' : 'Continue'}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.five,
  },
  progress: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  stepBlock: {
    gap: Spacing.three,
  },
  kicker: {
    letterSpacing: 1,
    fontWeight: '700',
  },
  inputArea: {
    paddingTop: Spacing.four,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  budgetInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: '600',
    fontFamily: Fonts?.sans,
    padding: 0,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingTop: Spacing.four,
  },
  preset: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  backButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  nextButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});
