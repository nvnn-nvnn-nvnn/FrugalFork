import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** Start creating a new cookbook. */
  onPress: () => void;
};

/**
 * Bottom-right action button for the Cookbook tab — creates a new cookbook.
 * (Adding recipes lives in the header "⋯" menu.) Rendered at the screen root,
 * above the scroll, so it stays put.
 */
export function CookbookFab({ onPress }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New cookbook"
        onPress={onPress}
        style={({ pressed }) => [
          styles.fab,
          Shadow,
          { backgroundColor: theme.tint },
          pressed && styles.pressed,
        ]}>
        <ThemedText themeColor="onTint" style={styles.fabIcon}>
          +
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: Spacing.four,
    bottom: BottomTabInset + Spacing.four,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 34, lineHeight: 40, fontWeight: '400' },
  pressed: { opacity: 0.85 },
});
