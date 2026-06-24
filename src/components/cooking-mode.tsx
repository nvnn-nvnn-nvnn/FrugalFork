import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { instructionSections } from '@/lib/plan/dish-detail';
import { type Recipe } from '@/lib/plan/types';

type Props = {
  recipe: Recipe;
  onClose: () => void;
};

/**
 * Fullscreen, one-step-at-a-time cooking walkthrough. Each step fills the screen;
 * "Next step" advances, the ✕ closes. Steps come from the recipe's instructions.
 */
export function CookingMode({ recipe, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const steps = instructionSections(recipe).flatMap((section) =>
    section.items.map((text) => ({ label: section.title, text })),
  );
  const [i, setI] = useState(0);

  const total = steps.length;
  const step = steps[i];
  const isLast = i >= total - 1;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <ThemedView style={[styles.root, { paddingTop: insets.top + Spacing.two }]}>
        {/* Header: dish + progress + close */}
        <View style={styles.header}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
            {recipe.emoji} {recipe.title}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close cooking mode"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">✕</ThemedText>
          </Pressable>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.tint, width: `${total ? ((i + 1) / total) * 100 : 0}%` },
            ]}
          />
        </View>

        {/* The step itself */}
        <Animated.View key={i} entering={FadeIn.duration(220)} style={styles.content}>
          {step ? (
            <>
              <ThemedText type="smallBold" themeColor="tint" style={styles.stepLabel}>
                {step.label.toUpperCase()}
              </ThemedText>
              <ThemedText type="title" style={styles.stepNum}>
                Step {i + 1}
              </ThemedText>
              <ThemedText style={styles.stepText}>{step.text}</ThemedText>
            </>
          ) : (
            <ThemedText themeColor="textSecondary">No steps for this dish yet.</ThemedText>
          )}
        </Animated.View>

        {/* Bottom controls */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={styles.bottomTop}>
            {i > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setI((n) => n - 1)}
                style={({ pressed }) => [pressed && styles.pressed]}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  ‹ Back
                </ThemedText>
              </Pressable>
            ) : (
              <View />
            )}
            <ThemedText type="small" themeColor="textSecondary">
              {total ? `Step ${i + 1} of ${total}` : ''}
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => (isLast ? onClose() : setI((n) => n + 1))}
            style={({ pressed }) => [
              styles.nextBtn,
              { backgroundColor: theme.tint },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" themeColor="onTint" style={styles.nextText}>
              {isLast ? '✓ Done cooking' : 'Next step →'}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  title: { flex: 1 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  stepLabel: { letterSpacing: 1 },
  stepNum: { fontSize: 40, lineHeight: 46 },
  stepText: { fontSize: 24, lineHeight: 34, fontWeight: '500' },
  bottom: { gap: Spacing.three },
  bottomTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextBtn: {
    paddingVertical: Spacing.four,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  nextText: { fontSize: 18, lineHeight: 24 },
  pressed: { opacity: 0.7 },
});
