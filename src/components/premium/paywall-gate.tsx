import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PLUS_FEATURES, type PlusFeature, usePremium } from '@/lib/premium/context';

/**
 * Gating primitives for SnackPlan Plus.
 *
 * - `<PaywallGate feature>` wraps Plus-only content: renders children when the
 *   user is subscribed, otherwise a locked card that opens the paywall.
 * - `usePlusAction()` gates an *action* (a button press): runs it when Plus,
 *   otherwise routes to the paywall. Use for one-shot actions like "Scan receipt".
 */

export function PaywallGate({
  feature,
  children,
}: {
  feature: PlusFeature;
  children: React.ReactNode;
}) {
  const { has } = usePremium();
  if (has(feature)) return <>{children}</>;
  return <PlusLockCard feature={feature} />;
}

/** The locked-state card shown in place of gated content. */
export function PlusLockCard({ feature }: { feature: PlusFeature }) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Unlock ${PLUS_FEATURES[feature]} with SnackPlan Plus`}
      onPress={() => router.push('/paywall')}
      style={({ pressed }) => [
        styles.card,
        Shadow,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.lockBadge, { backgroundColor: theme.tint }]}>
        <ThemedText type="smallBold" themeColor="onTint">
          ✦
        </ThemedText>
      </View>
      <View style={styles.cardBody}>
        <ThemedText type="eyebrow" themeColor="tint">
          SnackPlan Plus
        </ThemedText>
        <ThemedText type="smallBold">{PLUS_FEATURES[feature]}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tap to unlock
        </ThemedText>
      </View>
      <ThemedText type="subtitle" themeColor="textSecondary" style={styles.chevron}>
        ›
      </ThemedText>
    </Pressable>
  );
}

/**
 * Returns a guard that runs `action` when the user has the feature, otherwise
 * sends them to the paywall. Example:
 *   const guard = usePlusAction();
 *   <Button onPress={() => guard('ocr', scanReceipt)} />
 */
export function usePlusAction() {
  const { has } = usePremium();
  const router = useRouter();
  return (feature: PlusFeature, action: () => void) => {
    if (has(feature)) action();
    else router.push('/paywall');
  };
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  lockBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: Spacing.half },
  chevron: { lineHeight: 28 },
  pressed: { opacity: 0.7 },
});
