import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { SettingsScaffold } from '@/components/settings/settings-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SUPPORT_EMAIL = 'hello@snackplan.app';

export default function ContactScreen() {
  const theme = useTheme();

  return (
    <SettingsScaffold title="Contact" subtitle="Questions, bugs, or ideas — we read every message.">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}>
        <ThemedText style={styles.icon}>✉️</ThemedText>
        <View style={styles.body}>
          <ThemedText type="smallBold">Email us</ThemedText>
          <ThemedText type="small" themeColor="tint">
            {SUPPORT_EMAIL}
          </ThemedText>
        </View>
        <ThemedText type="subtitle" themeColor="textSecondary" style={styles.chevron}>
          ›
        </ThemedText>
      </Pressable>

      <ThemedText type="small" themeColor="textSecondary">
        We typically reply within a couple of business days.
      </ThemedText>
    </SettingsScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  icon: { fontSize: 22, lineHeight: 28, width: 28, textAlign: 'center' },
  body: { flex: 1, gap: Spacing.half },
  chevron: { lineHeight: 28 },
  pressed: { opacity: 0.7 },
});
