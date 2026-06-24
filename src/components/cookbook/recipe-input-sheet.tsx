import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Bring a recipe in from a Pinterest / web link. */
  onImport: () => void;
  /** Enter a recipe by hand. */
  onUpload: () => void;
  /** OCR a recipe from a screenshot or the camera. */
  onScan: () => void;
};

/** The cookbook's top-right "⋯" menu: the three ways to add a recipe. */
export function RecipeInputSheet({ visible, onClose, onImport, onUpload, onScan }: Props) {
  if (!visible) return null;
  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} accessibilityLabel="Close" onPress={onClose} />
        <ThemedView style={styles.sheet}>
          <ThemedText type="subtitle">Add a recipe</ThemedText>

          <Row
            icon="📌"
            label="Import a recipe"
            hint="Paste a Pinterest or web link"
            onPress={onImport}
          />
          <Row
            icon="✏️"
            label="Create a recipe"
            hint="Type it in yourself"
            onPress={onUpload}
          />
          <Row
            icon="📷"
            label="Scan a recipe"
            hint="From a screenshot or your camera (OCR)"
            onPress={onScan}
          />

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Cancel
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}

function Row({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: string;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconTile, { backgroundColor: theme.background }]}>
        <ThemedText style={styles.icon}>{icon}</ThemedText>
      </View>
      <View style={styles.body}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      </View>
      <ThemedText type="subtitle" themeColor="textSecondary" style={styles.chevron}>
        ›
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22, lineHeight: 28 },
  body: { flex: 1, gap: Spacing.half },
  chevron: { lineHeight: 28 },
  cancel: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  pressed: { opacity: 0.7 },
});
