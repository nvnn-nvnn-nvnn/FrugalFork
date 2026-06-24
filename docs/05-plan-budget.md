# 05 — Plan & Budget

> ⚠️ **Consolidated.** The old auto-generated `WeekPlan` (generatePlan, MealBrowser,
> regenerate, day selector, 7-day grid) was removed. The **meal builder is now the
> single source of truth**: a flat `BuilderItem[]` the user fills from Decide. The
> Plan and Shop are views over it. Notes below describe the *current* model; older
> sections kept only where still accurate.

## Current model

- **`BuilderItem`** (`src/lib/plan/types.ts`) is the one "planned meal":
  `{ recipeId, slot, addedAt, eaten, prepped, photo }`.
- **`PlanProvider`** (`src/lib/plan/context.tsx`) holds `builder: BuilderItem[]`
  (persisted, key `snackplan.builder.v1`) + weekly `spend`. Actions:
  `addToBuilder`, `removeFromBuilder`, `clearBuilder`, `toggleEaten`,
  `togglePrepped`, `setPhoto`, `addSpend`.
- **Plan screen** (`src/app/(tabs)/plan.tsx`): a **Mon–Sun day editor**. Each
  `BuilderItem` carries a `day` (0=Mon..6=Sun) + `slot`. Pick a day → its
  Breakfast/Lunch/Dinner show, each slot with its meals and an **inline "+ Add a
  dish" picker** (diet-filtered recipes) to set recipes per day. A weekly
  `BudgetBar` (`builderCost` over the whole builder vs the profile's weekly budget)
  plus a per-day subtotal; per-meal **I ate this / meal prep / photo / remove**, and
  tap-through to the dish detail. Decide quick-adds to **today**; the Plan is where
  you arrange across the week.
- **Helpers** (`src/lib/plan/planner.ts`): `builderCost`, `builderCalories`,
  `buildShoppingList` — all over `BuilderItem[]`.
- Dishes are added from **Decide** (slot tabs → add). Diet filtering happens there.

---

# (historical) Weekly Plan & Budget

This is the heart of the app: generate a 7-day plan of cheap, good food that fits
the user's weekly grocery budget.

## Files

| File | Role |
|------|------|
| `src/lib/plan/types.ts` | Slot, Ingredient, Recipe, PlannedMeal, DayPlan, WeekPlan, ShoppingItem |
| `src/lib/plan/recipes.ts` | The frugal recipe library + craving tags |
| `src/lib/plan/planner.ts` | `generatePlan`, cost/calorie helpers, `buildShoppingList` |
| `src/lib/plan/context.tsx` | `PlanProvider` + `usePlan()` — plan + spend state |
| `src/components/plan/meal-browser.tsx` | Browse meals by category, pick dishes into the week |
| `src/components/plan/budget-bar.tsx` | Reusable spend-vs-budget progress bar |
| `src/app/plan.tsx` | The Plan screen |

## Data model (`types.ts`)

- `Slot` = `'breakfast' | 'lunch' | 'dinner'` — the **3 subsections per day**.
- `Recipe` — `{ id, title, emoji, slots[], cost, calories, health, cheap, tags[],
  ingredients[] }`. Costs are rough per-serving dollar estimates.
- `PlannedMeal` — `{ recipeId, prepped, photo }` (prepped + meal-photo state).
- `DayPlan` — `Record<Slot, PlannedMeal | null>`.
- `WeekPlan` — `{ weekStart, days: Record<isoDate, DayPlan>, cravings, budget }`.

## Recipe library (`recipes.ts`)

~16 student-friendly recipes (rice & beans, veg pasta, fried rice, lentil soup,
chickpea curry, etc.) with realistic low costs ($0.60–$2.60/serving), calories,
a short health line, a `cheap` flag, and craving tags. `CRAVINGS` is the list of
tags the user picks from (comfort/asian/mexican/italian/healthy/high-protein/
quick/spicy). `RECIPES_BY_ID` is a lookup map.

## The planner (`planner.ts`)

- `generatePlan({ weekStart, days, cravings, budget })`:
  1. For each day × slot, `pickForSlot()` scores candidates by craving match,
     cheapness (when budgeting), and variety (penalizes repeats), with jitter.
  2. **Budget pass**: while the total exceeds budget, repeatedly swap the most
     expensive meal for the cheapest same-slot alternative until it fits (capped
     iterations). This is the "stay under budget" guarantee.
- `planCost(plan)` / `dayCost(day)` / `dayCalories(day)` — rollups used in the UI.
- `buildShoppingList(plan)` — see [06 — Shopping & OCR](./06-shopping-ocr.md).

## State (`context.tsx`)

`PlanProvider` (nested under ProfileProvider so it can read the budget):
- Loads `plan` and `spend` (per-week map) from AsyncStorage.
- Exposes: `generate(cravings)`, `regenerate()`, `shuffleMeal(date, slot)`,
  `togglePrepped(date, slot)`, `setPhoto(date, slot, uri)`, `addSpend(amount)`,
  `clearPlan()`, plus `weekStart`, `days`, and current-week `spend`.
- Spend is keyed by week-start ISO, so it **auto-resets each week**.

## The screen (`src/app/(tabs)/plan.tsx`)

- **Empty state** → `<MealBrowser>`: meals grouped into category sections (the
  craving filters you tap float to the top, the rest follow generically; diets are
  respected). Tap a meal to pick it; tap "›" to open its detail page. "Build my
  week (N picked)" → `generate(cravings, pickedIds)`. The picked ids are passed as
  `preferredIds` to `generatePlan`, which strongly biases them into their slots
  while still filling the rest within budget. With nothing picked it's "Surprise me".
- **Populated state**:
  - Header + **BudgetBar** ("Planned cost" vs budget) + "↻ Regenerate week".
  - **Today** section (its own heading, accent-bordered card) is separated from the
    **Rest of the week** section below. (`renderDay()` is shared by both.)
  - Each day card: weekday + date, daily `$cost · kcal`, and 3 `MealRow`s.
  - Each `MealRow`: emoji, slot label, recipe title, `$cost · kcal · health`, and
    action chips: **Meal prep** (toggle), **📷 Photo** (placeholder capture),
    **↻ Swap** (shuffle to a different recipe for that slot).

## BudgetBar (`components/plan/budget-bar.tsx`)

Shared budget-calculator UI: a track + fill showing `amount / budget`. Turns **red**
when over budget and shows "$X left" or "$Y over budget". Used on both Plan and Shop.
