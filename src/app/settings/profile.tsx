import { StyleSheet, TextInput, View } from 'react-native';

import { SettingsScaffold } from '@/components/settings/settings-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useProfile } from '@/lib/profile/context';

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, update } = useProfile();

  return (
    <SettingsScaffold
      title="Profile"
      subtitle="Your account lives on this device. Changes save automatically.">
      <View style={styles.field}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Name
        </ThemedText>
        <TextInput
          value={profile.name}
          onChangeText={(name) => update({ name })}
          placeholder="Your name"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="words"
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Email
        </ThemedText>
        <TextInput
          value={profile.email}
          onChangeText={(email) => update({ email })}
          placeholder="you@example.com"
          placeholderTextColor={theme.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        SnackPlan is privacy-first — your name and email never leave this device.
      </ThemedText>
    </SettingsScaffold>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    fontSize: 16,
    fontFamily: Fonts?.sans,
  },
});
