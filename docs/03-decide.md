# 03 — Decide (recipe discovery + meal builder)

> ⚠️ **Rewritten.** The old "daily 3-option picker" (MealOption engine, mode
> selector, constraint input, "I ate this" toast) was removed. The notes below the
> divider describe that old iteration and are kept only for history. Current Decide:

## Current Decide (`src/app/(tabs)/index.tsx`)

Decide is now **dish discovery**. It recommends recipes from the library
(diet-filtered, cheapest first). Each card:
- taps through to the **dish detail** route (`/dish/[id]`);
- has **"Add to" chips** for the time-of-day slots the dish fits (Breakfast /
  Lunch / Dinner) — tapping collects it into the **meal builder**.

A banner shows the builder count and pushes the **`/builder`** archive
(`src/app/builder.tsx`), which lists collected dishes grouped by slot, each linking
to detail, with remove / clear-all.

The builder state lives in `PlanProvider` (`builder: BuilderItem[]`, persisted
under `StorageKeys.builder`): `addToBuilder`, `removeFromBuilder`, `clearBuilder`.

**"I ate this" is NOT here anymore** — it moved to the **Plan** screen (an `eaten`
toggle per planned meal). See [05 — Plan & Budget](./05-plan-budget.md).

### Cookbook (Decide → Discover | Cookbook)

Decide has a top-level **Discover / Cookbook** switch:
- **Discover**: the recommendation feed (above). Each dish has a **♡ save** that
  opens `SaveToCookbookSheet` (`src/components/cookbook/save-sheet.tsx`) to pick
  which cookbook(s) to save into, plus the "+ Add to … today" quick-add to the plan.
- **Cookbook**: `CookbookView` (`src/components/cookbook/cookbook-view.tsx`) —
  manage up to **3** cookbooks (`MAX_COOKBOOKS`): create, delete, and view saved
  dishes (tap → detail, ✕ to remove). An **Import a dish** button is a **stub**
  (toast) — real paste/Pinterest import is future.

State lives in `CookbookProvider` (`src/lib/cookbook/context.tsx`, persisted key
`snackplan.cookbooks.v1`). `Cookbook = { id, name, recipeIds[] }`.

> Planned next: **Plan** adds recipes *from* cookbooks; a push-based **groceries**
> flow (per-dish + "add all" focused screen). Not built yet.

---

# (historical) Decide — the daily loop

**Goal:** open the app when you're hungry, get **exactly 3 options**, tap one. The
"AI" job is *narrowing down*, not generating endless choices.

## Files

| File | Role |
|------|------|
| `src/lib/decision/types.ts` | Domain types + the `decide()` contract |
| `src/lib/decision/engine.ts` | Mock engine: scoring, constraint parsing, context inference |
| `src/components/decision/mode-selector.tsx` | Cook / Quick segmented control |
| `src/components/decision/constraint-input.tsx` | "tired, warm, 15 min" text input |
| `src/components/decision/option-card.tsx` | One selectable meal card |
| `src/app/index.tsx` | The Decide screen (orchestrates everything) |

## Types (`types.ts`)

- `DecisionMode` = `'cook' | 'quick' | 'order'` — note **`'order'` (order out) is
  currently disabled** (commented out of the selector in `mode-selector.tsx`), so
  only Cook and Quick show. The type/data are intact for easy re-enable.
- `MealOption` — `{ id, title, blurb, emoji, mode, minutes, tags }`.
- `DecisionContext` — the ephemeral input to the engine: `{ mode, slot, weekday,
  constraint, excludeIds }`.
- `DecideFn` — `(context) => Promise<MealOption[]>`. **This is the seam** where a
  real LLM call would replace the mock.

## Engine (`engine.ts`)

- `POOL` — a hardcoded list of `MealOption`s per mode.
- `parseConstraint(text)` — turns "tired, warm, 15 min, no dishes" into tags +
  a max-minutes budget via regex/keyword matching.
- `scoreOption()` — scores each candidate by: explicit constraint tags (weighted
  highest), time budget penalty, time-of-day nudge, plus small random jitter.
- `decide()` — filters by mode, removes `excludeIds`, scores, returns the **top 3**.
  Has a tiny artificial delay so the UI's loading state is real (mirrors a future
  network call).
- Context helpers: `inferSlot()` (breakfast/lunch/dinner/late from the clock),
  `timeGreeting()` ("Good morning/afternoon/evening"), `decisionQuestion(slot)`
  ("What's for dinner?").

## Screen (`src/app/index.tsx`)

Header shows: greeting + **"Today is {full date}"** + the slot question. Then:

1. **ModeSelector** (Cook / Quick) — switching re-runs `decide()`.
2. **ConstraintInput** — type a vibe, hit Decide.
3. **3 OptionCards** — tap to select.
4. **Actions row**: "None of these" (rejects the current 3, re-rolls) and
   "I ate this" (logs + confirms).

State of note:
- `rejectedIds` — session memory so "None of these" doesn't show the same picks.
- `recentEatenIds(3)` from `useWeek()` — cross-day anti-repetition (won't suggest
  what you ate the last 3 days).
- **Toast confirmation** — pressing "I ate this" logs the meal (`useWeek().logEaten`),
  shows a small auto-dismissing pill (~2.2s, `pointerEvents="none"` so it can't
  block taps), and immediately re-rolls fresh picks. (This replaced an earlier
  full-screen confirmation that covered the UI.)

## How it connects

The Decide screen writes to **WeekProvider** (`logEaten`, `logSuggestions`). That
log isn't shown on its own screen anymore (the old Week tab became Plan), but it
still powers the anti-repetition above.
