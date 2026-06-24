import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MAX_COOKBOOKS, useCookbook } from '@/lib/cookbook/context';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called with the new cookbook's id once created. */
  onCreated?: (id: string) => void;
};

/** Bottom-sheet to name and create a new cookbook (opened from the FAB). */
export function NewCookbookSheet({ visible, onClose, onCreated }: Props) {
  const theme = useTheme();
  const { cookbooks, createCookbook } = useCookbook();
  const [name, setName] = useState('');

  if (!visible) return null;
  const atCap = cookbooks.length >= MAX_COOKBOOKS;

  const submit = () => {
    const id = createCookbook(name);
    if (id) {
      setName('');
      onCreated?.(id);
      onClose();
    }
  };

  const close = () => {
    setName('');
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} accessibilityLabel="Close" onPress={close} />
      <ThemedView style={styles.sheet}>
        <ThemedText type="subtitle">New cookbook</ThemedText>

        {atCap ? (
          <ThemedText type="small" themeColor="textSecondary">
            You&apos;ve reached the limit of {MAX_COOKBOOKS} cookbooks. Delete one to add another.
          </ThemedText>
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Give it a name — you can save dishes into it from Discover.
            </ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Weeknight dinners"
              placeholderTextColor={theme.textSecondary}
              autoFocus
              onSubmitEditing={submit}
              style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            />
            <Pressable
              accessibilityRole="button"
              onPress={submit}
              style={({ pressed }) => [
                styles.createButton,
                { backgroundColor: theme.tint },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" themeColor="onTint">
                Create cookbook
              </ThemedText>
            </Pressable>
          </>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={close}
          style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" themeColor="tint">
            {atCap ? 'Close' : 'Cancel'}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </View>
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
    paddingBottom: Spacing.six,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    gap: Spacing.three,
  },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    fontSize: 16,
    fontFamily: Fonts?.sans,
  },
  createButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  doneButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: { opacity: 0.7 },
});
