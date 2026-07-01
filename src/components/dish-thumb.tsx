import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useDishImages } from '@/lib/dish-image/context';

/**
 * A dish's thumbnail: its photo if one's been set, otherwise the emoji on its
 * colored tile. Drop-in for the emoji-tile pattern used across the app — pass
 * the tile dimensions via `style`.
 */
type Props = {
  recipeId: string;
  emoji: string;
  /** The dish's baked-in image (curated dishes). A user's own photo wins over it. */
  image?: string;
  /** Emoji size used for the fallback (when there's no photo). */
  emojiSize: number;
  /** Corner radius of the tile. */
  radius: number;
  /** Tile background (shown behind the emoji; ignored when a photo fills it). */
  backgroundColor: string;
  /** Dimensions — width/height, aspectRatio, or absoluteFill. */
  style?: StyleProp<ViewStyle>;
};

export function DishThumb({ recipeId, emoji, image, emojiSize, radius, backgroundColor, style }: Props) {
  const { getImage } = useDishImages();
  // Precedence: the user's own per-device photo → the dish's baked-in image → emoji.
  const uri = getImage(recipeId) ?? image;

  return (
    <View style={[styles.base, { borderRadius: radius, backgroundColor }, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <ThemedText style={{ fontSize: emojiSize, lineHeight: emojiSize * 1.18 }}>{emoji}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
