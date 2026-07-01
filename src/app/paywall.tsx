import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PLUS_FEATURES, PLUS_PRICE, usePremium } from '@/lib/premium/context';

const FEATURE_ICONS: Record<keyof typeof PLUS_FEATURES, string> = {
  ocr: '🧾',
  unlimitedCookbooks: '📚',
  sync: '☁️',
  recipeImport: '🔗',
  autoFillWeek: '🪄',
};

export default function PaywallScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPlus, devSetPlus } = usePremium();

  // SCAFFOLD: real IAP would call purchase() here and flip isPlus on success.
  const onSubscribe = () => {
    devSetPlus(true);
    router.back();
  };

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.five },
        ]}>
        <View style={styles.inner}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.close,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">‹ Not now</ThemedText>
          </Pressable>

          <View style={styles.hero}>
            <ThemedText type="eyebrow" themeColor="tint">
              SnackPlan Plus
            </ThemedText>
            <ThemedText type="title">Eat well, spend less — with the power tools.</ThemedText>
            <ThemedText themeColor="textSecondary">
              The planner, recipe library, and shopping list stay free, forever. Plus unlocks the
              features that scale with you.
            </ThemedText>
          </View>

          <View style={[styles.features, { backgroundColor: theme.backgroundElement }]}>
            {(Object.keys(PLUS_FEATURES) as (keyof typeof PLUS_FEATURES)[]).map((key, i) => (
              <View
                key={key}
                style={[
                  styles.featureRow,
                  i > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.backgroundSelected,
                  },
                ]}>
                <ThemedText style={styles.featureIcon}>{FEATURE_ICONS[key]}</ThemedText>
                <ThemedText type="smallBold" style={styles.featureLabel}>
                  {PLUS_FEATURES[key]}
                </ThemedText>
                <ThemedText type="smallBold" themeColor="tint">
                  ✦
                </ThemedText>
              </View>
            ))}
          </View>

          {isPlus ? (
            <View style={styles.activeBlock}>
              <View style={[styles.activePill, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold">✓ You’re on Plus</ThemedText>
              </View>
              {/* DEV ONLY: lets us re-test the locked state. Remove with real IAP. */}
              <Pressable
                accessibilityRole="button"
                onPress={() => devSetPlus(false)}
                style={({ pressed }) => [pressed && styles.pressed]}>
                <ThemedText type="small" themeColor="textSecondary">
                  Dev: turn off Plus
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.cta}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Subscribe for ${PLUS_PRICE.monthly} per ${PLUS_PRICE.period}`}
                onPress={onSubscribe}
                style={({ pressed }) => [
                  styles.subscribe,
                  Shadow,
                  { backgroundColor: theme.tint },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" themeColor="onTint" style={styles.subscribeText}>
                  Start Plus · {PLUS_PRICE.monthly}/{PLUS_PRICE.period}
                </ThemedText>
              </Pressable>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fineprint}>
                Cancel anytime. Billed monthly through the App Store / Google Play.
              </ThemedText>
            </View>
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
  close: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.lg,
  },
  hero: { gap: Spacing.two },
  features: {
    ...Shadow,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  featureIcon: { fontSize: 20, lineHeight: 26, width: 26, textAlign: 'center' },
  featureLabel: { flex: 1 },
  cta: { gap: Spacing.two, alignItems: 'center' },
  subscribe: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
  },
  subscribeText: { fontSize: 15, lineHeight: 21 },
  fineprint: { textAlign: 'center' },
  activeBlock: { alignItems: 'center', gap: Spacing.two },
  activePill: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
  },
  pressed: { opacity: 0.7 },
});
