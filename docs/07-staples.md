# 07 — Settings (user info)

The 4th tab is **Settings** (`src/app/(tabs)/settings.tsx`) — the hub for the
user's own info. Everything here reads from and writes to the **profile**
(`ProfileProvider`), saving automatically on change via `update(patch)`.

> This replaced the old standalone **Staples** tab; staples are now one section
> here (and are finally persisted on the profile).

## Sections

| Section | Edits (`UserProfile` field) | Control |
|---------|------------------------------|---------|
| Dietary lifestyle | `diets` | multi-select chips (from `DIETS`) |
| Weekly grocery budget | `weeklyGroceryBudget` | `$` number input + preset chips |
| Favorite meals | `favoriteMeals` | `TagInput` |
| Usual meals | `usualMeals` | `TagInput` |
| Staples | `staples` | `TagInput` |

`TagInput` (`src/components/tag-input.tsx`) is the shared add/remove-chips control
(also used in onboarding). Diets feed the planner & Discover filtering; budget feeds
every budget bar; favorites/usuals/staples are stored (favorites/usuals not yet
wired into scoring — see [09](./09-gaps-next-steps.md)).

## How it connects

- `useProfile().profile` provides current values; `useProfile().update({...})`
  persists edits immediately (write-through to AsyncStorage, key `profile`).
- Onboarding ([04](./04-onboarding-profile.md)) seeds these once; Settings lets the
  user change them anytime.
