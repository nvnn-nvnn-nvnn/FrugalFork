/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** SnackPlan brand accent — a refined burnt orange. Used for primary actions + the icon. */
export const Brand = '#DD5A26';

/**
 * "Warm editorial cookbook" palette: cream paper + ink instead of the generic
 * white-on-cold-gray, with a burnt-orange accent. Warm neutrals (not pure
 * black/white) read as designed rather than default.
 */
export const Colors = {
  light: {
    text: '#211A12', // warm ink
    background: '#FBF6EE', // cream paper
    backgroundElement: '#F2EADD', // raised surface (cards/chips)
    backgroundSelected: '#E7DAC6', // pressed / selected
    textSecondary: '#8A7E6D', // warm gray
    tint: Brand,
    onTint: '#FFFFFF',
  },
  dark: {
    text: '#F3ECE0', // warm off-white
    background: '#16120C', // warm near-black
    backgroundElement: '#221C13',
    backgroundSelected: '#30281C',
    textSecondary: '#A99C88',
    tint: '#EE7038', // a touch brighter for legibility on dark
    onTint: '#FFFFFF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * `serif` is our display face — the loaded **Fraunces** semibold (a characterful
 * editorial serif), the same on every platform. It's loaded in `_layout` before
 * the app renders; if loading ever fails it falls back to the platform serif.
 * `sans` stays the platform system font for body text.
 */
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'Fraunces_600SemiBold',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'Fraunces_600SemiBold',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'Fraunces_600SemiBold',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/**
 * Soft elevation. RN 0.76+ supports cross-platform `boxShadow`, so one token
 * works on iOS / Android / web. Shadows read in light mode; dark mode leans on
 * the raised `backgroundElement` color instead (a black shadow is invisible).
 * Spread into a StyleSheet entry: `card: { ...Shadow, ... }`.
 */
export const Shadow = { boxShadow: '0px 5px 18px rgba(33, 26, 18, 0.07)' } as const;
/** A tighter shadow for small floating controls (badges, pills). */
export const ShadowSoft = { boxShadow: '0px 2px 8px rgba(33, 26, 18, 0.10)' } as const;

/**
 * Corner radii — kept deliberately tight for a sharp, sleek look. These are the
 * single source of truth for roundness; never derive a radius from `Spacing`
 * (those tokens also drive padding, so the two would move together).
 */
export const Radius = {
  /** Chips, small insets, segmented-control thumbs. */
  sm: 4,
  /** Buttons, inputs, list rows. */
  md: 8,
  /** Cards, sheets, the account/avatar tile. */
  lg: 12,
  /** Fully rounded — progress bars, true pills. */
  full: 999,
} as const;

// Space the scrollable content must leave for the bottom tab bar. Web now has a
// bottom nav bar too, so it needs its own inset (it used to fall through to 0).
export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 80 }) ?? 0;
export const MaxContentWidth = 800;
