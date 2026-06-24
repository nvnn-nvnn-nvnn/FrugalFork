import { StyleSheet, View } from 'react-native';

import { SettingsScaffold } from '@/components/settings/settings-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AboutScreen() {
  const theme = useTheme();

  return (
    <SettingsScaffold title="About" subtitle="Decide what to eat — without the planning grind.">
      <ThemedText themeColor="textSecondary">
        SnackPlan is a decision-first food app. Instead of making you build a full meal plan, it
        gives you a few good options at a time and learns from what you pick.
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Everything you tell us — your diets, budget, favorites, and saved dishes — stays on your
        device. No accounts in the cloud, no tracking.
      </ThemedText>

      <View style={[styles.meta, { backgroundColor: theme.backgroundElement }]}>
        <Row label="Version" value="1.0.0" />
        <Row label="Made by" value="The SnackPlan kitchen" />
      </View>
    </SettingsScaffold>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  meta: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
