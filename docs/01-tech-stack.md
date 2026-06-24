# 01 — Tech Stack

Everything here is **Expo + React Native + TypeScript**. No backend yet — all data
lives on the device.

## Core

| Library | Version | What it does |
|---------|---------|--------------|
| **Expo** | SDK ~56 | The framework/toolchain that wraps React Native (build, dev server, native modules). |
| **React Native** | 0.85.3 | The UI runtime — renders native views from React components. |
| **React** | 19.2 | Component model / hooks. |
| **TypeScript** | ~6.0 | Static types across the whole app. |
| **expo-router** | ~56.2 | **File-based routing.** Files in `src/app/` become screens/routes. |

> ⚠️ Expo SDK 56 is a fast-moving version. Always check the versioned docs at
> https://docs.expo.dev/versions/v56.0.0/ before changing native config (this is
> also noted in `AGENTS.md`).

## Navigation & layout

- **`expo-router/unstable-native-tabs`** — the bottom tab bar on iOS/Android uses
  *native* tab components. See `src/components/app-tabs.tsx`.
- **`expo-router/ui`** (`Tabs`, `TabList`, `TabTrigger`) — a custom web tab bar.
  See `src/components/app-tabs.web.tsx`. (React Native picks `.web.tsx` files on web.)
- **react-native-safe-area-context** — notch / status-bar / gesture-bar insets.
  A `SafeAreaProvider` wraps the app in `_layout.tsx`; screens use
  `useSafeAreaInsets()` to pad correctly.
- **react-native-screens** — native screen optimization (used by the router).

## Storage

- **@react-native-async-storage/async-storage** — simple key/value persistence on
  device. We wrap it with JSON helpers in `src/lib/storage.ts`. This is how the
  profile, week plan, and spend survive app restarts.

## UI / animation

- **react-native-reanimated** (+ **react-native-worklets**) — high-performance
  animations. Used for the launch splash (`src/components/animated-icon.tsx`).
- **react-native-gesture-handler** — gesture system (required by the router/UI libs).
- **expo-image**, **expo-symbols**, **expo-glass-effect**, **expo-splash-screen**,
  **expo-font**, **expo-status-bar**, **expo-system-ui** — assorted Expo UI modules
  from the starter (icons, splash, fonts, theming hooks).

## Conventions

- **Path alias `@/`** maps to `src/` (see `tsconfig.json`). Import as
  `@/components/...`, `@/lib/...`.
- **Platform files**: `foo.web.tsx` overrides `foo.tsx` on web.
- **Styling**: plain `StyleSheet.create` + a shared spacing/color scale in
  `src/constants/theme.ts`. No CSS-in-JS library.

## Running it

```bash
cd SnackPlan
npm install           # if node_modules isn't present
npm run start         # Expo dev server (press a=Android, i=iOS, w=web)
npm run android       # straight to Android
npm run web           # straight to web
```

Type-check (no build):

```bash
npx tsc --noEmit -p tsconfig.json
```

> Note: the dev machine had an older Node (20.13). Expo SDK 56 prefers Node
> ≥ 20.19. It still runs, but upgrading Node removes the engine warnings.
