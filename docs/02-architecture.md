# 02 — Architecture

## Big picture

```
SafeAreaProvider
└─ ThemeProvider (light/dark)
   └─ ProfileProvider          ← onboarding answers (favorites, usual meals, diets, budget)
      └─ CookbookProvider      ← saved-dish collections (max 3 cookbooks)
         └─ PlanProvider       ← the meal builder (source of truth) + weekly spend
            ├─ AnimatedSplashOverlay  (branded launch animation)
            └─ AppGate
               ├─ not ready  → blank themed screen
               ├─ !onboarded → <Onboarding />
               └─ onboarded  → <Stack>            (root stack)
                                ├─ (tabs)          → <AppTabs/>  (Decide/Plan/Shop/Staples)
                                └─ dish/[id]        → dish detail (pushed over tabs)
```

The tabs live in the `app/(tabs)/` route group so the root `Stack` can push
non-tab screens (like `dish/[id]`) over them. `app/(tabs)/_layout.tsx` renders the
tab bar; `app/_layout.tsx` renders the gate + Stack.

All of this is set up in `src/app/_layout.tsx` (the expo-router root layout).
`AppGate` is the auth-style gate that decides whether to show onboarding or the app.

## State: React Context + AsyncStorage

There is **no Redux / Zustand**. State is plain React Context, one provider per
domain. Each provider:

1. On mount, loads its slice from AsyncStorage (async) and flips a `ready` flag.
2. Exposes the data + action functions via `useXxx()` hooks.
3. On every mutation, writes back to AsyncStorage (write-through).

| Provider | Hook | File | Persists (key in `storage.ts`) |
|----------|------|------|-------------------------------|
| ProfileProvider | `useProfile()` | `src/lib/profile/context.tsx` | `profile` |
| CookbookProvider | `useCookbook()` | `src/lib/cookbook/context.tsx` | `cookbooks` |
| PlanProvider | `usePlan()` | `src/lib/plan/context.tsx` | `builder`, `spend` |

Three providers. `PlanProvider` holds the **meal builder** (the single source of
truth — a `BuilderItem[]` with `day`+`slot`) plus weekly spend; the Plan and Shop
screens are views over it. `CookbookProvider` holds the saved-dish collections
(max 3). Budget/diets come from `useProfile()`.

## Persistence layer

`src/lib/storage.ts` is a thin JSON wrapper:

```ts
loadJSON<T>(key, fallback): Promise<T>   // get + JSON.parse, fallback on miss/error
saveJSON<T>(key, value): Promise<void>   // JSON.stringify + set, best-effort
StorageKeys = { profile, spend, builder, cookbooks }
```

Everything is on-device; nothing is sent to a server. (Privacy-first was a founding
principle and still holds.)

## The "seam" pattern (swap mock for real later)

Two places are designed so a real implementation can drop in without touching UI:

- **`decide()`** in `src/lib/decision/engine.ts` — takes a `DecisionContext`,
  returns `MealOption[]`. Today it's a local mock; later it can be a server LLM
  call. The screen never changes.
- **`src/lib/ocr.ts`** — `scanReceipt()` / `captureMealPhoto()` return canned data.
  Replace the bodies with a real camera + OCR/vision call; signatures stay.

## Data flow example (Plan → Shop)

1. User picks craving tags in `PlanSetup` → `usePlan().generate(cravings)`.
2. `generatePlan()` (`src/lib/plan/planner.ts`) builds a `WeekPlan` within budget.
3. `PlanProvider` stores it (state + AsyncStorage).
4. **Plan screen** reads `plan` and renders Today + the rest of the week.
5. **Shop screen** calls `buildShoppingList(plan)` to aggregate ingredients, and
   reads `spend` to compare real spend vs budget.

## Screen pattern

All scrollable screens follow the same shape (so they behave consistently):

```tsx
<ThemedView style={root}>
  <ScrollView contentContainerStyle={[content, {
        paddingTop: insets.top + Spacing.four,
        paddingBottom: BottomTabInset + Spacing.four }]}>
    <View style={inner /* maxWidth + gap */}>
      ...sections...
    </View>
  </ScrollView>
</ThemedView>
```

This is why every screen scrolls and respects the notch + tab bar.
