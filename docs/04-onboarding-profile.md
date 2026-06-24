# 04 — Onboarding & Profile

**Goal:** ask three quick questions on first launch so the app knows the user from
day one, and persist the answers.

## Files

| File | Role |
|------|------|
| `src/components/onboarding/onboarding.tsx` | The 3-step first-launch flow |
| `src/lib/profile/context.tsx` | `ProfileProvider` + `useProfile()` — stores answers |
| `src/components/tag-input.tsx` | Reused "add chips" control (favorites / usual meals) |

## The profile (`profile/context.tsx`)

```ts
type UserProfile = {
  onboarded: boolean;
  favoriteMeals: string[];     // strongest taste signal
  usualMeals: string[];        // everyday baseline
  diets: string[];             // dietary lifestyle / restrictions
  weeklyGroceryBudget: number | null;
};
```

`ProfileProvider`:
- Loads the profile from AsyncStorage (`StorageKeys.profile`) on mount; sets `ready`.
- `update(patch)` — merge + persist.
- `completeOnboarding(answers)` — save answers and set `onboarded: true`.

## The gate

`AppGate` in `src/app/_layout.tsx`:
- `!ready` → blank themed screen (splash sits on top while loading).
- `!profile.onboarded` → `<Onboarding />`.
- otherwise → `<AppTabs />`.

So onboarding shows exactly once; after that, the persisted `onboarded` flag skips it.

## The flow (`onboarding.tsx`)

A 4-step wizard with progress dots and Back/Continue:

1. **What do you love to eat?** → `favoriteMeals` (TagInput + suggestion chips).
2. **What do you usually eat?** → `usualMeals`.
3. **Any dietary needs?** → `diets` (multi-select chips: vegetarian, vegan,
   pescatarian, low-carb, gluten-free, dairy-free, halal, kosher). Optional — skip if none.
4. **Weekly grocery spend?** → `weeklyGroceryBudget` (big `$` number input +
   preset chips $30/$60/$100/$150).

On the last step, **"Start deciding"** calls `completeOnboarding(...)`.

## TagInput (`components/tag-input.tsx`)

A small reusable control used here and on the Staples screen:
- Text field + **Add** button → adds a lowercased, de-duped chip.
- Tap a chip to remove it.
- Optional `suggestions` render as quick-add outline chips.

## What's wired vs. not

- **Budget** → used by the planner ([05](./05-plan-budget.md)).
- **Diets** → used by the planner: recipes are filtered against the selected diets
  via `src/lib/plan/diets.ts` (rule-based — each recipe declares what it `contains`,
  each diet declares what it forbids). Safe fallback: if a diet is so strict that a
  slot has no compliant recipe, the planner shows all options rather than a blank.
- **favoriteMeals / usualMeals** → still stored but **not yet** influencing
  recipe/decision scoring. See [09 — Gaps & Next Steps](./09-gaps-next-steps.md).
