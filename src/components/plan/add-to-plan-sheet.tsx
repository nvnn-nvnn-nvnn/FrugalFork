import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEEKDAYS, weekDates, weekdayIndex } from '@/lib/week/dates';

const SERVINGS = [1, 2, 3, 4];

type Props = {
  /** Optional dish title shown in the header. */
  title?: string;
  onClose: () => void;
  onConfirm: (day: number, servings: number) => void;
};

/**
 * Reusable bottom-sheet for scheduling a dish: pick a day of the week and how
 * many servings (1–4). Mount it conditionally so its state resets each open.
 */
export function AddToPlanSheet({ title, onClose, onConfirm }: Props) {
  const theme = useTheme();
  const week = weekDates(new Date());
  const [day, setDay] = useState(() => weekdayIndex(new Date()));
  const [servings, setServings] = useState(1);

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} accessibilityLabel="Close" onPress={onClose} />
        <ThemedView style={styles.sheet}>
          <View style={styles.head}>
            <ThemedText type="subtitle">Add to plan</ThemedText>
            {title ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {title}
              </ThemedText>
            ) : null}
          </View>

          <ThemedText type="smallBold" themeColor="textSecondary">
            Day
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayRow}>
            {WEEKDAYS.map((label, d) => {
              const on = d === day;
              return (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => setDay(d)}
                  style={[
                    styles.dayChip,
                    { backgroundColor: on ? theme.tint : theme.backgroundElement },
                  ]}>
                  <ThemedText type="small" themeColor={on ? 'onTint' : 'textSecondary'}>
                    {label}
                  </ThemedText>
                  <ThemedText type="smallBold" themeColor={on ? 'onTint' : 'text'} style={styles.dayNum}>
                    {week[d].getDate()}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          <ThemedText type="smallBold" themeColor="textSecondary">
            Servings
          </ThemedText>
          <View style={styles.servingsRow}>
            {SERVINGS.map((n) => {
              const on = n === servings;
              return (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${n} serving${n > 1 ? 's' : ''}`}
                  onPress={() => setServings(n)}
                  style={[
                    styles.servingChip,
                    { backgroundColor: on ? theme.tint : theme.backgroundElement },
                  ]}>
                  <ThemedText type="smallBold" themeColor={on ? 'onTint' : 'text'}>
                    {n}
                  </ThemedText>
                </Pressable>
              );
            })}
            <ThemedText type="small" themeColor="textSecondary" style={styles.servingsHint}>
              serving{servings > 1 ? 's' : ''}
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onConfirm(day, servings);
              onClose();
            }}
            style={({ pressed }) => [
              styles.confirm,
              { backgroundColor: theme.tint },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" themeColor="onTint">
              Add to {WEEKDAYS[day]} · {servings} serving{servings > 1 ? 's' : ''}
            </ThemedText>
          </Pressable>

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
  head: { gap: Spacing.half, paddingBottom: Spacing.two },
  dayRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  dayChip: {
    width: 56,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: Spacing.half,
  },
  dayNum: { fontSize: 18, lineHeight: 22 },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  servingChip: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsHint: { marginLeft: Spacing.one },
  confirm: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  cancel: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: { opacity: 0.7 },
});
