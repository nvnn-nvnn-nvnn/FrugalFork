# 09 — Known Gaps & Next Steps

An honest list of what is **stubbed, partial, or not yet wired**, so you know the
real state of things. (Kept current — older drift removed.)

## Placeholders (intentionally not real yet)

- **OCR / camera** (`src/lib/ocr.ts`) — `scanReceipt()` and `captureMealPhoto()`
  return canned data after a delay. No real camera or OCR. The Plan 📷 action and
  the Shop "Scan a receipt" button use these stubs.
  → *Make real:* add `expo-image-picker`/`expo-camera` + an OCR/vision API; keep
  the existing signatures.
- **Cookbook "Import a dish"** (`src/components/cookbook/cookbook-view.tsx`) — a
  stub that just shows a toast. Real paste/Pinterest import is a separate project
  (scraping or an API; imported dishes would also need their own recipe data so the
  detail page + shopping list work).
- **Dish detail tabs** (`src/lib/plan/dish-detail.ts`) — **Ingredients are real**
  (grouped by category from the recipe). **Cookware / Instructions / Reviews are
  derived placeholders**. Reviews especially await real user reviews/submissions.

## Stored but not used yet

- **Favorite meals & usual meals** (from onboarding, on the profile) are persisted
  but **do not influence** recommendations or the planner.
  → *Next:* give recipes a scoring bonus when they match the user's favorites/usuals.

## Not persisted yet

- **Staples list** (`src/app/(tabs)/staples.tsx`) lives in component state and
  resets on reload. → *Next:* persist (new `StorageKeys.staples`) and use it to
  favor recipes whose ingredients you already have. (Also: the user asked to turn
  Staples into a **settings/preferences** hub — editable diets/favorites/budget.)

## Disabled (kept in code)

- **"Order out" mode** lives in the recipe/decision data conceptually but the Decide
  flow is now recipe-based discovery; there is no order-out path.

## Current model recap (so gaps are in context)

- **Builder is the single source of truth** (`BuilderItem[]` in `PlanProvider`,
  each with `day` 0–6 + `slot`). Plan and Shop are views over it.
- **Decide** = Discover (B/L/D recommendations, diet-filtered) + **Cookbook**
  (save dishes into ≤3 collections). Quick-add puts a dish on **today**.
- **Plan** = Mon–Sun day editor; per-day B/L/D with an inline recipe picker, budget
  bar, and per-meal I-ate-this / prep / photo / remove.
- **Shop** = `buildShoppingList(builder)` + spend + receipt OCR (stub).

## Roadmap (rough priority)

1. **Phase 2 — Plan ← Cookbooks:** the Plan's "+ Add a dish" picker offers your
   cookbooks as a source (not just the full library).
2. **Phase 3 — Groceries push model:** a per-dish "add to groceries" on each Plan
   meal + a generic **"Add all"** that opens a focused selection screen; Shop
   becomes push-driven (you choose what's sent) instead of auto-aggregating.
3. **Real recipe import** (paste/Pinterest) → grow into a cheap-recipe sharing platform.
4. **Recipe ratings + real user submissions/reviews** (fills the detail Reviews tab).
5. **Wire favorites/usual meals** into recommendation + planner scoring.
6. **Persist staples** + Staples → settings/preferences hub; use staples in scoring.
7. **Move a meal to another day** on the Plan (reassign without remove/re-add).
8. **Calorie export** (share sheet); **editable budget** in-app.
9. **Gamify the Plan** (streaks/incentives for sticking to plan & budget).
10. **Order groceries directly** from the shopping list (integration/affiliate).
11. **App icon** — still the Expo default (`assets/images/icon.png` + adaptive icons).
12. **Real OCR/camera**; optional **backend/sync** (everything is on-device today).

## Health check

- Type-check the whole project anytime (run from `SnackPlan/`):
  `npx tsc --noEmit -p tsconfig.json`. It currently passes.
- Can't run the app in this dev env — routing/UI changes need on-device testing.
