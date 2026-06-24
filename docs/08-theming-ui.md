# 08 — Theming & UI

A small, dependency-free design system: a color/spacing scale + two themed
primitives + a brand accent.

## Files

| File | Role |
|------|------|
| `src/constants/theme.ts` | Colors (light/dark), Brand accent, Fonts, Spacing scale |
| `src/hooks/use-theme.ts` | Returns the active color set for the current scheme |
| `src/hooks/use-color-scheme.ts` | Light/dark detection (`.web.ts` variant for web) |
| `src/components/themed-text.tsx` | `<ThemedText type=... themeColor=... />` |
| `src/components/themed-view.tsx` | `<ThemedView type=... />` |
| `src/components/animated-icon.tsx` | Branded launch splash (`.web.tsx` = no-op) |
| `src/components/app-tabs.tsx` | Native bottom tabs (`.web.tsx` = custom web bar) |

## Colors & brand (`theme.ts`)

- `Colors.light` / `Colors.dark` — `text`, `background`, `backgroundElement`
  (cards), `backgroundSelected`, `textSecondary`, `tint`, `onTint`.
- **`Brand = '#FF6A2C'`** — a warm orange. Exposed as `tint` in both themes;
  `onTint` is the text color on the accent. Used for primary buttons, selected
  states, the budget bar fill, today highlights, and the splash background.
- `Fonts` — platform font families (sans/serif/rounded/mono).
- **`Spacing`** — the scale everything uses:
  `half=2, one=4, two=8, three=16, four=24, five=32, six=64`.
- `BottomTabInset` — extra bottom padding so content clears the tab bar
  (iOS 50 / Android 80). `MaxContentWidth = 800` keeps things readable on web/tablet.

## Themed primitives

- `useTheme()` returns the right `Colors[...]` object for light/dark.
- `ThemedText` — typography variants (`title`, `subtitle`, `small`, `smallBold`,
  `code`, …) and `themeColor` to pick a palette color.
- `ThemedView` — a `View` whose background comes from a theme color key.

Using these everywhere is what makes light/dark "just work."

## Splash (`animated-icon.tsx`)

`AnimatedSplashOverlay` shows the 🍳 **SnackPlan** wordmark on the brand color,
holds briefly, then fades out (Reanimated `Keyframe`). It sits on top of the app
during initial load and removes itself. The original Expo-logo splash was replaced.

## Tabs (`app-tabs.tsx` + `app-tabs.web.tsx`)

- **Native**: `NativeTabs` with four triggers — `index` (Decide), `plan` (Plan),
  `shop` (Shop), `staples` (Staples). Tab `name` must match the route filename in
  `src/app/`. Icons currently reuse the starter PNGs (placeholders).
- **Web**: a custom top bar via `expo-router/ui` (`Tabs/TabList/TabTrigger`) with a
  "🍳 SnackPlan" wordmark and the same four routes.

## Layout conventions

- Screens are wrapped in `ThemedView` + a `ScrollView` and pad with
  `insets.top + Spacing.four` (top) and `BottomTabInset + Spacing.four` (bottom).
- Content is centered with a `maxWidth: MaxContentWidth` inner column.
- Spacing between sections uses the `Spacing` scale (mostly `three`/`four`/`five`).

This is also why a missing `SafeAreaProvider` caused the early Android layout bug —
the insets read as 0. It's now provided at the root in `_layout.tsx`.
