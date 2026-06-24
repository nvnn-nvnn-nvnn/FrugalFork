import { StyleSheet, Text } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { useState } from 'react';
import { scheduleOnRN } from 'react-native-worklets';

import { Brand } from '@/constants/theme';

const DURATION = 1100;

/**
 * SnackPlan launch splash: the wordmark pops in over the brand color, the layer
 * holds briefly, then fades to reveal the decision screen. No Expo branding.
 */
export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: { opacity: 1 },
    65: { opacity: 1 },
    100: { opacity: 0, easing: Easing.out(Easing.quad) },
  });

  const popIn = new Keyframe({
    0: { opacity: 0, transform: [{ scale: 0.85 }] },
    45: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.elastic(0.9) },
    100: { opacity: 1, transform: [{ scale: 1 }] },
  });

  return (
    <Animated.View
      style={styles.overlay}
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) scheduleOnRN(setVisible, false);
      })}>
      <Animated.View style={styles.row} entering={popIn.duration(DURATION)}>
        <Text style={styles.emoji}>🍳</Text>
        <Text style={styles.wordmark}>SnackPlan</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Brand,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 40,
  },
  wordmark: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
