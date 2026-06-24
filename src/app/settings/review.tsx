import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { SettingsScaffold } from '@/components/settings/settings-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Where a real "rate us" button would send people once we ship to the stores. */
const STORE_URL = 'https://snackplan.app';

export default function ReviewScreen() {
  const theme = useTheme();
  const [rating, setRating] = useState(0);

  return (
    <SettingsScaffold title="Review" subtitle="Enjoying SnackPlan? A rating helps a lot.">
      <View style={[styles.stars, { backgroundColor: theme.backgroundElement }]}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
            onPress={() => setRating(n)}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedText style={styles.star} themeColor={n <= rating ? 'tint' : 'textSecondary'}>
              {n <= rating ? '★' : '☆'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {rating > 0 ? (
        <ThemedText themeColor="textSecondary">
          {rating >= 4
            ? 'Thank you! Tap below to leave your rating on the store.'
            : 'Thanks for the honesty — tell us what we can do better in Contact.'}
        </ThemedText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => Linking.openURL(STORE_URL)}
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: theme.tint },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="smallBold" themeColor="onTint">
          Rate on the store
        </ThemedText>
      </Pressable>
    </SettingsScaffold>
  );
}

const styles = StyleSheet.create({
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
    borderRadius: Radius.lg,
  },
  star: { fontSize: 40, lineHeight: 48 },
  cta: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
  },
  pressed: { opacity: 0.7 },
});
