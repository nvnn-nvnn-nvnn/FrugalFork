import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  /** Whether completed items are currently hidden (drives the toggle label). */
  completedHidden: boolean;
  onClose: () => void;
  onShopOnline: () => void;
  onToggleCompleted: () => void;
  onMarkAll: () => void;
  onShare: () => void;
  onPrint: () => void;
};

/** The Shop's top-right "⋯" menu — list-level actions. */
export function ShopMenuSheet({
  visible,
  completedHidden,
  onClose,
  onShopOnline,
  onToggleCompleted,
  onMarkAll,
  onShare,
  onPrint,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} accessibilityLabel="Close" onPress={onClose} />
        <ThemedView style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={[styles.handle, { backgroundColor: theme.backgroundSelected }]} />

          <View style={styles.header}>
            <ThemedText type="subtitle">List options</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                ✕
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.list}>
            <Row icon="🛒" label="Shop online" hint="Order from a grocery service" onPress={run(onShopOnline)} />
            <Row
              icon={completedHidden ? '👁️' : '🙈'}
              label={completedHidden ? 'Show completed items' : 'Hide completed items'}
              onPress={run(onToggleCompleted)}
            />
            <Row icon="✅" label="Mark all items complete" onPress={run(onMarkAll)} />
            <Row icon="📤" label="Share items" hint="Send your list as text" onPress={run(onShare)} />
            <Row icon="🖨️" label="Print" onPress={run(onPrint)} />
          </View>
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
  hint?: string;
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
        {hint ? (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        ) : null}
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
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    gap: Spacing.three,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20, lineHeight: 26 },
  body: { flex: 1, gap: Spacing.half },
  chevron: { lineHeight: 28 },
  pressed: { opacity: 0.7 },
});
