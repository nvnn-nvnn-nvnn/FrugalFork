import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called with the pasted URL when the user taps Import. */
  onSubmit: (url: string) => void;
};

/** Paste a Pinterest / recipe link to import it. The host handles the fetch. */
export function ImportLinkSheet({ visible, onClose, onSubmit }: Props) {
  const theme = useTheme();
  const [url, setUrl] = useState('');
  if (!visible) return null;

  const looksLikeUrl = /^https?:\/\/\S+\.\S+/.test(url.trim());
  const submit = () => {
    if (!looksLikeUrl) return;
    onSubmit(url.trim());
    setUrl('');
  };

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} accessibilityLabel="Close" onPress={onClose} />
        <ThemedView style={styles.sheet}>
          <ThemedText type="subtitle">Import a recipe</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Paste a link from Pinterest or any recipe site.
          </ThemedText>

          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://…"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            autoFocus
            onSubmitEditing={submit}
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />

          <Pressable
            accessibilityRole="button"
            disabled={!looksLikeUrl}
            onPress={submit}
            style={({ pressed }) => [
              styles.importBtn,
              { backgroundColor: looksLikeUrl ? theme.tint : theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" themeColor={looksLikeUrl ? 'onTint' : 'textSecondary'}>
              Import
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
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    fontSize: 14,
    fontFamily: Fonts?.sans,
    marginTop: Spacing.one,
  },
  importBtn: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  cancel: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: { opacity: 0.7 },
});
