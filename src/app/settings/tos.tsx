import { StyleSheet, View } from 'react-native';

import { SettingsScaffold } from '@/components/settings/settings-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type Clause = { heading: string; body: string };

const CLAUSES: Clause[] = [
  {
    heading: '1. The basics',
    body: 'SnackPlan helps you decide what to eat. By using the app you agree to these terms. If you don’t agree, please don’t use the app.',
  },
  {
    heading: '2. Your data',
    body: 'Your profile, preferences, and saved dishes are stored on your device. You are responsible for backing up your device. We can’t recover data we never receive.',
  },
  {
    heading: '3. Recipes & nutrition',
    body: 'Costs, calories, and prep times are estimates for guidance only. Always check ingredients yourself for allergies and dietary needs.',
  },
  {
    heading: '4. No warranty',
    body: 'SnackPlan is provided “as is”, without warranties of any kind. We’re not liable for any loss arising from your use of the app.',
  },
  {
    heading: '5. Changes',
    body: 'We may update these terms as the app evolves. Continued use after an update means you accept the revised terms.',
  },
];

export default function TosScreen() {
  return (
    <SettingsScaffold title="Terms of Service" subtitle="Last updated June 2026.">
      {CLAUSES.map((clause) => (
        <View key={clause.heading} style={styles.clause}>
          <ThemedText type="smallBold">{clause.heading}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {clause.body}
          </ThemedText>
        </View>
      ))}
    </SettingsScaffold>
  );
}

const styles = StyleSheet.create({
  clause: { gap: Spacing.two },
});
