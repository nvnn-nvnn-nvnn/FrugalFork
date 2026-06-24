import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const OVER_COLOR = '#E5484D';

type Props = {
  label: string;
  amount: number;
  budget: number | null;
};

/** A spend-vs-budget bar. Turns red when over budget. */
export function BudgetBar({ label, amount, budget }: Props) {
  const theme = useTheme();

  const hasBudget = budget != null && budget > 0;
  const ratio = hasBudget ? Math.min(amount / budget, 1) : 0;
  const over = hasBudget && amount > budget;
  const fillColor = over ? OVER_COLOR : theme.tint;

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="smallBold" themeColor={over ? undefined : 'textSecondary'} style={over ? { color: OVER_COLOR } : undefined}>
          ${amount.toFixed(2)}
          {hasBudget ? ` / $${budget.toFixed(0)}` : ''}
        </ThemedText>
      </View>

      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: fillColor }]} />
      </View>

      {hasBudget && (
        <ThemedText type="small" themeColor="textSecondary">
          {over
            ? `$${(amount - budget).toFixed(2)} over budget`
            : `$${(budget - amount).toFixed(2)} left this week`}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
});
