import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SettingsScaffold } from '@/components/settings/settings-scaffold';
import { TagInput } from '@/components/tag-input';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DIETS } from '@/lib/plan/diets';
import { useProfile } from '@/lib/profile/context';

const BUDGET_PRESETS = [30, 60, 100, 150];
const FAVORITE_HINTS = ['pizza', 'sushi', 'tacos', 'ramen', 'pasta'];
const USUAL_HINTS = ['eggs', 'salad', 'sandwich', 'stir fry', 'leftovers'];
const STAPLE_HINTS = ['eggs', 'rice', 'pasta', 'canned beans', 'frozen veg', 'onions'];

export default function MealPreferencesScreen() {
  const theme = useTheme();
  const { profile, update } = useProfile();

  const toggleDiet = (diet: string) =>
    update({
      diets: profile.diets.includes(diet)
        ? profile.diets.filter((d) => d !== diet)
        : [...profile.diets, diet],
    });

  const setBudget = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    update({ weeklyGroceryBudget: digits ? Number(digits) : null });
  };

  return (
    <SettingsScaffold
      title="Meal Preferences"
      subtitle="We use this to recommend and plan. Changes save automatically.">
      {/* Dietary lifestyle */}
      <View style={styles.section}>
        <ThemedText type="subtitle">Dietary lifestyle</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          We only plan meals that fit these.
        </ThemedText>
        <View style={styles.chips}>
          {DIETS.map((diet) => {
            const on = profile.diets.includes(diet);
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

      {/* Weekly budget */}
      <View style={styles.section}>
        <ThemedText type="subtitle">Weekly grocery budget</ThemedText>
        <View style={styles.budgetRow}>
          <ThemedText type="title" themeColor="textSecondary">
            $
          </ThemedText>
          <TextInput
            value={profile.weeklyGroceryBudget != null ? String(profile.weeklyGroceryBudget) : ''}
            onChangeText={setBudget}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            style={[styles.budgetInput, { color: theme.text }]}
          />
        </View>
        <View style={styles.chips}>
          {BUDGET_PRESETS.map((amount) => {
            const on = profile.weeklyGroceryBudget === amount;
            return (
              <Pressable
                key={amount}
                accessibilityRole="button"
                onPress={() => update({ weeklyGroceryBudget: amount })}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: on ? theme.tint : theme.backgroundElement,
                    borderColor: on ? theme.tint : theme.backgroundSelected,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" themeColor={on ? 'onTint' : 'textSecondary'}>
                  ${amount}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Favorite meals */}
      <View style={styles.section}>
        <ThemedText type="subtitle">Favorite meals</ThemedText>
        <TagInput
          value={profile.favoriteMeals}
          onChange={(next) => update({ favoriteMeals: next })}
          placeholder="add a favorite…"
          suggestions={FAVORITE_HINTS}
        />
      </View>

      {/* Usual meals */}
      <View style={styles.section}>
        <ThemedText type="subtitle">Usual meals</ThemedText>
        <TagInput
          value={profile.usualMeals}
          onChange={(next) => update({ usualMeals: next })}
          placeholder="add a usual meal…"
          suggestions={USUAL_HINTS}
        />
      </View>

      {/* Staples */}
      <View style={styles.section}>
        <ThemedText type="subtitle">Staples</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          What you usually keep on hand.
        </ThemedText>
        <TagInput
          value={profile.staples}
          onChange={(next) => update({ staples: next })}
          placeholder="add a staple…"
          suggestions={STAPLE_HINTS}
        />
      </View>
    </SettingsScaffold>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
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
    fontSize: 40,
    fontWeight: '600',
    fontFamily: Fonts?.sans,
    padding: 0,
  },
  pressed: { opacity: 0.7 },
});
